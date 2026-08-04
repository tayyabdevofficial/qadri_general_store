<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesReturn extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'return_number',
        'order_id',
        'customer_id',
        'total_refund_amount',
        'refund_type',
        'reason',
        'user_id',
    ];

    protected $casts = [
        'total_refund_amount' => 'decimal:2',
    ];

    public static function generateReturnNumber(): string
    {
        $dateStr = now()->format('Ymd');
        $prefix = 'RET-' . $dateStr . '-';

        $lastRecord = static::withTrashed()
            ->where('return_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        $nextSeq = 1;
        if ($lastRecord && !empty($lastRecord->return_number)) {
            $parts = explode('-', $lastRecord->return_number);
            $lastSeq = (int) end($parts);
            $nextSeq = $lastSeq + 1;
        }

        do {
            $returnNumber = $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
            $nextSeq++;
        } while (static::withTrashed()->where('return_number', $returnNumber)->exists());

        return $returnNumber;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class)->withTrashed();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
