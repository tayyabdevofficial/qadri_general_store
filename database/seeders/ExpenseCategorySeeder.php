<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Electricity & Utilities', 'description' => 'Gepco electricity bills, gas, water'],
            ['name' => 'Store Rent', 'description' => 'Monthly store shop rent'],
            ['name' => 'Staff Tea & Refreshment', 'description' => 'Daily staff tea, snacks, lunches'],
            ['name' => 'Maintenance & Repairs', 'description' => 'Fixing fixtures, wiring, AC, printer paper'],
            ['name' => 'Transport & Freight', 'description' => 'Goods delivery & rickshaw charges'],
        ];

        foreach ($categories as $c) {
            ExpenseCategory::firstOrCreate(['name' => $c['name']], $c);
        }
    }
}
