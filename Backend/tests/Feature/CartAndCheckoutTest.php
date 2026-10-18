<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartAndCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;
    protected Product $product1;
    protected Product $product2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => Role::Customer,
        ]);

        $this->category = Category::create([
            'name' => 'Coastal Apparel',
            'slug' => 'coastal-apparel',
        ]);

        $this->product1 = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Harbor Windbreaker',
            'slug' => 'harbor-windbreaker',
            'description' => 'Weatherproof coastal jacket.',
            'price_cents' => 129000, // ₱1,290.00
            'stock' => 10,
            'is_active' => true,
        ]);

        $this->product2 = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Canvas Tote Bag',
            'slug' => 'canvas-tote-bag',
            'description' => 'Durable organic cotton tote.',
            'price_cents' => 45000, // ₱450.00
            'stock' => 5,
            'is_active' => true,
        ]);
    }

    public function test_user_can_view_empty_cart(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/cart');

        $response->assertOk()
            ->assertJsonPath('data.total_items', 0)
            ->assertJsonPath('data.subtotal_cents', 0);
    }

    public function test_user_can_add_item_to_cart_and_update_quantity(): void
    {
        Sanctum::actingAs($this->user);

        // Add 2 of product1
        $response = $this->postJson('/api/cart', [
            'product_id' => $this->product1->id,
            'quantity' => 2,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.total_items', 2)
            ->assertJsonPath('data.subtotal_cents', 258000);

        $cartItemId = $response->json('data.items.0.id');

        // Update quantity to 3
        $updateResponse = $this->putJson("/api/cart/{$cartItemId}", [
            'quantity' => 3,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('data.total_items', 3)
            ->assertJsonPath('data.subtotal_cents', 387000);

        // Setting quantity to 0 removes the item
        $deleteResponse = $this->putJson("/api/cart/{$cartItemId}", [
            'quantity' => 0,
        ]);

        $deleteResponse->assertOk()
            ->assertJsonPath('data.total_items', 0)
            ->assertJsonPath('data.subtotal_cents', 0);
    }

    public function test_cannot_add_more_than_available_stock(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/cart', [
            'product_id' => $this->product2->id,
            'quantity' => 6, // stock is 5
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }

    public function test_successful_checkout_creates_order_and_decrements_stock(): void
    {
        Sanctum::actingAs($this->user);

        // Add 2 windbreakers (2 * 129000 = 258000, qualifies for free shipping >= 250000)
        $this->postJson('/api/cart', [
            'product_id' => $this->product1->id,
            'quantity' => 2,
        ])->assertOk();

        $shippingAddress = [
            'name' => 'John Doe',
            'line1' => 'Unit 401 Coral Tower, Seaside Blvd',
            'city' => 'Pasay',
            'province' => 'Metro Manila',
            'postal_code' => '1300',
            'phone' => '+639171234567',
        ];

        $checkoutResponse = $this->postJson('/api/checkout', [
            'shipping_address' => $shippingAddress,
        ]);

        $checkoutResponse->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.subtotal_cents', 258000)
            ->assertJsonPath('data.shipping_cents', 0) // Free shipping
            ->assertJsonPath('data.total_cents', 258000)
            ->assertJsonStructure(['data' => ['client_secret', 'payment_intent_id']]);

        // Verify stock decremented from 10 to 8
        $this->assertEquals(8, $this->product1->fresh()->stock);

        // Verify cart is now empty
        $cartResponse = $this->getJson('/api/cart');
        $cartResponse->assertOk()
            ->assertJsonPath('data.total_items', 0);

        // Verify user can view their order
        $orderId = $checkoutResponse->json('data.id');
        $orderResponse = $this->getJson("/api/orders/{$orderId}");
        $orderResponse->assertOk()
            ->assertJsonPath('data.id', $orderId)
            ->assertJsonPath('data.shipping_address.city', 'Pasay');
    }

    public function test_flat_shipping_applied_when_subtotal_under_threshold(): void
    {
        Sanctum::actingAs($this->user);

        // Add 1 tote bag: 45000 cents (< 250000 cents threshold)
        $this->postJson('/api/cart', [
            'product_id' => $this->product2->id,
            'quantity' => 1,
        ])->assertOk();

        $shippingAddress = [
            'name' => 'Jane Smith',
            'line1' => '12 Marina Way',
            'city' => 'Cebu City',
            'province' => 'Cebu',
            'postal_code' => '6000',
            'phone' => '+639189876543',
        ];

        $response = $this->postJson('/api/checkout', [
            'shipping_address' => $shippingAddress,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.subtotal_cents', 45000)
            ->assertJsonPath('data.shipping_cents', 15000) // Flat ₱150 shipping
            ->assertJsonPath('data.total_cents', 60000);

        $this->assertEquals(4, $this->product2->fresh()->stock);
    }

    public function test_expired_orders_restore_inventory(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/cart', [
            'product_id' => $this->product1->id,
            'quantity' => 2,
        ]);

        $response = $this->postJson('/api/checkout', [
            'shipping_address' => [
                'name' => 'John Doe',
                'line1' => 'Seaside Blvd',
                'city' => 'Pasay',
                'province' => 'Metro Manila',
                'postal_code' => '1300',
                'phone' => '+639171234567',
            ],
        ]);

        $orderId = $response->json('data.id');
        $this->assertEquals(8, $this->product1->fresh()->stock);

        // Fast-forward order expiry
        Order::where('id', $orderId)->update([
            'expires_at' => now()->subMinutes(10),
        ]);

        $this->artisan('orders:expire-pending')
            ->expectsOutputToContain('Successfully expired 1 pending order(s)')
            ->assertExitCode(0);

        $order = Order::find($orderId);
        $this->assertEquals(OrderStatus::Expired, $order->status);
        $this->assertEquals(10, $this->product1->fresh()->stock);
    }
}
