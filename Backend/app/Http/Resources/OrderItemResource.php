<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'unit_price_cents' => $this->unit_price_cents,
            'formatted_unit_price' => '₱' . number_format($this->unit_price_cents / 100, 2),
            'quantity' => $this->quantity,
            'line_total_cents' => $this->line_total_cents,
            'formatted_line_total' => '₱' . number_format($this->line_total_cents / 100, 2),
        ];
    }
}
