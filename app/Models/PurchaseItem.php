<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'product_id',
        'product_variant_id',
        'quantity',
        'unit_cost_price',
        'unit_sell_price',
        'total_cost',
        'expiry_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_cost_price' => 'decimal:2',
        'unit_sell_price' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'expiry_date' => 'date:Y-m-d',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class)->withTrashed();
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class)->withTrashed();
    }
}
