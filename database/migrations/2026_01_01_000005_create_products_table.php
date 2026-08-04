<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained('units')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('barcode')->nullable()->unique();
            $table->enum('product_type', ['simple', 'variant'])->default('simple')->index();
            $table->decimal('buy_price', 12, 2)->default(0.00);
            $table->decimal('sell_price', 12, 2)->default(0.00);
            $table->decimal('quantity', 12, 3)->default(0.000);
            $table->string('image_path')->nullable();
            $table->decimal('min_stock_alert', 12, 3)->default(5.000);
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('active')->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
