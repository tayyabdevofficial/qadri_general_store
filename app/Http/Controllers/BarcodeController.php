<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BarcodeController extends Controller
{
    public function index(): Response
    {
        $products = Product::with(['variants' => function ($q) {
            $q->where('status', 'active');
        }])->active()->get();
        
        $storeSettings = StoreSetting::getSettings();

        return Inertia::render('products/barcodes', [
            'products' => $products,
            'storeSettings' => $storeSettings,
        ]);
    }
}
