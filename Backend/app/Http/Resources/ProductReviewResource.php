<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductReviewResource extends JsonResource
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
            'product_id' => $this->product_id,
            'rating' => $this->rating,
            'title' => $this->title,
            'comment' => $this->comment,
            'is_verified_purchase' => $this->is_verified_purchase,
            'created_at' => $this->created_at?->toIso8601String(),
            'formatted_date' => $this->created_at?->format('M d, Y'),
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name ?? 'Harbor Customer',
            ],
        ];
    }
}
