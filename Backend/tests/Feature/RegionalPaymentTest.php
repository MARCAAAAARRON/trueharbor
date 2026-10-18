<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegionalPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => Role::Customer]);

        $category = Category::create([
            'name' => 'Coastal Provisions',
            'slug' => 'coastal-provisions',
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Maritime Wool Beanie',
            'slug' => 'maritime-wool-beanie',
            'description' => 'Merino wool nautical knit cap.',
            'price_cents' => 125000,
            'stock' => 15,
            'is_active' => true,
        ]);

        // Put item in user cart
        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 2,
        ]);
    }

    public function test_customer_can_checkout_with_gcash_payment_method(): void
    {
        Sanctum::actingAs($this->customer);

        $payload = [
            'shipping_address' => [
                'name' => 'Juan Dela Cruz',
                'line1' => 'Unit 102, Ocean Drive',
                'city' => 'Taguig',
                'province' => 'Metro Manila',
                'postal_code' => '1630',
                'phone' => '+63 917 123 4567',
            ],
            'payment_method' => 'gcash',
            'payment_details' => [
                'account_number' => '09171234567',
                'account_name' => 'Juan Dela Cruz',
            ],
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.payment_method', 'gcash')
            ->assertJsonPath('data.payment_details.account_number', '09171234567')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->customer->id,
            'payment_method' => 'gcash',
            'status' => 'pending',
        ]);

        $orderId = $response->json('data.id');
        $paymentIntentId = $response->json('data.payment_intent_id');
        $this->assertStringStartsWith('pi_test_gcash_', $paymentIntentId);

        // Verify order can be confirmed as paid via OrderService
        $order = app(OrderService::class)->markAsPaid($paymentIntentId);
        $this->assertNotNull($order);
        $this->assertEquals(OrderStatus::Paid, $order->status);
    }

    public function test_customer_can_checkout_with_maya_payment_method(): void
    {
        Sanctum::actingAs($this->customer);

        $payload = [
            'shipping_address' => [
                'name' => 'Maria Clara',
                'line1' => 'Seaside Boulevard',
                'city' => 'Pasay',
                'province' => 'Metro Manila',
                'postal_code' => '1300',
                'phone' => '+63 918 765 4321',
            ],
            'payment_method' => 'maya',
            'payment_details' => [
                'account_number' => '09187654321',
            ],
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.payment_method', 'maya')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->customer->id,
            'payment_method' => 'maya',
        ]);

        $paymentIntentId = $response->json('data.payment_intent_id');
        $this->assertStringStartsWith('pi_test_maya_', $paymentIntentId);
    }

    public function test_checkout_defaults_to_card_when_payment_method_not_provided(): void
    {
        Sanctum::actingAs($this->customer);

        $payload = [
            'shipping_address' => [
                'name' => 'Captain Mateo',
                'line1' => 'Pier 4',
                'city' => 'Cebu City',
                'province' => 'Cebu',
                'postal_code' => '6000',
                'phone' => '+63 920 111 2233',
            ],
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.payment_method', 'card');

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->customer->id,
            'payment_method' => 'card',
        ]);
    }

    public function test_checkout_rejects_invalid_payment_method(): void
    {
        Sanctum::actingAs($this->customer);

        $payload = [
            'shipping_address' => [
                'name' => 'Mateo',
                'line1' => 'Pier 4',
                'city' => 'Cebu City',
                'province' => 'Cebu',
                'postal_code' => '6000',
                'phone' => '+63 920 111 2233',
            ],
            'payment_method' => 'unsupported_method',
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['payment_method']);
    }
}
