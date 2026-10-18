<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProcessedWebhookEvent;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class WebhookController extends Controller
{
    /**
     * Handle incoming Stripe webhook
     */
    public function handleStripe(Request $request, OrderService $orderService): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        $event = null;

        if ($webhookSecret && !str_contains($webhookSecret, 'placeholder') && $sigHeader) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } catch (\UnexpectedValueException $e) {
                return response()->json(['error' => 'Invalid payload'], 400);
            } catch (\Stripe\Exception\SignatureVerificationException $e) {
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        } else {
            // Development fallback
            $eventData = json_decode($payload, true);
            $event = (object) [
                'id' => $eventData['id'] ?? 'evt_local_' . bin2hex(random_bytes(6)),
                'type' => $eventData['type'] ?? 'payment_intent.succeeded',
                'data' => (object) [
                    'object' => (object) ($eventData['data']['object'] ?? []),
                ],
            ];
        }

        // Idempotency check: Ignore duplicate events
        $alreadyProcessed = ProcessedWebhookEvent::where('stripe_event_id', $event->id)->exists();
        if ($alreadyProcessed) {
            return response()->json(['status' => 'already_processed']);
        }

        ProcessedWebhookEvent::create([
            'stripe_event_id' => $event->id,
            'processed_at' => now(),
        ]);

        if ($event->type === 'payment_intent.succeeded') {
            $paymentIntentId = $event->data->object->id ?? null;
            if ($paymentIntentId) {
                $order = $orderService->markAsPaid($paymentIntentId);
                Log::info("Order #{$order?->id} successfully marked as paid via Stripe webhook.");
            }
        }

        return response()->json(['status' => 'success']);
    }
}
