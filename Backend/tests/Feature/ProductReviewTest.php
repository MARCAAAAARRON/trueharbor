<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductReviewTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $otherCustomer;
    protected User $admin;
    protected Category $category;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['name' => 'Captain Mateo', 'role' => Role::Customer]);
        $this->otherCustomer = User::factory()->create(['name' => 'Sailor Anne', 'role' => Role::Customer]);
        $this->admin = User::factory()->create(['name' => 'Harbormaster Admin', 'role' => Role::Admin]);

        $this->category = Category::create([
            'name' => 'Navigation Gear',
            'slug' => 'navigation-gear',
        ]);

        $this->product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Brass Sextant Mark IV',
            'slug' => 'brass-sextant-mark-iv',
            'description' => 'Precision celestial maritime sextant.',
            'price_cents' => 450000,
            'stock' => 5,
            'is_active' => true,
        ]);
    }

    public function test_guest_can_fetch_product_reviews_and_summary_distribution(): void
    {
        // Seed some reviews
        ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'title' => 'Indispensable on open water',
            'comment' => 'Remarkable precision and solid brass construction.',
            'is_verified_purchase' => true,
        ]);

        ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $this->otherCustomer->id,
            'rating' => 4,
            'title' => 'Great but heavy',
            'comment' => 'Feels authentic and works well with celestial calculations.',
            'is_verified_purchase' => false,
        ]);

        $response = $this->getJson("/api/products/{$this->product->id}/reviews");

        $response->assertOk()
            ->assertJsonPath('summary.total_reviews', 2)
            ->assertJsonPath('summary.average_rating', 4.5)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.title', 'Great but heavy')
            ->assertJsonPath('data.1.title', 'Indispensable on open water')
            ->assertJsonPath('data.1.is_verified_purchase', true);

        // Verify star distribution counts
        $response->assertJsonPath('summary.rating_distribution.5.count', 1);
        $response->assertJsonPath('summary.rating_distribution.4.count', 1);
        $response->assertJsonPath('summary.rating_distribution.5.percentage', 50);
    }

    public function test_authenticated_customer_can_submit_review(): void
    {
        Sanctum::actingAs($this->customer);

        $response = $this->postJson("/api/products/{$this->product->slug}/reviews", [
            'rating' => 5,
            'title' => 'First-class craftsmanship',
            'comment' => 'Arrived packed in treated teakwood and calibrated to perfection.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Review submitted successfully')
            ->assertJsonPath('review.rating', 5)
            ->assertJsonPath('review.title', 'First-class craftsmanship')
            ->assertJsonPath('review.is_verified_purchase', false)
            ->assertJsonPath('review.user.name', 'Captain Mateo');

        $this->assertDatabaseHas('product_reviews', [
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'title' => 'First-class craftsmanship',
            'is_verified_purchase' => false,
        ]);
    }

    public function test_verified_purchase_flag_is_true_when_customer_has_paid_order(): void
    {
        // Create a paid order for this customer with this product
        $order = Order::create([
            'user_id' => $this->customer->id,
            'status' => OrderStatus::Paid,
            'subtotal_cents' => 450000,
            'shipping_cents' => 0,
            'total_cents' => 450000,
            'shipping_address' => [
                'recipient_name' => 'Captain Mateo',
                'street_line1' => 'Pier 7',
                'city' => 'Manila',
                'postal_code' => '1000',
                'country' => 'PH',
            ],
            'expires_at' => now()->addHour(),
            'paid_at' => now(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'unit_price_cents' => 450000,
            'quantity' => 1,
            'line_total_cents' => 450000,
        ]);

        Sanctum::actingAs($this->customer);

        $response = $this->postJson("/api/products/{$this->product->id}/reviews", [
            'rating' => 5,
            'title' => 'Worth every peso',
            'comment' => 'Used this during our storm voyage across the Visayan Sea.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('review.is_verified_purchase', true);

        $this->assertDatabaseHas('product_reviews', [
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'is_verified_purchase' => true,
        ]);
    }

    public function test_submitting_second_review_updates_existing_review(): void
    {
        Sanctum::actingAs($this->customer);

        // Submit initial review
        $this->postJson("/api/products/{$this->product->id}/reviews", [
            'rating' => 4,
            'title' => 'Good initial impression',
            'comment' => 'Solid item so far.',
        ])->assertCreated();

        $this->assertEquals(1, ProductReview::where('product_id', $this->product->id)->count());

        // Update review
        $updateResponse = $this->postJson("/api/products/{$this->product->id}/reviews", [
            'rating' => 5,
            'title' => 'Updated: Even better after 3 months',
            'comment' => 'Holding up amazingly in salty air.',
        ]);

        $updateResponse->assertCreated()
            ->assertJsonPath('review.rating', 5)
            ->assertJsonPath('review.title', 'Updated: Even better after 3 months');

        $this->assertEquals(1, ProductReview::where('product_id', $this->product->id)->count());
        $this->assertDatabaseHas('product_reviews', [
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'title' => 'Updated: Even better after 3 months',
        ]);
    }

    public function test_validation_rules_for_review_submission(): void
    {
        Sanctum::actingAs($this->customer);

        // Missing rating
        $this->postJson("/api/products/{$this->product->id}/reviews", [
            'comment' => 'Nice product',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['rating']);

        // Rating out of bounds (6)
        $this->postJson("/api/products/{$this->product->id}/reviews", [
            'rating' => 6,
            'comment' => 'Too high',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['rating']);

        // Rating out of bounds (0)
        $this->postJson("/api/products/{$this->product->id}/reviews", [
            'rating' => 0,
            'comment' => 'Too low',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['rating']);

        // Comment too short
        $this->postJson("/api/products/{$this->product->id}/reviews", [
            'rating' => 5,
            'comment' => 'ok',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['comment']);
    }

    public function test_customer_can_delete_their_own_review(): void
    {
        $review = ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'comment' => 'I love this instrument.',
        ]);

        Sanctum::actingAs($this->customer);

        $response = $this->deleteJson("/api/reviews/{$review->id}");
        $response->assertOk()
            ->assertJsonPath('message', 'Review deleted successfully');

        $this->assertDatabaseMissing('product_reviews', ['id' => $review->id]);
    }

    public function test_customer_cannot_delete_another_users_review(): void
    {
        $review = ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'comment' => 'Mateos review.',
        ]);

        Sanctum::actingAs($this->otherCustomer);

        $response = $this->deleteJson("/api/reviews/{$review->id}");
        $response->assertForbidden();

        $this->assertDatabaseHas('product_reviews', ['id' => $review->id]);
    }

    public function test_admin_can_delete_any_review_for_moderation(): void
    {
        $review = ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 1,
            'comment' => 'Spam or inappropriate comment.',
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson("/api/reviews/{$review->id}");
        $response->assertOk();

        $this->assertDatabaseMissing('product_reviews', ['id' => $review->id]);
    }

    public function test_product_detail_and_catalog_include_review_metrics(): void
    {
        ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'comment' => 'Top tier.',
        ]);

        ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $this->otherCustomer->id,
            'rating' => 3,
            'comment' => 'Average.',
        ]);

        // Product show endpoint
        $showResponse = $this->getJson("/api/products/{$this->product->slug}");
        $showResponse->assertOk()
            ->assertJsonPath('data.reviews_count', 2)
            ->assertJsonPath('data.average_rating', 4);

        // Product catalog index endpoint
        $indexResponse = $this->getJson("/api/products");
        $indexResponse->assertOk()
            ->assertJsonPath('data.0.reviews_count', 2)
            ->assertJsonPath('data.0.average_rating', 4);
    }
}
