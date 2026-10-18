<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Mail\OrderShippedMail;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderLogisticsTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;
    protected Product $product;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => Role::Admin]);
        $this->customer = User::factory()->create([
            'email' => 'mateo@trueharbor.test',
            'role' => Role::Customer,
        ]);

        $category = Category::create([
            'name' => 'Deck Provisions',
            'slug' => 'deck-provisions',
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Brass Barometer',
            'slug' => 'brass-barometer',
            'description' => 'Aneroid maritime barometer.',
            'price_cents' => 320000,
            'stock' => 10,
            'is_active' => true,
        ]);

        // Create a paid order
        $this->order = Order::create([
            'user_id' => $this->customer->id,
            'status' => OrderStatus::Paid,
            'subtotal_cents' => 320000,
            'shipping_cents' => 0,
            'total_cents' => 320000,
            'shipping_address' => [
                'name' => 'Mateo Silva',
                'line1' => 'Port Area 3',
                'city' => 'Manila',
                'province' => 'Metro Manila',
                'postal_code' => '1000',
                'phone' => '+63 917 000 1122',
            ],
            'payment_method' => 'gcash',
            'payment_intent_id' => 'pi_test_gcash_' . rand(100, 999),
            'expires_at' => now()->addHour(),
            'paid_at' => now(),
        ]);

        OrderItem::create([
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'unit_price_cents' => 320000,
            'quantity' => 1,
            'line_total_cents' => 320000,
        ]);
    }

    public function test_admin_can_ship_order_with_carrier_and_tracking_number(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/orders/{$this->order->id}/status", [
            'status' => 'shipped',
            'carrier' => 'lbc',
            'tracking_number' => 'LBC-99887766',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'shipped')
            ->assertJsonPath('data.carrier', 'lbc')
            ->assertJsonPath('data.carrier_label', 'LBC Express')
            ->assertJsonPath('data.tracking_number', 'LBC-99887766')
            ->assertJsonPath('data.tracking_url', 'https://www.lbcexpress.com/track/?tracking_no=LBC-99887766');

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'shipped',
            'carrier' => 'lbc',
            'tracking_number' => 'LBC-99887766',
        ]);

        $this->assertNotNull($this->order->fresh()->shipped_at);
    }

    public function test_shipping_order_dispatches_order_shipped_email(): void
    {
        Mail::fake();
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/admin/orders/{$this->order->id}/status", [
            'status' => 'shipped',
            'carrier' => 'jnt',
            'tracking_number' => 'JNT-55443322',
        ])->assertOk();

        Mail::assertSent(OrderShippedMail::class, function (OrderShippedMail $mail) {
            return $mail->hasTo('mateo@trueharbor.test') &&
                   $mail->order->id === $this->order->id &&
                   $mail->order->carrier === 'jnt' &&
                   $mail->order->tracking_number === 'JNT-55443322';
        });
    }

    public function test_customer_can_retrieve_tracking_details_from_order_endpoint(): void
    {
        // Mark as shipped directly
        $this->order->update([
            'status' => OrderStatus::Shipped,
            'carrier' => '2go',
            'tracking_number' => '2GO-77889900',
            'shipped_at' => now(),
        ]);

        Sanctum::actingAs($this->customer);

        $response = $this->getJson("/api/orders/{$this->order->id}");

        $response->assertOk()
            ->assertJsonPath('data.status', 'shipped')
            ->assertJsonPath('data.carrier', '2go')
            ->assertJsonPath('data.carrier_label', '2GO Sea Solutions')
            ->assertJsonPath('data.tracking_number', '2GO-77889900')
            ->assertJsonPath('data.tracking_url', 'https://supplychain.2go.com.ph/CustomerSupport/etrace/index.asp?wb=2GO-77889900');
    }

    public function test_admin_can_transition_shipped_order_to_delivered(): void
    {
        $this->order->update([
            'status' => OrderStatus::Shipped,
            'shipped_at' => now(),
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/orders/{$this->order->id}/status", [
            'status' => 'delivered',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'delivered');

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'delivered',
        ]);

        $this->assertNotNull($this->order->fresh()->delivered_at);
    }
}
