<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    /**
     * List all orders across all customers with optional status filter
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::with(['items', 'user'])->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $term = trim($request->query('search'));
            $cleanId = ltrim(preg_replace('/[^0-9]/', '', $term), '0');

            $query->where(function ($q) use ($term, $cleanId) {
                if (!empty($cleanId)) {
                    $q->orWhere('id', (int) $cleanId);
                }
                $q->orWhereHas('user', function ($uq) use ($term) {
                    $uq->where('name', 'ilike', "%{$term}%")
                       ->orWhere('email', 'ilike', "%{$term}%");
                });
            });
        }

        $orders = $query->paginate(15);

        return OrderResource::collection($orders);
    }

    /**
     * View a single order
     */
    public function show(int $id): OrderResource
    {
        $order = Order::with(['items', 'user'])->findOrFail($id);

        return new OrderResource($order);
    }

    /**
     * Transition order status (e.g. pending -> paid -> shipped -> delivered, or cancelled)
     */
    public function updateStatus(Request $request, int $id, OrderService $orderService): OrderResource
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::enum(OrderStatus::class)],
        ]);

        $order = Order::findOrFail($id);
        $nextStatus = OrderStatus::from($validated['status']);

        $updatedOrder = $orderService->updateOrderStatus($order, $nextStatus);

        return new OrderResource($updatedOrder);
    }
}
