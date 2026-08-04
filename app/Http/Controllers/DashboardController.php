<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = now()->today();

        $todaySales = (float) Order::whereDate('created_at', $today)->sum('total_amount');
        $todayProfit = (float) Order::whereDate('created_at', $today)->sum('total_profit');
        $todayOrdersCount = Order::whereDate('created_at', $today)->count();

        $totalCustomerOutstanding = (float) Customer::sum('outstanding_balance');

        $lowStockProducts = Product::lowStock()->with(['category', 'unit'])->take(5)->get();
        $recentOrders = Order::with(['customer', 'paymentMethod'])->latest()->take(6)->get();

        return Inertia::render('dashboard', [
            'metrics' => [
                'todaySales' => $todaySales,
                'todayProfit' => $todayProfit,
                'todayOrdersCount' => $todayOrdersCount,
                'totalCustomerOutstanding' => $totalCustomerOutstanding,
            ],
            'lowStockProducts' => $lowStockProducts,
            'recentOrders' => $recentOrders,
        ]);
    }
}
