<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CheckoutController extends Controller
{
    /**
     * Create a new pending order from the cart
     */
    public function store(Request $request, OrderService $orderService): OrderResource
    {
        $validated = $request->validate([
            'shipping_address' => ['required', 'array'],
            'shipping_address.name' => ['required', 'string', 'max:100'],
            'shipping_address.line1' => ['required', 'string', 'max:200'],
            'shipping_address.line2' => ['nullable', 'string', 'max:200'],
            'shipping_address.city' => ['required', 'string', 'max:100'],
            'shipping_address.province' => ['required', 'string', 'max:100'],
            'shipping_address.postal_code' => ['required', 'string', 'max:20'],
            'shipping_address.phone' => ['required', 'string', 'max:30'],
        ]);

        $order = $orderService->createFromCart($request->user(), $validated['shipping_address']);

        return new OrderResource($order);
    }

    /**
     * Show a specific order
     */
    public function show(Request $request, int $id): OrderResource
    {
        $order = Order::with('items')->findOrFail($id);

        if ($order->user_id !== $request->user()->id && !$request->user()->role->isAdmin()) {
            abort(403, 'Unauthorized access to order.');
        }

        return new OrderResource($order);
    }

    /**
     * List user orders (order history)
     */
    public function userOrders(Request $request): AnonymousResourceCollection
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with('items')
            ->orderByDesc('id')
            ->paginate(10);

        return OrderResource::collection($orders);
    }

    /**
     * Cancel an order (customer self-service)
     */
    public function cancel(Request $request, int $id, OrderService $orderService): OrderResource
    {
        $order = Order::findOrFail($id);

        $cancelled = $orderService->cancelOrder($order, $request->user());

        return new OrderResource($cancelled);
    }
}
