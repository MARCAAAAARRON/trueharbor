<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductImageGalleryTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;
    protected Category $category;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => Role::Admin]);
        $this->customer = User::factory()->create(['role' => Role::Customer]);

        $this->category = Category::create([
            'name' => 'Coastal Wear',
            'slug' => 'coastal-wear',
        ]);

        $this->product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Waterproof Deck Parka',
            'slug' => 'waterproof-deck-parka',
            'description' => 'Heavy coastal foul-weather parka.',
            'price_cents' => 189000,
            'stock' => 8,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_add_images_to_product_gallery(): void
    {
        Sanctum::actingAs($this->admin);

        // Add first image (should automatically become primary)
        $img1Response = $this->postJson("/api/admin/products/{$this->product->id}/images", [
            'url' => 'https://res.cloudinary.com/trueharbor/image/upload/v1/parka_front.webp',
            'alt_text' => 'Front view of deck parka',
        ]);

        $img1Response->assertCreated()
            ->assertJsonPath('data.url', 'https://res.cloudinary.com/trueharbor/image/upload/v1/parka_front.webp')
            ->assertJsonPath('data.is_primary', true);

        $this->assertEquals(
            'https://res.cloudinary.com/trueharbor/image/upload/v1/parka_front.webp',
            $this->product->fresh()->image_path
        );

        // Add second image (non-primary)
        $img2Response = $this->postJson("/api/admin/products/{$this->product->id}/images", [
            'url' => 'https://res.cloudinary.com/trueharbor/image/upload/v1/parka_back.webp',
            'alt_text' => 'Back view of deck parka',
        ]);

        $img2Response->assertCreated()
            ->assertJsonPath('data.is_primary', false);

        $this->assertCount(2, $this->product->fresh()->images);
    }

    public function test_admin_can_set_different_image_as_primary(): void
    {
        Sanctum::actingAs($this->admin);

        $img1 = $this->product->images()->create([
            'url' => 'https://res.cloudinary.com/trueharbor/img1.webp',
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $img2 = $this->product->images()->create([
            'url' => 'https://res.cloudinary.com/trueharbor/img2.webp',
            'sort_order' => 2,
            'is_primary' => false,
        ]);

        $response = $this->patchJson("/api/admin/products/{$this->product->id}/images/{$img2->id}/primary");
        $response->assertOk()
            ->assertJsonPath('data.is_primary', true);

        $this->assertFalse($img1->fresh()->is_primary);
        $this->assertTrue($img2->fresh()->is_primary);
        $this->assertEquals('https://res.cloudinary.com/trueharbor/img2.webp', $this->product->fresh()->image_path);
    }

    public function test_admin_can_delete_image_and_primary_fallback_works(): void
    {
        Sanctum::actingAs($this->admin);

        $img1 = $this->product->images()->create([
            'url' => 'https://res.cloudinary.com/trueharbor/img1.webp',
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $img2 = $this->product->images()->create([
            'url' => 'https://res.cloudinary.com/trueharbor/img2.webp',
            'sort_order' => 2,
            'is_primary' => false,
        ]);

        $deleteResponse = $this->deleteJson("/api/admin/products/{$this->product->id}/images/{$img1->id}");
        $deleteResponse->assertOk()
            ->assertJsonPath('message', 'Image removed from gallery.');

        $this->assertDatabaseMissing('product_images', ['id' => $img1->id]);
        $this->assertTrue($img2->fresh()->is_primary);
        $this->assertEquals('https://res.cloudinary.com/trueharbor/img2.webp', $this->product->fresh()->image_path);
    }

    public function test_customer_storefront_loads_product_with_gallery_images(): void
    {
        $this->product->images()->create([
            'url' => 'https://res.cloudinary.com/trueharbor/angle1.webp',
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $this->product->images()->create([
            'url' => 'https://res.cloudinary.com/trueharbor/angle2.webp',
            'sort_order' => 2,
            'is_primary' => false,
        ]);

        $response = $this->getJson("/api/products/{$this->product->slug}");

        $response->assertOk()
            ->assertJsonCount(2, 'data.images')
            ->assertJsonPath('data.images.0.url', 'https://res.cloudinary.com/trueharbor/angle1.webp')
            ->assertJsonPath('data.images.1.url', 'https://res.cloudinary.com/trueharbor/angle2.webp');
    }
}
