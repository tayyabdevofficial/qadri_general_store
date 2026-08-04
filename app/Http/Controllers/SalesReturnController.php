<?php

namespace App\Http\Controllers;

use App\Models\CustomerTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $returns = SalesReturn::query()
            ->with(['order', 'customer', 'user', 'items.orderItem'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('return_number', 'like', "%{$search}%")
                        ->orWhereHas('order', function ($oq) use ($search) {
                            $oq->where('order_number', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('returns/index', [
            'returns' => $returns,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(Request $request): Response
    {
        $orderNumber = $request->input('order_number');
        $order = null;

        if ($orderNumber) {
            $order = Order::with(['customer', 'items.product', 'items.productVariant'])
                ->where('order_number', $orderNumber)
                ->first();
        }

        return Inertia::render('returns/create', [
            'order' => $order,
            'searchOrderNumber' => $orderNumber,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'refund_type' => 'required|in:cash,customer_credit',
            'reason' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $order = Order::with('customer')->findOrFail($validated['order_id']);
            $totalRefund = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $orderItem = OrderItem::findOrFail($item['order_item_id']);
                $retQty = (float) $item['quantity'];

                if ($retQty > $orderItem->quantity) {
                    throw new \Exception("Return quantity for {$orderItem->item_name} cannot exceed sold quantity.");
                }

                $lineRefund = round($retQty * $orderItem->unit_sell_price, 2);
                $totalRefund += $lineRefund;

                // Restock Inventory
                if ($orderItem->product_variant_id) {
                    $variant = ProductVariant::find($orderItem->product_variant_id);
                    if ($variant) $variant->increment('quantity', $retQty);
                } elseif ($orderItem->product_id) {
                    $product = Product::find($orderItem->product_id);
                    if ($product) $product->increment('quantity', $retQty);
                }

                $itemsData[] = [
                    'order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'product_variant_id' => $orderItem->product_variant_id,
                    'quantity' => $retQty,
                    'unit_sell_price' => $orderItem->unit_sell_price,
                    'total_refund' => $lineRefund,
                ];
            }

            $salesReturn = SalesReturn::create([
                'return_number' => SalesReturn::generateReturnNumber(),
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'total_refund_amount' => $totalRefund,
                'refund_type' => $validated['refund_type'],
                'reason' => $validated['reason'] ?? null,
                'user_id' => $request->user()->id,
            ]);

            foreach ($itemsData as $iData) {
                $salesReturn->items()->create($iData);
            }

            // If refund type is customer credit, deduct from customer outstanding balance or add credit
            if ($validated['refund_type'] === 'customer_credit' && !$order->customer->is_walk_in) {
                $c = $order->customer;
                $prevBal = (float) $c->outstanding_balance;
                $newBal = max(0, $prevBal - $totalRefund);
                $c->update(['outstanding_balance' => $newBal]);

                CustomerTransaction::create([
                    'customer_id' => $c->id,
                    'order_id' => $order->id,
                    'type' => 'return',
                    'amount' => $totalRefund,
                    'previous_balance' => $prevBal,
                    'new_balance' => $newBal,
                    'description' => "Return refund credit for Return #{$salesReturn->return_number}",
                ]);
            }
        });

        return redirect()->route('returns.index')->with('success', 'Sales return processed and stock updated.');
    }

    public function destroy(SalesReturn $return)
    {
        DB::transaction(function () use ($return) {
            $return->load(['items', 'customer']);

            // Revert restocked inventory (deduct stock)
            foreach ($return->items as $item) {
                $qty = (float) $item->quantity;
                if ($item->product_variant_id) {
                    $variant = ProductVariant::find($item->product_variant_id);
                    if ($variant) {
                        $variant->decrement('quantity', $qty);
                    }
                } elseif ($item->product_id) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->decrement('quantity', $qty);
                    }
                }
            }

            // If refund type was customer credit, revert customer balance adjustment
            if ($return->refund_type === 'customer_credit' && $return->customer && !$return->customer->is_walk_in) {
                $c = $return->customer;
                $prevBal = (float) $c->outstanding_balance;
                $totalRefund = (float) $return->total_refund_amount;
                $newBal = $prevBal + $totalRefund;
                $c->update(['outstanding_balance' => $newBal]);

                CustomerTransaction::create([
                    'customer_id' => $c->id,
                    'order_id' => $return->order_id,
                    'type' => 'adjustment',
                    'amount' => $totalRefund,
                    'previous_balance' => $prevBal,
                    'new_balance' => $newBal,
                    'description' => "Cancelled Return #{$return->return_number}",
                ]);
            }

            $return->delete();
        });

        return redirect()->back()->with('success', 'Sales return deleted, inventory adjusted, and reports updated.');
    }
}
