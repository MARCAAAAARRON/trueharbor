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

class AdminOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $admin;
    protected Category $category;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'role' => Role::Customer,
        ]);

        $this->admin = User::factory()->create([
            'role' => Role::Admin,
        ]);

        $this->category = Category::create([
            'name' => 'Marine Hardware',
            'slug' => 'marine-hardware',
        ]);

        $this->product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Galvanized Anchor',
            'slug' => 'galvanized-anchor',
            'description' => 'Heavy duty coastal anchor.',
            'price_cents' => 350000,
            'stock' => 3, // Low stock <= 5
            'is_active' => true,
        ]);
    }

    public function test_customer_cannot_access_admin_endpoints(): void
    {
        Sanctum::actingAs($this->customer);

        $this->getJson('/api/admin/orders')->assertForbidden();
        $this->getJson('/api/admin/products')->assertForbidden();
        $this->getJson('/api/admin/products/low-stock')->assertForbidden();
    }

    public function test_admin_can_view_orders_and_transition_status(): void
    {
        // Customer creates order
        Sanctum::actingAs($this->customer);
        $this->postJson('/api/cart', ['product_id' => $this->product->id, 'quantity' => 1])->assertOk();

        $checkoutResponse = $this->postJson('/api/checkout', [
            'shipping_address' => [
                'name' => 'John Sailor',
                'line1' => 'Pier 4',
                'city' => 'Manila',
                'province' => 'Metro Manila',
                'postal_code' => '1000',
                'phone' => '+639171112233',
            ],
        ]);
        $orderId = $checkoutResponse->json('data.id');

        // Admin accesses orders
        Sanctum::actingAs($this->admin);

        $listResponse = $this->getJson('/api/admin/orders');
        $listResponse->assertOk()
            ->assertJsonPath('data.0.id', $orderId);

        // Transition: pending -> paid
        $paidResponse = $this->patchJson("/api/admin/orders/{$orderId}/status", [
            'status' => 'paid',
        ]);
        $paidResponse->assertOk()
            ->assertJsonPath('data.status', 'paid');

        // Transition: paid -> shipped
        $shippedResponse = $this->patchJson("/api/admin/orders/{$orderId}/status", [
            'status' => 'shipped',
        ]);
        $shippedResponse->assertOk()
            ->assertJsonPath('data.status', 'shipped');

        // Transition: shipped -> delivered
        $deliveredResponse = $this->patchJson("/api/admin/orders/{$orderId}/status", [
            'status' => 'delivered',
        ]);
        $deliveredResponse->assertOk()
            ->assertJsonPath('data.status', 'delivered');

        // Disallowed: delivered cannot transition back to pending
        $invalidResponse = $this->patchJson("/api/admin/orders/{$orderId}/status", [
            'status' => 'pending',
        ]);
        $invalidResponse->assertStatus(422);
    }

    public function test_admin_can_view_low_stock_and_update_inventory(): void
    {
        Sanctum::actingAs($this->admin);

        // Product has stock = 3 <= 5
        $lowStockResponse = $this->getJson('/api/admin/products/low-stock');
        $lowStockResponse->assertOk()
            ->assertJsonPath('data.0.name', 'Galvanized Anchor');

        // Quick restock to 20
        $updateStockResponse = $this->patchJson("/api/admin/products/{$this->product->id}/stock", [
            'stock' => 20,
        ]);
        $updateStockResponse->assertOk()
            ->assertJsonPath('data.stock', 20);

        $this->assertEquals(20, $this->product->fresh()->stock);
    }

    public function test_customer_can_cancel_order_and_restore_stock(): void
    {
        Sanctum::actingAs($this->customer);
        $this->postJson('/api/cart', ['product_id' => $this->product->id, 'quantity' => 2])->assertOk();

        $checkoutResponse = $this->postJson('/api/checkout', [
            'shipping_address' => [
                'name' => 'John Sailor',
                'line1' => 'Pier 4',
                'city' => 'Manila',
                'province' => 'Metro Manila',
                'postal_code' => '1000',
                'phone' => '+639171112233',
            ],
        ]);
        $orderId = $checkoutResponse->json('data.id');

        // Initial stock 3 - 2 = 1
        $this->assertEquals(1, $this->product->fresh()->stock);

        // Customer cancels order
        $cancelResponse = $this->postJson("/api/orders/{$orderId}/cancel");
        $cancelResponse->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        // Stock restored back to 3
        $this->assertEquals(3, $this->product->fresh()->stock);
    }

    public function test_admin_can_create_product_with_slug_generation(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/admin/products', [
            'category_id' => $this->category->id,
            'name' => 'Brass Ship Bell',
            'description' => 'Traditional ringing brass bell for quarterdecks.',
            'price_cents' => 89000,
            'stock' => 12,
            'image_path' => 'https://res.cloudinary.com/trueharbor/image/upload/v1/provisions/ship-bell.jpg',
            'is_active' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Brass Ship Bell')
            ->assertJsonPath('data.slug', 'brass-ship-bell')
            ->assertJsonPath('data.price_cents', 89000)
            ->assertJsonPath('data.stock', 12)
            ->assertJsonPath('data.image_path', 'https://res.cloudinary.com/trueharbor/image/upload/v1/provisions/ship-bell.jpg');

        $this->assertDatabaseHas('products', [
            'name' => 'Brass Ship Bell',
            'slug' => 'brass-ship-bell',
            'stock' => 12,
            'image_path' => 'https://res.cloudinary.com/trueharbor/image/upload/v1/provisions/ship-bell.jpg',
        ]);
    }

    public function test_admin_can_update_product_details(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson("/api/admin/products/{$this->product->id}", [
            'name' => 'Forged Galvanized Anchor',
            'price_cents' => 399000,
            'description' => 'Updated forged steel anchor description.',
            'image_path' => 'https://res.cloudinary.com/trueharbor/image/upload/v2/provisions/anchor-forged.jpg',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Forged Galvanized Anchor')
            ->assertJsonPath('data.price_cents', 399000)
            ->assertJsonPath('data.image_path', 'https://res.cloudinary.com/trueharbor/image/upload/v2/provisions/anchor-forged.jpg');

        $this->assertEquals('Forged Galvanized Anchor', $this->product->fresh()->name);
        $this->assertEquals(399000, $this->product->fresh()->price_cents);
        $this->assertEquals(
            'https://res.cloudinary.com/trueharbor/image/upload/v2/provisions/anchor-forged.jpg',
            $this->product->fresh()->image_path
        );
    }

    public function test_admin_can_delete_product(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson("/api/admin/products/{$this->product->id}");
        $response->assertOk()
            ->assertJsonPath('message', 'Product removed successfully.');

        $this->assertDatabaseMissing('products', [
            'id' => $this->product->id,
        ]);
    }

    public function test_admin_can_filter_orders_by_search_term_and_status(): void
    {
        Sanctum::actingAs($this->customer);
        $this->postJson('/api/cart', ['product_id' => $this->product->id, 'quantity' => 1]);
        $this->postJson('/api/checkout', [
            'shipping_address' => [
                'name' => 'Admiral Nelson',
                'line1' => 'Portsmouth Way',
                'city' => 'Manila',
                'province' => 'Metro Manila',
                'postal_code' => '1000',
                'phone' => '+639170001122',
            ],
        ]);

        Sanctum::actingAs($this->admin);

        // Search by customer name
        $searchResponse = $this->getJson("/api/admin/orders?search=" . urlencode($this->customer->name));
        $searchResponse->assertOk()
            ->assertJsonCount(1, 'data');

        // Filter by pending status
        $statusResponse = $this->getJson('/api/admin/orders?status=pending');
        $statusResponse->assertOk()
            ->assertJsonCount(1, 'data');

        // Filter by non-matching status
        $emptyResponse = $this->getJson('/api/admin/orders?status=delivered');
        $emptyResponse->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
