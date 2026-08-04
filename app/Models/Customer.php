<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'outstanding_balance',
        'is_walk_in',
        'status',
    ];

    protected $casts = [
        'outstanding_balance' => 'decimal:2',
        'is_walk_in' => 'boolean',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(CustomerTransaction::class)->latest();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public static function getWalkInCustomer(): self
    {
        return static::firstOrCreate(
            ['is_walk_in' => true],
            [
                'name' => 'Walk-in Customer',
                'phone' => '00000000000',
                'address' => 'Counter Sale',
                'status' => 'active',
                'outstanding_balance' => 0,
            ]
        );
    }
}
