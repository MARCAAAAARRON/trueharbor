<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Order;
use App\Models\ProcessedWebhookEvent;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => Role::Customer,
        ]);

        $category = Category::create([
            'name' => 'Navigation Tools',
            'slug' => 'navigation-tools',
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Brass Sextant',
            'slug' => 'brass-sextant',
            'description' => 'Precision maritime tool.',
            'price_cents' => 450000,
            'stock' => 5,
            'is_active' => true,
        ]);
    }

    public function test_checkout_attaches_payment_intent_and_client_secret(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/cart', [
            'product_id' => $this->product->id,
            'quantity' => 1,
        ])->assertOk();

        $response = $this->postJson('/api/checkout', [
            'shipping_address' => [
                'name' => 'Capt. Ahab',
                'line1' => 'Pier 42',
                'city' => 'Manila',
                'province' => 'Metro Manila',
                'postal_code' => '1000',
                'phone' => '+639171234567',
            ],
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'status',
                    'payment_intent_id',
                    'client_secret',
                    'total_cents',
                ],
            ]);

        $paymentIntentId = $response->json('data.payment_intent_id');
        $this->assertNotEmpty($paymentIntentId);
        $this->assertStringStartsWith('pi_', $paymentIntentId);

        $order = Order::find($response->json('data.id'));
        $this->assertEquals(OrderStatus::Pending, $order->status);
        $this->assertEquals($paymentIntentId, $order->payment_intent_id);
    }

    public function test_stripe_webhook_marks_order_as_paid_and_sets_paid_at(): void
    {
        $order = Order::create([
            'user_id' => $this->user->id,
            'status' => OrderStatus::Pending,
            'subtotal_cents' => 450000,
            'shipping_cents' => 0,
            'total_cents' => 450000,
            'shipping_address' => ['name' => 'Test', 'city' => 'Manila'],
            'payment_intent_id' => 'pi_test_webhook_payment_123',
            'expires_at' => now()->addMinutes(30),
        ]);

        $payload = [
            'id' => 'evt_test_unique_001',
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test_webhook_payment_123',
                    'amount' => 450000,
                    'status' => 'succeeded',
                ],
            ],
        ];

        $response = $this->postJson('/api/webhooks/stripe', $payload);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('order_id', $order->id);

        $freshOrder = $order->fresh();
        $this->assertEquals(OrderStatus::Paid, $freshOrder->status);
        $this->assertNotNull($freshOrder->paid_at);
        $this->assertTrue(
            ProcessedWebhookEvent::where('stripe_event_id', 'evt_test_unique_001')->exists()
        );
    }

    public function test_stripe_webhook_is_strictly_idempotent(): void
    {
        $order = Order::create([
            'user_id' => $this->user->id,
            'status' => OrderStatus::Pending,
            'subtotal_cents' => 10000,
            'shipping_cents' => 15000,
            'total_cents' => 25000,
            'shipping_address' => ['name' => 'Test'],
            'payment_intent_id' => 'pi_test_idempotent_456',
            'expires_at' => now()->addMinutes(30),
        ]);

        $payload = [
            'id' => 'evt_duplicate_test_999',
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test_idempotent_456',
                ],
            ],
        ];

        // First attempt: should succeed and mark paid
        $firstResponse = $this->postJson('/api/webhooks/stripe', $payload);
        $firstResponse->assertOk()
            ->assertJsonPath('status', 'success');

        $this->assertEquals(OrderStatus::Paid, $order->fresh()->status);
        $this->assertEquals(1, ProcessedWebhookEvent::where('stripe_event_id', 'evt_duplicate_test_999')->count());

        // Second attempt: replay of exact same event
        $secondResponse = $this->postJson('/api/webhooks/stripe', $payload);
        $secondResponse->assertOk()
            ->assertJsonPath('status', 'already_processed');

        // Still only 1 entry in processed_webhook_events
        $this->assertEquals(1, ProcessedWebhookEvent::where('stripe_event_id', 'evt_duplicate_test_999')->count());
    }

    public function test_stripe_webhook_rejects_invalid_signature_when_secret_is_set(): void
    {
        config(['services.stripe.webhook_secret' => 'whsec_valid_test_secret_abc123']);

        $payload = json_encode(['id' => 'evt_sig_test', 'type' => 'payment_intent.succeeded']);

        $response = $this->call(
            'POST',
            '/api/webhooks/stripe',
            [],
            [],
            [],
            [
                'HTTP_STRIPE_SIGNATURE' => 't=12345,v1=bad_signature_hash',
                'CONTENT_TYPE' => 'application/json',
            ],
            $payload
        );

        $response->assertStatus(400);
    }
}
