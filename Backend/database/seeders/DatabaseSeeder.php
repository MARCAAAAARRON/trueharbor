<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@trueharbor.test'],
            [
                'name' => 'Harbormaster Admin',
                'password' => bcrypt('password123'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'customer@trueharbor.test'],
            [
                'name' => 'Coastal Explorer',
                'password' => bcrypt('password123'),
                'role' => 'customer',
            ]
        );
    }
}
