<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    /**
     * Generate signed upload parameters for Cloudinary direct client uploads.
     */
    public function signature(Request $request, CloudinaryService $cloudinaryService): JsonResponse
    {
        $folder = $request->query('folder', 'trueharbor/products');
        $signatureData = $cloudinaryService->generateUploadSignature($folder);

        return response()->json([
            'data' => $signatureData,
        ]);
    }
}
