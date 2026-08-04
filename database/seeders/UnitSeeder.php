<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'Kilogram', 'short_name' => 'kg', 'allow_decimal' => true, 'is_variable_price' => true],
            ['name' => 'Gram', 'short_name' => 'g', 'allow_decimal' => true, 'is_variable_price' => true],
            ['name' => 'Liter', 'short_name' => 'L', 'allow_decimal' => true, 'is_variable_price' => true],
            ['name' => 'Piece', 'short_name' => 'pc', 'allow_decimal' => false, 'is_variable_price' => false],
            ['name' => 'Box', 'short_name' => 'box', 'allow_decimal' => false, 'is_variable_price' => false],
            ['name' => 'Pack', 'short_name' => 'pack', 'allow_decimal' => false, 'is_variable_price' => false],
            ['name' => 'Dozen', 'short_name' => 'dz', 'allow_decimal' => false, 'is_variable_price' => false],
        ];

        foreach ($units as $u) {
            Unit::firstOrCreate(
                ['name' => $u['name']],
                [
                    'short_name' => $u['short_name'],
                    'allow_decimal' => $u['allow_decimal'],
                    'is_variable_price' => $u['is_variable_price'],
                    'status' => 'active',
                ]
            );
        }
    }
}
