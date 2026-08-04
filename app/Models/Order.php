<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'customer_id',
        'payment_method_id',
        'register_session_id',
        'subtotal',
        'discount_type',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'total_cost',
        'total_profit',
        'paid_amount',
        'due_amount',
        'change_return',
        'payment_status',
        'payment_reference',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'total_profit' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'change_return' => 'decimal:2',
    ];

    public static function generateOrderNumber(): string
    {
        $dateStr = now()->format('Ymd');
        $prefix = 'ORD-' . $dateStr . '-';

        $lastRecord = static::withTrashed()
            ->where('order_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        $nextSeq = 1;
        if ($lastRecord && !empty($lastRecord->order_number)) {
            $parts = explode('-', $lastRecord->order_number);
            $lastSeq = (int) end($parts);
            $nextSeq = $lastSeq + 1;
        }

        do {
            $orderNumber = $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
            $nextSeq++;
        } while (static::withTrashed()->where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class)->withTrashed();
    }

    public function registerSession(): BelongsTo
    {
        return $this->belongsTo(RegisterSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SalesReturn::class);
    }
}
