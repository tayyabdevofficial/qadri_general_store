<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Groceries & Pulses', 'description' => 'Rice, Sugar, Flour, Dal, Lentils, Oil'],
            ['name' => 'Beverages & Drinks', 'description' => 'Cold Drinks, Juices, Tea, Coffee, Water'],
            ['name' => 'Dairy & Bakery', 'description' => 'Milk, Butter, Cheese, Bread, Eggs'],
            ['name' => 'Spices & Seasonings', 'description' => 'Salt, Red Chili, Turmeric, Masala Packs'],
            ['name' => 'Snacks & Confectionery', 'description' => 'Chips, Biscuits, Chocolates, Sweets'],
            ['name' => 'Personal Care & Hygiene', 'description' => 'Soaps, Shampoos, Toothpaste, Detergent'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['name' => $cat['name']],
                [
                    'slug' => Str::slug($cat['name']),
                    'description' => $cat['description'],
                    'status' => 'active',
                ]
            );
        }
    }
}
