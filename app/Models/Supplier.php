<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'company_name',
        'phone',
        'email',
        'address',
        'outstanding_balance',
        'status',
    ];

    protected $casts = [
        'outstanding_balance' => 'decimal:2',
    ];

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(SupplierTransaction::class)->latest();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
