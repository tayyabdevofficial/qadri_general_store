<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $groceries = Category::where('slug', 'groceries-pulses')->first();
        $beverages = Category::where('slug', 'beverages-drinks')->first();
        $dairy = Category::where('slug', 'dairy-bakery')->first();
        $spices = Category::where('slug', 'spices-seasonings')->first();
        $personal = Category::where('slug', 'personal-care-hygiene')->first();

        $kg = Unit::where('short_name', 'kg')->first();
        $pc = Unit::where('short_name', 'pc')->first();
        $pack = Unit::where('short_name', 'pack')->first();
        $liter = Unit::where('short_name', 'L')->first();

        // 1. Refined Sugar (Variable Price Unit - Kg)
        if ($groceries && $kg) {
            Product::firstOrCreate(
                ['barcode' => '890100000001'],
                [
                    'category_id' => $groceries->id,
                    'unit_id' => $kg->id,
                    'name' => 'White Refined Sugar',
                    'slug' => 'white-refined-sugar',
                    'product_type' => 'simple',
                    'buy_price' => 135.00,
                    'sell_price' => 150.00,
                    'quantity' => 250.000,
                    'min_stock_alert' => 20.000,
                    'status' => 'active',
                ]
            );
        }

        // 2. Basmati Super Rice (Variable Price Unit - Kg)
        if ($groceries && $kg) {
            Product::firstOrCreate(
                ['barcode' => '890100000002'],
                [
                    'category_id' => $groceries->id,
                    'unit_id' => $kg->id,
                    'name' => 'Super Kernel Basmati Rice',
                    'slug' => 'super-kernel-basmati-rice',
                    'product_type' => 'simple',
                    'buy_price' => 310.00,
                    'sell_price' => 360.00,
                    'quantity' => 150.000,
                    'min_stock_alert' => 15.000,
                    'status' => 'active',
                ]
            );
        }

        // 3. Olper's Milk 1 Liter (Simple Product - Pc)
        if ($dairy && $pc) {
            Product::firstOrCreate(
                ['barcode' => '890100000003'],
                [
                    'category_id' => $dairy->id,
                    'unit_id' => $pc->id,
                    'name' => "Olper's Full Cream Milk 1L",
                    'slug' => 'olpers-full-cream-milk-1l',
                    'product_type' => 'simple',
                    'buy_price' => 265.00,
                    'sell_price' => 290.00,
                    'quantity' => 80.000,
                    'min_stock_alert' => 10.000,
                    'expiry_date' => now()->addMonths(3),
                    'status' => 'active',
                ]
            );
        }

        // 4. Tapal Danedar Tea (Variant Product)
        if ($beverages && $pack) {
            $tapal = Product::firstOrCreate(
                ['slug' => 'tapal-danedar-tea'],
                [
                    'category_id' => $beverages->id,
                    'unit_id' => $pack->id,
                    'name' => 'Tapal Danedar Black Tea',
                    'product_type' => 'variant',
                    'buy_price' => 0.00,
                    'sell_price' => 0.00,
                    'quantity' => 0.000,
                    'min_stock_alert' => 5.000,
                    'status' => 'active',
                ]
            );

            ProductVariant::firstOrCreate(
                ['barcode' => '890100000004'],
                [
                    'product_id' => $tapal->id,
                    'variant_name' => 'Tapal Danedar 475g Pack',
                    'buy_price' => 740.00,
                    'sell_price' => 820.00,
                    'quantity' => 45.000,
                    'status' => 'active',
                ]
            );

            ProductVariant::firstOrCreate(
                ['barcode' => '890100000005'],
                [
                    'product_id' => $tapal->id,
                    'variant_name' => 'Tapal Danedar 950g Family Pack',
                    'buy_price' => 1480.00,
                    'sell_price' => 1620.00,
                    'quantity' => 25.000,
                    'status' => 'active',
                ]
            );
        }

        // 5. National Red Chili Powder (Simple - Pack)
        if ($spices && $pack) {
            Product::firstOrCreate(
                ['barcode' => '890100000006'],
                [
                    'category_id' => $spices->id,
                    'unit_id' => $pack->id,
                    'name' => 'National Red Chili Powder 200g',
                    'slug' => 'national-red-chili-powder-200g',
                    'product_type' => 'simple',
                    'buy_price' => 210.00,
                    'sell_price' => 240.00,
                    'quantity' => 50.000,
                    'min_stock_alert' => 8.000,
                    'expiry_date' => now()->addYear(),
                    'status' => 'active',
                ]
            );
        }

        // 6. Lux Beauty Soap (Simple - Pc)
        if ($personal && $pc) {
            Product::firstOrCreate(
                ['barcode' => '890100000007'],
                [
                    'category_id' => $personal->id,
                    'unit_id' => $pc->id,
                    'name' => 'Lux Velvet Touch Soap 140g',
                    'slug' => 'lux-velvet-touch-soap-140g',
                    'product_type' => 'simple',
                    'buy_price' => 140.00,
                    'sell_price' => 165.00,
                    'quantity' => 100.000,
                    'min_stock_alert' => 12.000,
                    'status' => 'active',
                ]
            );
        }
    }
}
