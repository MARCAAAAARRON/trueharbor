<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class OrderService
{
    /**
     * Create a pending order from a user's cart inside a strict database transaction
     * with row-level locks on products.
     *
     * @param User $user
     * @param array $shippingAddress
     * @return Order
     * @throws ValidationException
     */
    public function createFromCart(
        User $user,
        array $shippingAddress,
        string $paymentMethod = 'card',
        ?array $paymentDetails = null
    ): Order
    {
        $cart = Cart::with('items')->firstOrCreate(['user_id' => $user->id]);

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => ['Your cart is empty. Please add items before checking out.'],
            ]);
        }

        $order = DB::transaction(function () use ($cart, $user, $shippingAddress, $paymentMethod, $paymentDetails) {
            $productIds = $cart->items->pluck('product_id')->sort()->values()->all();

            // Row-level lock ordered by ID to eliminate overselling and deadlocks
            $products = Product::whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotalCents = 0;

            // 1. Validate availability and stock
            foreach ($cart->items as $item) {
                /** @var Product|null $product */
                $product = $products->get($item->product_id);

                if (!$product || !$product->is_active) {
                    throw ValidationException::withMessages([
                        'cart' => ["Item '{$item->product_id}' is no longer available."],
                    ]);
                }

                if ($product->stock < $item->quantity) {
                    throw ValidationException::withMessages([
                        'stock' => ["Only {$product->stock} unit(s) of '{$product->name}' available in stock."],
                    ]);
                }

                $subtotalCents += $product->price_cents * $item->quantity;
            }

            // 2. Shipping calculation: Flat ₱150 (15000 cents), free for orders >= ₱2,500 (250000 cents)
            $shippingCents = $subtotalCents >= 250000 ? 0 : 15000;
            $totalCents = $subtotalCents + $shippingCents;

            // 3. Create the pending order record
            $order = Order::create([
                'user_id' => $user->id,
                'status' => OrderStatus::Pending,
                'subtotal_cents' => $subtotalCents,
                'shipping_cents' => $shippingCents,
                'total_cents' => $totalCents,
                'shipping_address' => $shippingAddress,
                'payment_method' => $paymentMethod,
                'payment_details' => $paymentDetails,
                'expires_at' => now()->addMinutes(30),
            ]);

            // 4. Create snapshot order items & decrement stock
            foreach ($cart->items as $item) {
                /** @var Product $product */
                $product = $products->get($item->product_id);

                $product->decrement('stock', $item->quantity);

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price_cents' => $product->price_cents,
                    'quantity' => $item->quantity,
                    'line_total_cents' => $product->price_cents * $item->quantity,
                ]);
            }

            // 5. Clear the user's cart
            $cart->items()->delete();

            return $order;
        });

        // 6. Create Stripe PaymentIntent
        $this->attachPaymentIntent($order);

        return $order->load(['items', 'user']);
    }

    /**
     * Attach a Stripe PaymentIntent or mock in development
     */
    protected function attachPaymentIntent(Order $order): void
    {
        app(PaymentService::class)->createPaymentIntent($order);
    }

    /**
     * Mark an order as paid from Stripe webhook
     */
    public function markAsPaid(string $paymentIntentId): ?Order
    {
        $order = Order::where('payment_intent_id', $paymentIntentId)->first();

        if (!$order) {
            return null;
        }

        if ($order->status === OrderStatus::Pending) {
            $order->update([
                'status' => OrderStatus::Paid,
                'paid_at' => now(),
            ]);
        }

        return $order;
    }

    /**
     * Release expired orders and restore inventory
     */
    public function expirePendingOrders(): int
    {
        $expiredOrders = Order::pending()
            ->where('expires_at', '<', now())
            ->with('items')
            ->get();

        $count = 0;

        foreach ($expiredOrders as $order) {
            DB::transaction(function () use ($order) {
                $order->update(['status' => OrderStatus::Expired]);

                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                    }
                }
            });

            $count++;
        }

        return $count;
    }

    /**
     * Cancel an order (by customer or admin) and restore inventory
     */
    public function cancelOrder(Order $order, User $user): Order
    {
        if ($order->user_id !== $user->id && !$user->role->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        return DB::transaction(function () use ($order) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if (!$lockedOrder->status->canTransitionTo(OrderStatus::Cancelled)) {
                throw ValidationException::withMessages([
                    'status' => ["Cannot cancel an order in '{$lockedOrder->status->value}' status."],
                ]);
            }

            // Restore product stock
            foreach ($lockedOrder->items as $item) {
                if ($item->product_id) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
            }

            $lockedOrder->update(['status' => OrderStatus::Cancelled]);

            return $lockedOrder->fresh(['items', 'user']);
        });
    }

    /**
     * Transition order status by admin with state machine verification
     */
    public function updateOrderStatus(
        Order $order,
        OrderStatus $nextStatus,
        ?string $carrier = null,
        ?string $trackingNumber = null
    ): Order
    {
        return DB::transaction(function () use ($order, $nextStatus, $carrier, $trackingNumber) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if (!$lockedOrder->status->canTransitionTo($nextStatus)) {
                throw ValidationException::withMessages([
                    'status' => ["Cannot transition order from '{$lockedOrder->status->value}' to '{$nextStatus->value}'."],
                ]);
            }

            // If cancelling via admin transition, restore stock
            if ($nextStatus === OrderStatus::Cancelled) {
                foreach ($lockedOrder->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                    }
                }
            }

            $updateData = ['status' => $nextStatus];
            if ($nextStatus === OrderStatus::Paid && !$lockedOrder->paid_at) {
                $updateData['paid_at'] = now();
            }
            if ($nextStatus === OrderStatus::Shipped) {
                $updateData['shipped_at'] = now();
                if ($carrier) {
                    $updateData['carrier'] = $carrier;
                }
                if ($trackingNumber) {
                    $updateData['tracking_number'] = $trackingNumber;
                }
            }
            if ($nextStatus === OrderStatus::Delivered) {
                $updateData['delivered_at'] = now();
            }

            $lockedOrder->update($updateData);

            if ($nextStatus === OrderStatus::Shipped) {
                $this->dispatchShippingNotification($lockedOrder);
            }

            return $lockedOrder->fresh(['items', 'user']);
        });
    }

    protected function dispatchShippingNotification(Order $order): void
    {
        try {
            $order->loadMissing(['user', 'items']);
            if ($order->user && $order->user->email) {
                \Illuminate\Support\Facades\Mail::to($order->user->email)
                    ->send(new \App\Mail\OrderShippedMail($order));
            }
        } catch (\Throwable $e) {
            Log::warning("Could not send shipping notification for Order #{$order->id}: " . $e->getMessage());
        }
    }
}
