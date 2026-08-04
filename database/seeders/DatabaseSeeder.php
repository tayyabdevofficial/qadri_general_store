<?php

namespace Database\Seeders;

use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed default Admin user if not exists
        if (!User::where('email', 'admin@qadri.com')->exists()) {
            User::create([
                'name' => 'Qadri Store Manager',
                'email' => 'admin@qadri.com',
                'password' => Hash::make('password'),
            ]);
        }

        // Initialize Store Settings
        StoreSetting::getSettings();

        // Run domain seeders
        $this->call([
            CustomerSeeder::class,
            SupplierSeeder::class,
            CategorySeeder::class,
            UnitSeeder::class,
            PaymentMethodSeeder::class,
            ExpenseCategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
