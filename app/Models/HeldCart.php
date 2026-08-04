<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeldCart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'customer_id',
        'cart_reference',
        'cart_payload',
        'total_amount',
    ];

    protected $casts = [
        'cart_payload' => 'array',
        'total_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
