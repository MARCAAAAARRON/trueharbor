<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductReviewResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    /**
     * List all reviews for a product with summary metrics.
     */
    public function index(string|int $productId): JsonResponse
    {
        $product = Product::where('id', $productId)
            ->orWhere('slug', $productId)
            ->firstOrFail();

        $reviews = $product->reviews()
            ->with('user')
            ->latest()
            ->get();

        $totalReviews = $reviews->count();
        $averageRating = $totalReviews > 0 ? round((float) $reviews->avg('rating'), 1) : 0.0;

        $distribution = [];
        for ($star = 5; $star >= 1; $star--) {
            $count = $reviews->where('rating', $star)->count();
            $percentage = $totalReviews > 0 ? round(($count / $totalReviews) * 100) : 0;
            $distribution[$star] = [
                'stars' => $star,
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return response()->json([
            'data' => ProductReviewResource::collection($reviews),
            'summary' => [
                'total_reviews' => $totalReviews,
                'average_rating' => $averageRating,
                'rating_distribution' => $distribution,
            ],
        ]);
    }

    /**
     * Submit or update a review for a product.
     */
    public function store(Request $request, string|int $productId): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:150'],
            'comment' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        $product = Product::where('id', $productId)
            ->orWhere('slug', $productId)
            ->firstOrFail();

        $user = $request->user();

        // Check if user has purchased this product in a paid order
        $isVerified = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Paid)
            ->whereHas('items', fn($q) => $q->where('product_id', $product->id))
            ->exists();

        $review = ProductReview::updateOrCreate(
            [
                'product_id' => $product->id,
                'user_id' => $user->id,
            ],
            [
                'rating' => $validated['rating'],
                'title' => $validated['title'] ?? null,
                'comment' => $validated['comment'],
                'is_verified_purchase' => $isVerified,
            ]
        );

        $review->load('user');

        return response()->json([
            'message' => 'Review submitted successfully',
            'review' => new ProductReviewResource($review),
        ], 201);
    }

    /**
     * Delete a review.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $review = ProductReview::findOrFail($id);
        $user = $request->user();

        // Authorize: Owner or Admin
        if ($review->user_id !== $user->id && $user->role !== Role::Admin) {
            return response()->json([
                'message' => 'Unauthorized to remove this review',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully',
        ]);
    }
}
