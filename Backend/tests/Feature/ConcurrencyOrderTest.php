<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ConcurrencyOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_two_simultaneous_buyers_competing_for_last_unit_results_in_exactly_one_success(): void
    {
        $category = Category::create([
            'name' => 'Coastal Provisions',
            'slug' => 'coastal-provisions',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Limited Lantern Cap',
            'slug' => 'limited-lantern-cap',
            'description' => 'Rare coastal cap.',
            'stock' => 1,
            'price_cents' => 100000,
            'is_active' => true,
        ]);

        $userA = User::factory()->create(['role' => Role::Customer]);
        $userB = User::factory()->create(['role' => Role::Customer]);

        $orderService = app(OrderService::class);
        $shippingAddress = [
            'name' => 'Test Sailor',
            'line1' => 'Port of Manila',
            'city' => 'Manila',
            'province' => 'NCR',
            'postal_code' => '1000',
            'phone' => '+639170001122',
        ];

        // Add 1 to user A's cart
        $this->actingAs($userA)->postJson('/api/cart', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        // Add 1 to user B's cart
        $this->actingAs($userB)->postJson('/api/cart', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        // Buyer A succeeds
        $orderA = $orderService->createFromCart($userA, $shippingAddress);
        $this->assertNotNull($orderA);
        $this->assertEquals(0, $product->fresh()->stock);

        // Buyer B tries to checkout with their cart, but unit is now sold out
        $this->expectException(ValidationException::class);
        $orderService->createFromCart($userB, $shippingAddress);

        // Invariant: stock must NEVER be negative
        $this->assertEquals(0, $product->fresh()->stock);
    }
}
