<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price_cents' => $this->price_cents,
            'formatted_price' => '₱' . number_format($this->price_cents / 100, 2),
            'stock' => $this->stock,
            'image_path' => $this->image_path,
            'image_url' => $this->image_path,
            'in_stock' => $this->stock > 0,
            'is_active' => $this->is_active,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'reviews_count' => (int) ($this->reviews_count ?? ($this->relationLoaded('reviews') ? $this->reviews->count() : 0)),
            'average_rating' => round((float) ($this->reviews_avg_rating ?? ($this->relationLoaded('reviews') ? ($this->reviews->count() > 0 ? $this->reviews->avg('rating') : 0.0) : 0.0)), 1),
        ];
    }
}
