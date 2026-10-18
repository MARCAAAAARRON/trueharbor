<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'subtotal_cents' => $this->subtotal_cents,
            'shipping_cents' => $this->shipping_cents,
            'total_cents' => $this->total_cents,
            'formatted_subtotal' => '₱' . number_format($this->subtotal_cents / 100, 2),
            'formatted_shipping' => '₱' . number_format($this->shipping_cents / 100, 2),
            'formatted_total' => '₱' . number_format($this->total_cents / 100, 2),
            'shipping_address' => $this->shipping_address,
            'payment_intent_id' => $this->payment_intent_id,
            'client_secret' => $this->when(isset($this->client_secret), $this->client_secret),
            'payment_intent_client_secret' => $this->when(isset($this->client_secret), $this->client_secret),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
        ];
    }
}
