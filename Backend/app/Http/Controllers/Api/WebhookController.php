<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    /**
     * Handle incoming Stripe webhook
     */
    public function handleStripe(Request $request, PaymentService $paymentService): JsonResponse
    {
        $result = $paymentService->handleWebhook(
            $request->getContent(),
            $request->header('Stripe-Signature')
        );

        if ($result['code'] >= 400) {
            return response()->json(['error' => $result['status']], $result['code']);
        }

        return response()->json($result, $result['code']);
    }
}
