<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class StoreSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_name',
        'phone',
        'email',
        'address',
        'logo_path',
        'currency_symbol',
        'ntn_number',
        'strn_number',
        'receipt_footer',
    ];

    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute(): ?string
    {
        if ($this->logo_path) {
            return Storage::url($this->logo_path);
        }
        return null;
    }

    public static function getSettings(): self
    {
        return static::firstOrCreate([], [
            'store_name' => 'Qadri General Store',
            'phone' => '+92 300 1234567',
            'email' => 'info@qadrigeneralstore.com',
            'address' => 'Main Market, Gujranwala, Punjab, Pakistan',
            'currency_symbol' => 'Rs.',
            'receipt_footer' => 'Thank you for shopping at Qadri General Store! Goods once sold can be returned within 7 days with original receipt.',
        ]);
    }
}
