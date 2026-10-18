<?php

namespace App\Services;

class CloudinaryService
{
    /**
     * Generate signed upload parameters for direct client-to-Cloudinary uploads.
     *
     * @param string $folder Target Cloudinary storage folder
     * @return array
     */
    public function generateUploadSignature(string $folder = 'trueharbor/products'): array
    {
        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');

        $isConfigured = !empty($cloudName) && !empty($apiKey) && !empty($apiSecret) && !str_contains($apiKey, 'placeholder');

        if ($isConfigured) {
            $timestamp = time();
            $params = [
                'folder' => $folder,
                'timestamp' => $timestamp,
            ];

            ksort($params);

            // Cloudinary signature formula: sha1(sorted_params_query_string + api_secret)
            $serialized = '';
            foreach ($params as $key => $value) {
                $serialized .= "{$key}={$value}&";
            }
            $serialized = rtrim($serialized, '&');

            $signature = sha1($serialized . $apiSecret);

            return [
                'configured' => true,
                'cloud_name' => $cloudName,
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder' => $folder,
                'upload_url' => "https://api.cloudinary.com/v1_1/{$cloudName}/image/upload",
            ];
        }

        // Local test mock fallback
        return [
            'configured' => false,
            'cloud_name' => 'demo',
            'api_key' => 'test_key',
            'timestamp' => time(),
            'signature' => 'mock_signature_' . bin2hex(random_bytes(6)),
            'folder' => $folder,
            'upload_url' => null,
            'mock' => true,
        ];
    }
}
