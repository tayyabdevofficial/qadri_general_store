<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name')->default('Qadri General Store');
            $table->string('phone')->default('+92 300 1234567');
            $table->string('email')->nullable();
            $table->text('address')->default('Gujranwala, Punjab, Pakistan');
            $table->string('logo_path')->nullable();
            $table->string('currency_symbol')->default('Rs.');
            $table->string('ntn_number')->nullable();
            $table->string('strn_number')->nullable();
            $table->text('receipt_footer')->default('Thank you for shopping at Qadri General Store! Goods once sold can be returned within 7 days with original receipt.');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_settings');
    }
};
