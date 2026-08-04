<?php

namespace App\Http\Controllers;

use App\Models\CustomerTransaction;
use App\Models\Order;
use App\Models\Package;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $paymentStatus = $request->input('payment_status');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $orders = Order::query()
            ->with(['customer', 'paymentMethod', 'user'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            })
            ->when($paymentStatus, function ($query, $status) {
                $query->where('payment_status', $status);
            })
            ->when($startDate, function ($query, $start) {
                $query->whereDate('created_at', '>=', $start);
            })
            ->when($endDate, function ($query, $end) {
                $query->whereDate('created_at', '<=', $end);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('orders/index', [
            'orders' => $orders,
            'filters' => [
                'search' => $search,
                'payment_status' => $paymentStatus,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['customer', 'paymentMethod', 'user', 'items.product', 'items.productVariant', 'items.package']);
        $storeSettings = StoreSetting::getSettings();

        return Inertia::render('orders/show', [
            'order' => $order,
            'storeSettings' => $storeSettings,
        ]);
    }

    public function receipt(Order $order): Response
    {
        $order->load(['customer', 'paymentMethod', 'user', 'items']);
        $storeSettings = StoreSetting::getSettings();

        return Inertia::render('orders/receipt', [
            'order' => $order,
            'storeSettings' => $storeSettings,
        ]);
    }

    public function destroy(Order $order)
    {
        DB::transaction(function () use ($order) {
            $order->load(['items', 'customer']);

            // Revert (restore) product stock for each order item
            foreach ($order->items as $item) {
                $soldQty = (float) $item->quantity;
                if ($item->item_type === 'product' && $item->product_id) {
                    $product = Product::find($item->product_id);
                    if ($product && $product->product_type === 'simple') {
                        $product->increment('quantity', $soldQty);
                    }
                } elseif ($item->item_type === 'variant' && $item->product_variant_id) {
                    $variant = ProductVariant::find($item->product_variant_id);
                    if ($variant) {
                        $variant->increment('quantity', $soldQty);
                    }
                } elseif ($item->item_type === 'package' && $item->package_id) {
                    $package = Package::with(['items.product', 'items.productVariant'])->find($item->package_id);
                    if ($package) {
                        foreach ($package->items as $pItem) {
                            $reqQty = $pItem->quantity * $soldQty;
                            if ($pItem->product_variant_id) {
                                $v = $pItem->productVariant ?? ProductVariant::find($pItem->product_variant_id);
                                if ($v) {
                                    $v->increment('quantity', $reqQty);
                                }
                            } else {
                                $p = $pItem->product ?? Product::find($pItem->product_id);
                                if ($p) {
                                    $p->increment('quantity', $reqQty);
                                }
                            }
                        }
                    }
                }
            }

            // Adjust customer balance if registered customer
            $customer = $order->customer;
            if ($customer && !$customer->is_walk_in) {
                $dueAmount = (float) $order->due_amount;
                if ($dueAmount > 0) {
                    $prevBalance = (float) $customer->outstanding_balance;
                    $newBalance = $prevBalance - $dueAmount;
                    $customer->update(['outstanding_balance' => $newBalance]);

                    CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'order_id' => $order->id,
                        'type' => 'adjustment',
                        'amount' => $dueAmount,
                        'previous_balance' => $prevBalance,
                        'new_balance' => $newBalance,
                        'description' => "Deleted Order #{$order->order_number}",
                    ]);
                }
            }

            $order->delete();
        });

        return redirect()->route('orders.index')->with('success', 'Sales order deleted, product stock restored, and reports updated.');
    }
}
