<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SalesReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->today()->toDateString());
        $categoryId = $request->input('category_id');

        $ordersQuery = Order::query()
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        $grossSales = (float) $ordersQuery->sum('subtotal');
        $totalDiscounts = (float) $ordersQuery->sum('discount_amount');
        $totalTaxes = (float) $ordersQuery->sum('tax_amount');
        $netSales = (float) $ordersQuery->sum('total_amount');
        $totalCOGS = (float) $ordersQuery->sum('total_cost');
        $grossProfit = (float) $ordersQuery->sum('total_profit');

        $totalReturns = (float) SalesReturn::whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->sum('total_refund_amount');

        $totalExpenses = (float) Expense::whereDate('expense_date', '>=', $startDate)
            ->whereDate('expense_date', '<=', $endDate)
            ->sum('amount');

        $netProfit = ($grossProfit - $totalReturns) - $totalExpenses;
        $profitMargin = $netSales > 0 ? round(($netProfit / $netSales) * 100, 2) : 0;

        // Top Selling Products
        $topProducts = OrderItem::select('item_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(total_price) as total_revenue'), DB::raw('SUM(profit) as total_profit'))
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->whereDate('created_at', '>=', $startDate)
                    ->whereDate('created_at', '<=', $endDate);
            })
            ->groupBy('item_name')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();

        // Category Sales Breakdown
        $categoriesBreakdown = OrderItem::select('categories.name as category_name', DB::raw('SUM(order_items.total_price) as revenue'))
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->whereDate('created_at', '>=', $startDate)
                    ->whereDate('created_at', '<=', $endDate);
            })
            ->groupBy('categories.name')
            ->get();

        return Inertia::render('reports/index', [
            'summary' => [
                'grossSales' => $grossSales,
                'totalDiscounts' => $totalDiscounts,
                'totalTaxes' => $totalTaxes,
                'netSales' => $netSales,
                'totalCOGS' => $totalCOGS,
                'grossProfit' => $grossProfit,
                'totalReturns' => $totalReturns,
                'totalExpenses' => $totalExpenses,
                'netProfit' => $netProfit,
                'profitMargin' => $profitMargin,
            ],
            'topProducts' => $topProducts,
            'categoriesBreakdown' => $categoriesBreakdown,
            'categories' => Category::active()->get(),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'category_id' => $categoryId,
            ],
        ]);
    }
}
