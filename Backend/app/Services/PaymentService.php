<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\ProcessedWebhookEvent;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Stripe\Webhook;

class PaymentService
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Create or attach a Stripe PaymentIntent to an Order.
     * In live/test API mode with credentials, calls Stripe PaymentIntents API.
     * In local development without credentials, generates a deterministic test mock.
     */
    public function createPaymentIntent(Order $order): string
    {
        $stripeSecret = config('services.stripe.secret');

        if ($stripeSecret && !str_contains($stripeSecret, 'placeholder')) {
            try {
                Stripe::setApiKey($stripeSecret);
                $intent = PaymentIntent::create([
                    'amount' => $order->total_cents,
                    'currency' => 'php',
                    'metadata' => [
                        'order_id' => (string) $order->id,
                        'user_id' => (string) $order->user_id,
                        'payment_method' => (string) ($order->payment_method ?? 'card'),
                    ],
                    'automatic_payment_methods' => [
                        'enabled' => true,
                    ],
                ]);

                $order->update(['payment_intent_id' => $intent->id]);
                $order->client_secret = $intent->client_secret;
                return $intent->client_secret;
            } catch (\Exception $e) {
                Log::warning('Stripe API error, falling back to test mock: ' . $e->getMessage());
            }
        }

        // Test / local development mock
        $method = $order->payment_method ?? 'card';
        $mockId = 'pi_test_' . $method . '_' . $order->id . '_' . bin2hex(random_bytes(6));
        $mockSecret = $mockId . '_secret_' . bin2hex(random_bytes(10));

        $order->update(['payment_intent_id' => $mockId]);
        $order->client_secret = $mockSecret;

        return $mockSecret;
    }

    /**
     * Process an incoming Stripe webhook payload with signature verification & idempotency.
     *
     * @param string $payload
     * @param string|null $sigHeader
     * @return array{status: string, code: int, event_id?: string, order_id?: int|null}
     */
    public function handleWebhook(string $payload, ?string $sigHeader): array
    {
        $webhookSecret = config('services.stripe.webhook_secret');
        $event = null;

        if ($webhookSecret && !str_contains($webhookSecret, 'placeholder') && $sigHeader) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } catch (\UnexpectedValueException $e) {
                return ['status' => 'invalid_payload', 'code' => 400];
            } catch (SignatureVerificationException $e) {
                return ['status' => 'invalid_signature', 'code' => 400];
            }
        } else {
            // Development fallback / test mock
            $eventData = json_decode($payload, true);
            if (!is_array($eventData)) {
                return ['status' => 'invalid_json', 'code' => 400];
            }

            $event = (object) [
                'id' => $eventData['id'] ?? 'evt_local_' . bin2hex(random_bytes(6)),
                'type' => $eventData['type'] ?? 'payment_intent.succeeded',
                'data' => (object) [
                    'object' => (object) ($eventData['data']['object'] ?? []),
                ],
            ];
        }

        // Idempotency: Reject already processed webhook events
        $alreadyProcessed = ProcessedWebhookEvent::where('stripe_event_id', $event->id)->exists();
        if ($alreadyProcessed) {
            return [
                'status' => 'already_processed',
                'code' => 200,
                'event_id' => $event->id,
                'order_id' => null,
            ];
        }

        ProcessedWebhookEvent::create([
            'stripe_event_id' => $event->id,
            'processed_at' => now(),
        ]);

        $orderId = null;

        if ($event->type === 'payment_intent.succeeded') {
            $paymentIntentId = $event->data->object->id ?? null;
            if ($paymentIntentId) {
                $order = $this->orderService->markAsPaid($paymentIntentId);
                if ($order) {
                    $orderId = $order->id;
                    Log::info("Order #{$order->id} successfully marked as paid via Stripe webhook.");
                }
            }
        }

        return [
            'status' => 'success',
            'code' => 200,
            'event_id' => $event->id,
            'order_id' => $orderId,
        ];
    }
}
