<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'Unilever Pakistan',
                'company_name' => 'Unilever Distributors',
                'phone' => '03001112233',
                'email' => 'contact@unilever.pk',
                'address' => 'Industrial Estate, Lahore',
                'outstanding_balance' => 0.00,
                'status' => 'active',
            ],
            [
                'name' => 'Nestle Distributors',
                'company_name' => 'Nestle Pakistan Ltd',
                'phone' => '03004445566',
                'email' => 'orders@nestle.pk',
                'address' => 'Sheikhupura Road, Lahore',
                'outstanding_balance' => 45000.00,
                'status' => 'active',
            ],
            [
                'name' => 'National Foods Supplier',
                'company_name' => 'National Foods Traders',
                'phone' => '03218889900',
                'email' => 'sales@nationalfoods.com.pk',
                'address' => 'G.T. Road, Gujranwala',
                'outstanding_balance' => 0.00,
                'status' => 'active',
            ],
        ];

        foreach ($suppliers as $s) {
            Supplier::firstOrCreate(['name' => $s['name']], $s);
        }
    }
}
