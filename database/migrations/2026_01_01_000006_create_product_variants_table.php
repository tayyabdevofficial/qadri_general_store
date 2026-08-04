<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('variant_name'); // e.g. "500g", "1kg", "Family Pack"
            $table->string('barcode')->nullable()->unique();
            $table->decimal('buy_price', 12, 2)->default(0.00);
            $table->decimal('sell_price', 12, 2)->default(0.00);
            $table->decimal('quantity', 12, 3)->default(0.000);
            $table->string('status')->default('active')->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
