<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminMediaUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'role' => Role::Customer,
        ]);

        $this->admin = User::factory()->create([
            'role' => Role::Admin,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_media_signature(): void
    {
        $this->getJson('/api/admin/media/signature')->assertUnauthorized();
    }

    public function test_customer_cannot_access_media_signature(): void
    {
        Sanctum::actingAs($this->customer);

        $this->getJson('/api/admin/media/signature')->assertForbidden();
    }

    public function test_admin_receives_upload_signature_in_mock_mode_when_unconfigured(): void
    {
        config([
            'services.cloudinary.cloud_name' => null,
            'services.cloudinary.api_key' => null,
            'services.cloudinary.api_secret' => null,
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/media/signature');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'configured',
                    'cloud_name',
                    'api_key',
                    'timestamp',
                    'signature',
                    'folder',
                ],
            ])
            ->assertJsonPath('data.configured', false)
            ->assertJsonPath('data.mock', true)
            ->assertJsonPath('data.folder', 'trueharbor/products');
    }

    public function test_admin_receives_cryptographic_signature_when_credentials_are_configured(): void
    {
        config([
            'services.cloudinary.cloud_name' => 'trueharbor-cloud',
            'services.cloudinary.api_key' => '123456789012345',
            'services.cloudinary.api_secret' => 'super_secret_signing_key_abc',
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/media/signature?folder=trueharbor/custom');

        $response->assertOk()
            ->assertJsonPath('data.configured', true)
            ->assertJsonPath('data.cloud_name', 'trueharbor-cloud')
            ->assertJsonPath('data.api_key', '123456789012345')
            ->assertJsonPath('data.folder', 'trueharbor/custom')
            ->assertJsonPath('data.upload_url', 'https://api.cloudinary.com/v1_1/trueharbor-cloud/image/upload');

        $data = $response->json('data');
        $expectedSignature = sha1("folder=trueharbor/custom&timestamp={$data['timestamp']}super_secret_signing_key_abc");
        $this->assertEquals($expectedSignature, $data['signature']);
    }
}
