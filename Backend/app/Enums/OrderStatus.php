<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Payment',
            self::Paid => 'Paid & Processing',
            self::Shipped => 'Shipped',
            self::Delivered => 'Delivered',
            self::Cancelled => 'Cancelled',
            self::Expired => 'Expired',
        };
    }

    public function canTransitionTo(OrderStatus $next): bool
    {
        return match ($this) {
            self::Pending => in_array($next, [self::Paid, self::Expired, self::Cancelled], true),
            self::Paid => in_array($next, [self::Shipped, self::Cancelled], true),
            self::Shipped => in_array($next, [self::Delivered], true),
            self::Delivered, self::Expired, self::Cancelled => false,
        };
    }
}
