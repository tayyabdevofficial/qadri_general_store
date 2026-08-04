<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $purchases = Purchase::query()
            ->with(['supplier', 'user', 'items.product'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('purchase_number', 'like', "%{$search}%")
                        ->orWhereHas('supplier', function ($sq) use ($search) {
                            $sq->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('purchases/index', [
            'purchases' => $purchases,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('purchases/create', [
            'suppliers' => Supplier::active()->get(),
            'products' => Product::with(['unit', 'variants'])->active()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'paid_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_cost_price' => 'required|numeric|min:0',
            'items.*.unit_sell_price' => 'required|numeric|min:0',
            'items.*.expiry_date' => 'nullable|date',
        ]);

        foreach ($validated['items'] as $idx => $item) {
            $cost = (float) $item['unit_cost_price'];
            $sell = (float) $item['unit_sell_price'];
            if ($sell <= $cost) {
                $itemName = 'Item #' . ($idx + 1);
                if (!empty($item['product_variant_id'])) {
                    $v = ProductVariant::find($item['product_variant_id']);
                    if ($v) $itemName = $v->variant_name;
                } elseif (!empty($item['product_id'])) {
                    $p = Product::find($item['product_id']);
                    if ($p) $itemName = $p->name;
                }
                throw ValidationException::withMessages([
                    "items.{$idx}.unit_sell_price" => "Unit sell price (Rs. {$sell}) for {$itemName} must be greater than unit cost price (Rs. {$cost}).",
                ]);
            }
        }

        DB::transaction(function () use ($validated, $request) {
            $supplier = Supplier::findOrFail($validated['supplier_id']);
            $totalAmount = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $qty = (float) $item['quantity'];
                $cost = (float) $item['unit_cost_price'];
                $sell = (float) $item['unit_sell_price'];
                $lineTotal = round($qty * $cost, 2);
                $totalAmount += $lineTotal;

                // Update product stock and pricing
                if (!empty($item['product_variant_id'])) {
                    $variant = ProductVariant::findOrFail($item['product_variant_id']);
                    $variant->increment('quantity', $qty);
                    $variant->update(['buy_price' => $cost, 'sell_price' => $sell]);
                } else {
                    $product = Product::findOrFail($item['product_id']);
                    $product->increment('quantity', $qty);
                    $product->update([
                        'buy_price' => $cost,
                        'sell_price' => $sell,
                        'expiry_date' => $item['expiry_date'] ?? $product->expiry_date,
                    ]);
                }

                $itemsData[] = [
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'quantity' => $qty,
                    'unit_cost_price' => $cost,
                    'unit_sell_price' => $sell,
                    'total_cost' => $lineTotal,
                    'expiry_date' => $item['expiry_date'] ?? null,
                ];
            }

            $paidAmount = (float) $validated['paid_amount'];
            $prevBalance = (float) $supplier->outstanding_balance;

            // Apply existing advance credit if supplier balance is negative (< 0)
            $creditToApply = 0;
            if ($prevBalance < 0) {
                $initialDue = max(0, $totalAmount - $paidAmount);
                $creditAvailable = abs($prevBalance);
                $creditToApply = min($creditAvailable, $initialDue);
            }

            $effectivePaid = $paidAmount + $creditToApply;
            $dueAmount = max(0, $totalAmount - $effectivePaid);
            $paymentStatus = $dueAmount == 0 ? 'paid' : ($effectivePaid > 0 ? 'partial' : 'unpaid');

            $purchaseNumber = Purchase::generatePurchaseNumber();

            $purchase = Purchase::create([
                'purchase_number' => $purchaseNumber,
                'supplier_id' => $supplier->id,
                'purchase_date' => $validated['purchase_date'],
                'total_amount' => $totalAmount,
                'paid_amount' => $effectivePaid,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'] ?? null,
                'user_id' => $request->user()->id,
            ]);

            foreach ($itemsData as $iData) {
                $purchase->items()->create($iData);
            }

            // Update supplier outstanding balance (net change = total purchase cost - direct cash paid)
            $netBalanceChange = $totalAmount - $paidAmount;
            $newBalance = $prevBalance + $netBalanceChange;
            $supplier->update(['outstanding_balance' => $newBalance]);

            if ($netBalanceChange != 0 || $creditToApply > 0) {
                $desc = "Purchase #{$purchase->purchase_number}";
                if ($creditToApply > 0) {
                    $desc .= " (Applied Rs. " . number_format($creditToApply, 2) . " from supplier advance balance)";
                }

                SupplierTransaction::create([
                    'supplier_id' => $supplier->id,
                    'purchase_id' => $purchase->id,
                    'type' => 'purchase',
                    'amount' => abs($netBalanceChange),
                    'previous_balance' => $prevBalance,
                    'new_balance' => $newBalance,
                    'description' => $desc,
                ]);
            }

        });

        return redirect()->route('purchases.index')->with('success', 'Purchase recorded and inventory updated.');
    }

    public function edit(Purchase $purchase): Response
    {
        $purchase->load(['items.product', 'items.productVariant', 'supplier']);

        return Inertia::render('purchases/edit', [
            'purchase' => $purchase,
            'suppliers' => Supplier::active()->get(),
            'products' => Product::with(['unit', 'variants'])->active()->get(),
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'paid_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_cost_price' => 'required|numeric|min:0',
            'items.*.unit_sell_price' => 'required|numeric|min:0',
            'items.*.expiry_date' => 'nullable|date',
        ]);

        foreach ($validated['items'] as $idx => $item) {
            $cost = (float) $item['unit_cost_price'];
            $sell = (float) $item['unit_sell_price'];
            if ($sell <= $cost) {
                $itemName = 'Item #' . ($idx + 1);
                if (!empty($item['product_variant_id'])) {
                    $v = ProductVariant::find($item['product_variant_id']);
                    if ($v) $itemName = $v->variant_name;
                } elseif (!empty($item['product_id'])) {
                    $p = Product::find($item['product_id']);
                    if ($p) $itemName = $p->name;
                }
                throw ValidationException::withMessages([
                    "items.{$idx}.unit_sell_price" => "Unit sell price (Rs. {$sell}) for {$itemName} must be greater than unit cost price (Rs. {$cost}).",
                ]);
            }
        }

        DB::transaction(function () use ($validated, $request, $purchase) {
            $purchase->load(['items', 'supplier']);
            $oldSupplier = $purchase->supplier;

            // 1. Revert previous stock quantities from old purchase items
            foreach ($purchase->items as $oldItem) {
                $oldQty = (float) $oldItem->quantity;
                if (!empty($oldItem->product_variant_id)) {
                    $v = ProductVariant::find($oldItem->product_variant_id);
                    if ($v) {
                        $v->decrement('quantity', $oldQty);
                    }
                } elseif (!empty($oldItem->product_id)) {
                    $p = Product::find($oldItem->product_id);
                    if ($p) {
                        $p->decrement('quantity', $oldQty);
                    }
                }
            }

            // 2. Revert previous net supplier balance change
            $oldTotal = (float) $purchase->total_amount;
            $oldPaid = (float) $purchase->paid_amount;
            $oldNet = $oldTotal - $oldPaid;

            if ($oldSupplier && $oldNet != 0) {
                $prevBal = (float) $oldSupplier->outstanding_balance;
                $revertedBal = $prevBal - $oldNet;
                $oldSupplier->update(['outstanding_balance' => $revertedBal]);
            }

            // 3. Process new purchase items & add new stock
            $newSupplier = Supplier::findOrFail($validated['supplier_id']);
            $newTotalAmount = 0;
            $newItemsData = [];

            foreach ($validated['items'] as $item) {
                $qty = (float) $item['quantity'];
                $cost = (float) $item['unit_cost_price'];
                $sell = (float) $item['unit_sell_price'];
                $lineTotal = round($qty * $cost, 2);
                $newTotalAmount += $lineTotal;

                if (!empty($item['product_variant_id'])) {
                    $variant = ProductVariant::findOrFail($item['product_variant_id']);
                    $variant->increment('quantity', $qty);
                    $variant->update(['buy_price' => $cost, 'sell_price' => $sell]);
                } else {
                    $product = Product::findOrFail($item['product_id']);
                    $product->increment('quantity', $qty);
                    $product->update([
                        'buy_price' => $cost,
                        'sell_price' => $sell,
                        'expiry_date' => $item['expiry_date'] ?? $product->expiry_date,
                    ]);
                }

                $newItemsData[] = [
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'quantity' => $qty,
                    'unit_cost_price' => $cost,
                    'unit_sell_price' => $sell,
                    'total_cost' => $lineTotal,
                    'expiry_date' => $item['expiry_date'] ?? null,
                ];
            }

            $newPaidAmount = (float) $validated['paid_amount'];
            $newDueAmount = max(0, $newTotalAmount - $newPaidAmount);
            $paymentStatus = $newDueAmount == 0 ? 'paid' : ($newPaidAmount > 0 ? 'partial' : 'unpaid');

            // 4. Update purchase header and recreate items
            $purchase->update([
                'supplier_id' => $newSupplier->id,
                'purchase_date' => $validated['purchase_date'],
                'total_amount' => $newTotalAmount,
                'paid_amount' => $newPaidAmount,
                'due_amount' => $newDueAmount,
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            $purchase->items()->delete();

            foreach ($newItemsData as $iData) {
                $purchase->items()->create($iData);
            }

            // 5. Update supplier outstanding balance for new purchase net difference
            $newNet = $newTotalAmount - $newPaidAmount;
            $currentBal = (float) $newSupplier->outstanding_balance;
            $finalBal = $currentBal + $newNet;
            $newSupplier->update(['outstanding_balance' => $finalBal]);

            if ($newNet != 0 || $oldNet != 0) {
                SupplierTransaction::create([
                    'supplier_id' => $newSupplier->id,
                    'purchase_id' => $purchase->id,
                    'type' => 'adjustment',
                    'amount' => abs($newNet),
                    'previous_balance' => $currentBal,
                    'new_balance' => $finalBal,
                    'description' => "Updated Purchase #{$purchase->purchase_number}",
                ]);
            }
        });

        return redirect()->route('purchases.index')->with('success', 'Purchase updated successfully and stock & supplier balances adjusted.');
    }

    public function pay(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $purchase) {
            $amount = (float) $validated['amount'];

            $supplier = $purchase->supplier;
            if ($supplier) {
                $prevBalance = (float) $supplier->outstanding_balance;
                $newBalance = $prevBalance - $amount;
                $supplier->update(['outstanding_balance' => $newBalance]);

                SupplierTransaction::create([
                    'supplier_id' => $supplier->id,
                    'purchase_id' => $purchase->id,
                    'type' => 'payment',
                    'amount' => $amount,
                    'previous_balance' => $prevBalance,
                    'new_balance' => $newBalance,
                    'description' => $validated['notes'] ?? "Payment for Purchase #{$purchase->purchase_number}",
                ]);
            }

            $due = (float) $purchase->due_amount;
            $paidThisPurchase = min($amount, $due);
            $newPaidAmount = (float) $purchase->paid_amount + $paidThisPurchase;
            $newDueAmount = max(0, $due - $paidThisPurchase);
            $newStatus = $newDueAmount <= 0 ? 'paid' : ($newPaidAmount > 0 ? 'partial' : 'unpaid');

            $purchase->update([
                'paid_amount' => $newPaidAmount,
                'due_amount' => $newDueAmount,
                'payment_status' => $newStatus,
            ]);
        });

        return redirect()->back()->with('success', 'Purchase payment recorded successfully.');
    }

    public function destroy(Purchase $purchase)
    {
        DB::transaction(function () use ($purchase) {
            $purchase->load(['items', 'supplier']);

            // Revert product/variant stock quantity
            foreach ($purchase->items as $item) {
                $qty = (float) $item->quantity;
                if (!empty($item->product_variant_id)) {
                    $variant = ProductVariant::find($item->product_variant_id);
                    if ($variant) {
                        $variant->decrement('quantity', $qty);
                    }
                } elseif (!empty($item->product_id)) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->decrement('quantity', $qty);
                    }
                }
            }

            // Adjust supplier outstanding balance & ledger
            $supplier = $purchase->supplier;
            if ($supplier) {
                $prevBalance = (float) $supplier->outstanding_balance;
                $newBalance = $prevBalance - (float) $purchase->total_amount;
                $supplier->update(['outstanding_balance' => $newBalance]);

                SupplierTransaction::create([
                    'supplier_id' => $supplier->id,
                    'purchase_id' => $purchase->id,
                    'type' => 'adjustment',
                    'amount' => (float) $purchase->total_amount,
                    'previous_balance' => $prevBalance,
                    'new_balance' => $newBalance,
                    'description' => "Deleted Purchase #{$purchase->purchase_number}",
                ]);
            }

            $purchase->delete();
        });

        return redirect()->back()->with('success', 'Purchase deleted, inventory stock reverted, and supplier balance updated.');
    }
}
