<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    /**
     * Get the current user's cart
     */
    public function index(Request $request)
    {
        $cart = Cart::with(['items.product.category'])
            ->firstOrCreate(['user_id' => $request->user()->id]);

        return (new CartResource($cart))->response()->setStatusCode(200);
    }

    /**
     * Add an item to the cart
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $quantity = $validated['quantity'] ?? 1;

        $product = Product::active()->findOrFail($validated['product_id']);

        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        $item = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $product->id)
            ->first();

        $newQuantity = ($item ? $item->quantity : 0) + $quantity;

        if ($newQuantity > $product->stock) {
            throw ValidationException::withMessages([
                'quantity' => ["Cannot add {$quantity} more. Only {$product->stock} unit(s) available in stock."],
            ]);
        }

        if ($item) {
            $item->update(['quantity' => $newQuantity]);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => $quantity,
            ]);
        }

        return (new CartResource($cart->load(['items.product.category'])))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Update an item's quantity
     */
    public function update(Request $request, int $id): CartResource
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
        ]);

        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        $item = CartItem::where('cart_id', $cart->id)
            ->where('id', $id)
            ->with('product')
            ->firstOrFail();

        if ($validated['quantity'] === 0) {
            $item->delete();
        } else {
            if ($validated['quantity'] > $item->product->stock) {
                throw ValidationException::withMessages([
                    'quantity' => ["Only {$item->product->stock} unit(s) available in stock."],
                ]);
            }

            $item->update(['quantity' => $validated['quantity']]);
        }

        return new CartResource($cart->load(['items.product.category']));
    }

    /**
     * Remove an item from the cart
     */
    public function destroy(Request $request, int $id): CartResource
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        CartItem::where('cart_id', $cart->id)
            ->where('id', $id)
            ->delete();

        return new CartResource($cart->load(['items.product.category']));
    }

    /**
     * Clear all items from the cart
     */
    public function clear(Request $request): CartResource
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        $cart->items()->delete();

        return new CartResource($cart->load(['items.product.category']));
    }
}
