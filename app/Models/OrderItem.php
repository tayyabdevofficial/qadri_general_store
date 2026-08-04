<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'item_type',
        'product_id',
        'product_variant_id',
        'package_id',
        'item_name',
        'unit_name',
        'quantity',
        'unit_cost_price',
        'unit_sell_price',
        'total_cost',
        'subtotal',
        'discount',
        'total_price',
        'profit',
        'pricing_mode',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_cost_price' => 'decimal:2',
        'unit_sell_price' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_price' => 'decimal:2',
        'profit' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class)->withTrashed();
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class)->withTrashed();
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class)->withTrashed();
    }
}
