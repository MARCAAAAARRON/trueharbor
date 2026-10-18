<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\WebhookController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/health', fn() => response()->json(['status' => 'ok']));

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    // Cart endpoints
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::match(['put', 'patch'], '/cart/items/{id}', [CartController::class, 'update']);
    Route::match(['put', 'patch'], '/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/items/{id}', [CartController::class, 'destroy']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);

    // Checkout & Orders
    Route::post('/checkout', [CheckoutController::class, 'store']);
    Route::post('/checkout/orders', [CheckoutController::class, 'store']);
    Route::get('/orders', [CheckoutController::class, 'userOrders']);
    Route::get('/orders/{id}', [CheckoutController::class, 'show']);
    Route::post('/orders/{id}/cancel', [CheckoutController::class, 'cancel']);

    // Product Reviews
    Route::post('/products/{id}/reviews', [ProductReviewController::class, 'store']);
    Route::delete('/reviews/{id}', [ProductReviewController::class, 'destroy']);
});

// Admin Operations
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Orders fulfillment
    Route::get('/orders', [\App\Http\Controllers\Api\Admin\AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [\App\Http\Controllers\Api\Admin\AdminOrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [\App\Http\Controllers\Api\Admin\AdminOrderController::class, 'updateStatus']);

    // Products & stock inventory
    Route::get('/products', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'index']);
    Route::get('/products/low-stock', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'lowStock']);
    Route::post('/products', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'store']);
    Route::put('/products/{id}', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'update']);
    Route::get('/products/{id}', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'show']);
    Route::patch('/products/{id}/stock', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'updateStock']);
    Route::delete('/products/{id}', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'destroy']);

    // Product gallery images
    Route::post('/products/{id}/images', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'addImage']);
    Route::delete('/products/{id}/images/{imageId}', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'deleteImage']);
    Route::patch('/products/{id}/images/{imageId}/primary', [\App\Http\Controllers\Api\Admin\AdminProductController::class, 'setPrimaryImage']);

    // Media upload signatures
    Route::get('/media/signature', [\App\Http\Controllers\Api\Admin\MediaController::class, 'signature']);
});

Route::middleware('throttle:120,1')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);
    Route::get('/products/{id}/reviews', [ProductReviewController::class, 'index']);
});

Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripe']);