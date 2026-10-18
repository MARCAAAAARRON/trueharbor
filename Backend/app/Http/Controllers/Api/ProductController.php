<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $params = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0'],
            'sort' => ['nullable', 'in:newest,price_asc,price_desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Product::query()->with('category')->active();

        if (!empty($params['q'])) {
            $term = addcslashes($params['q'], '%_\\');
            $query->where('name', 'ilike', "%{$term}%");
        }

        if (!empty($params['category'])) {
            $query->whereHas('category', fn($c) => $c->where('slug', $params['category']));
        }

        if (isset($params['min_price'])) {
            $query->where('price_cents', '>=', $params['min_price']);
        }

        if (isset($params['max_price'])) {
            $query->where('price_cents', '<=', $params['max_price']);
        }

        match ($params['sort'] ?? 'newest') {
            'price_asc' => $query->orderBy('price_cents')->orderBy('id'),
            'price_desc' => $query->orderByDesc('price_cents')->orderBy('id'),
            default => $query->orderByDesc('id'),
        };

        return ProductResource::collection(
            $query->paginate($params['per_page'] ?? 12)->withQueryString()
        );
    }

    public function show(string $slug): ProductDetailResource
    {
        $product = Product::query()
            ->with('category')
            ->active()
            ->where('slug', $slug)
            ->firstOrFail();

        return new ProductDetailResource($product);
    }
}