<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->unsignedInteger('subtotal_cents');
            $table->unsignedInteger('shipping_cents');
            $table->unsignedInteger('total_cents');
            $table->json('shipping_address');
            $table->string('payment_intent_id')->nullable()->unique();
            $table->timestamp('expires_at');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('status');
            $table->index('expires_at');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE orders
                ADD CONSTRAINT orders_subtotal_nonnegative CHECK (subtotal_cents >= 0),
                ADD CONSTRAINT orders_shipping_nonnegative CHECK (shipping_cents >= 0),
                ADD CONSTRAINT orders_total_nonnegative CHECK (total_cents >= 0)');
        }

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('line_total_cents');
            $table->timestamps();
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE order_items
                ADD CONSTRAINT order_items_unit_price_nonnegative CHECK (unit_price_cents >= 0),
                ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
                ADD CONSTRAINT order_items_line_total_nonnegative CHECK (line_total_cents >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
