<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Cash', 'code' => 'cash', 'type' => 'cash', 'account_number' => null, 'sort_order' => 1],
            ['name' => 'EasyPaisa', 'code' => 'easypaisa', 'type' => 'mobile_wallet', 'account_number' => '0300-1234567', 'sort_order' => 2],
            ['name' => 'JazzCash', 'code' => 'jazzcash', 'type' => 'mobile_wallet', 'account_number' => '0300-7654321', 'sort_order' => 3],
            ['name' => 'Debit/Credit Card', 'code' => 'card', 'type' => 'card', 'account_number' => null, 'sort_order' => 4],
            ['name' => 'Bank Transfer (HBL)', 'code' => 'bank_transfer', 'type' => 'bank_transfer', 'account_number' => 'PK12HABB0001234567890', 'sort_order' => 5],
        ];

        foreach ($methods as $m) {
            PaymentMethod::firstOrCreate(
                ['code' => $m['code']],
                [
                    'name' => $m['name'],
                    'type' => $m['type'],
                    'account_number' => $m['account_number'],
                    'is_active' => true,
                    'sort_order' => $m['sort_order'],
                ]
            );
        }
    }
}
