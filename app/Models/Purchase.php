<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'purchase_date',
        'total_amount',
        'paid_amount',
        'due_amount',
        'payment_status',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'purchase_date' => 'date:Y-m-d',
    ];

    public static function generatePurchaseNumber(): string
    {
        $dateStr = now()->format('Ymd');
        $prefix = 'PUR-' . $dateStr . '-';

        $lastRecord = static::withTrashed()
            ->where('purchase_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        $nextSeq = 1;
        if ($lastRecord && !empty($lastRecord->purchase_number)) {
            $parts = explode('-', $lastRecord->purchase_number);
            $lastSeq = (int) end($parts);
            $nextSeq = $lastSeq + 1;
        }

        do {
            $purchaseNumber = $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
            $nextSeq++;
        } while (static::withTrashed()->where('purchase_number', $purchaseNumber)->exists());

        return $purchaseNumber;
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class)->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
