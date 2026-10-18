<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'subtotal_cents',
        'shipping_cents',
        'total_cents',
        'shipping_address',
        'payment_intent_id',
        'payment_method',
        'payment_details',
        'carrier',
        'tracking_number',
        'expires_at',
        'paid_at',
        'shipped_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal_cents' => 'integer',
            'shipping_cents' => 'integer',
            'total_cents' => 'integer',
            'shipping_address' => 'array',
            'payment_details' => 'array',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function getTrackingUrlAttribute(): ?string
    {
        if (!$this->tracking_number) {
            return null;
        }

        return match (strtolower($this->carrier ?? '')) {
            'lbc' => "https://www.lbcexpress.com/track/?tracking_no={$this->tracking_number}",
            'jnt', 'j&t' => "https://www.jtexpress.ph/trajectoryQuery?bills={$this->tracking_number}",
            '2go' => "https://supplychain.2go.com.ph/CustomerSupport/etrace/index.asp?wb={$this->tracking_number}",
            'grab' => "https://express.grab.com/track/{$this->tracking_number}",
            default => null,
        };
    }

    public function getCarrierLabelAttribute(): ?string
    {
        if (!$this->carrier) {
            return null;
        }

        return match (strtolower($this->carrier)) {
            'lbc' => 'LBC Express',
            'jnt', 'j&t' => 'J&T Express',
            '2go' => '2GO Sea Solutions',
            'grab' => 'Grab Express',
            default => strtoupper($this->carrier),
        };
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', OrderStatus::Pending);
    }

    public function scopePaid($query)
    {
        return $query->where('status', OrderStatus::Paid);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', OrderStatus::Expired);
    }
}
