<?php

namespace App\Enums;

enum Role: string
{
    case Customer = 'customer';
    case Admin = 'admin';

    public function isAdmin(): bool
    {

        return $this === self::Admin;
    }
}
