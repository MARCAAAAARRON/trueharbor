<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminProductController extends Controller
{
    /**
     * List all products with optional filters
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::with('category')->orderBy('id');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('search')) {
            $term = trim($request->query('search'));
            $likeOp = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where('name', $likeOp, "%{$term}%");
        }

        $products = $query->paginate(20);

        return ProductResource::collection($products);
    }

    /**
     * List low-stock products (stock <= 5)
     */
    public function lowStock(): AnonymousResourceCollection
    {
        $products = Product::with('category')
            ->where('stock', '<=', 5)
            ->orderBy('stock')
            ->get();

        return ProductResource::collection($products);
    }

    /**
     * Create a new product
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'description' => ['required', 'string'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'image_path' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slug = !empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        // Ensure unique slug
        $originalSlug = $slug;
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'],
            'price_cents' => $validated['price_cents'],
            'stock' => $validated['stock'],
            'image_path' => $validated['image_path'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return (new ProductResource($product->load('category')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update an existing product
     */
    public function update(Request $request, int $id): ProductResource
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product->id)],
            'description' => ['sometimes', 'string'],
            'price_cents' => ['sometimes', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'image_path' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $product->update($validated);

        return new ProductResource($product->load('category'));
    }

    /**
     * Quick stock adjustment (increment, decrement, or set)
     */
    public function updateStock(Request $request, int $id): ProductResource
    {
        $validated = $request->validate([
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $product = Product::findOrFail($id);
        $product->update(['stock' => $validated['stock']]);

        return new ProductResource($product->load('category'));
    }

    /**
     * Delete or deactivate a product
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product removed successfully.']);
    }
}
