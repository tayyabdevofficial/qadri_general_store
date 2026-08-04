<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Default Walk-in Customer
        Customer::getWalkInCustomer();

        $customers = [
            [
                'name' => 'Mohammad Ali',
                'phone' => '03011234567',
                'email' => 'ali@example.com',
                'address' => 'Model Town, Gujranwala',
                'outstanding_balance' => 0.00,
                'is_walk_in' => false,
                'status' => 'active',
            ],
            [
                'name' => 'Usman Raza',
                'phone' => '03217654321',
                'email' => 'usman@example.com',
                'address' => 'Civil Lines, Gujranwala',
                'outstanding_balance' => 1250.00,
                'is_walk_in' => false,
                'status' => 'active',
            ],
            [
                'name' => 'Bilal Ahmed',
                'phone' => '03339876543',
                'email' => 'bilal@example.com',
                'address' => 'Satellite Town, Gujranwala',
                'outstanding_balance' => 0.00,
                'is_walk_in' => false,
                'status' => 'active',
            ],
        ];

        foreach ($customers as $c) {
            Customer::firstOrCreate(['phone' => $c['phone']], $c);
        }
    }
}
