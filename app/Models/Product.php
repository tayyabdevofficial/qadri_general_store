<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'unit_id',
        'name',
        'slug',
        'barcode',
        'product_type',
        'buy_price',
        'sell_price',
        'quantity',
        'image_path',
        'min_stock_alert',
        'expiry_date',
        'status',
    ];

    protected $casts = [
        'buy_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'quantity' => 'decimal:3',
        'min_stock_alert' => 'decimal:3',
        'expiry_date' => 'date:Y-m-d',
    ];

    protected $appends = ['image_url'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
            if (empty($product->barcode) && $product->product_type === 'simple') {
                $product->barcode = static::generateUniqueBarcode();
            }
        });
    }

    public static function generateUniqueBarcode(): string
    {
        do {
            $code = '890' . str_pad((string) mt_rand(100000000, 999999999), 9, '0', STR_PAD_LEFT);
        } while (
            static::where('barcode', $code)->exists() ||
            ProductVariant::where('barcode', $code)->exists() ||
            Package::where('barcode', $code)->exists()
        );

        return $code;
    }

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_path) {
            return Storage::url($this->image_path);
        }
        return null;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class)->withTrashed();
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class)->withTrashed();
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeLowStock($query)
    {
        return $query->where('product_type', 'simple')
            ->whereColumn('quantity', '<=', 'min_stock_alert');
    }
}
