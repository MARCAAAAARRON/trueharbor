<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'subtotal_cents' => $this->subtotal_cents,
            'formatted_subtotal' => '₱' . number_format($this->subtotal_cents / 100, 2),
            'total_items' => $this->total_items,
        ];
    }
}
