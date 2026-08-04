<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $suppliers = Supplier::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        Supplier::create($validated);

        return redirect()->back()->with('success', 'Supplier created successfully.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $supplier->update($validated);

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return redirect()->back()->with('success', 'Supplier deleted successfully.');
    }

    public function show(Supplier $supplier): Response
    {
        $supplier->load([
            'transactions' => function ($q) {
                $q->latest();
            },
            'purchases' => function ($q) {
                $q->with('items.product')->latest();
            },
        ]);

        return Inertia::render('suppliers/show', [
            'supplier' => $supplier,
        ]);
    }

    public function makePayment(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $supplier) {
            $amount = (float) $validated['amount'];
            $prevBalance = (float) $supplier->outstanding_balance;
            $newBalance = $prevBalance - $amount;

            $supplier->update(['outstanding_balance' => $newBalance]);

            SupplierTransaction::create([
                'supplier_id' => $supplier->id,
                'type' => 'payment',
                'amount' => $amount,
                'previous_balance' => $prevBalance,
                'new_balance' => $newBalance,
                'description' => $validated['description'] ?? 'Payment made to supplier',
            ]);

            // Allocate payment towards pending purchase invoices (oldest first)
            $remAmount = $amount;
            $pendingPurchases = Purchase::where('supplier_id', $supplier->id)
                ->whereIn('payment_status', ['unpaid', 'partial'])
                ->where('due_amount', '>', 0)
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($pendingPurchases as $purchase) {
                if ($remAmount <= 0) {
                    break;
                }

                $due = (float) $purchase->due_amount;
                $paidThisPurchase = min($remAmount, $due);
                $newPaidAmount = (float) $purchase->paid_amount + $paidThisPurchase;
                $newDueAmount = max(0, $due - $paidThisPurchase);
                $newStatus = $newDueAmount <= 0 ? 'paid' : ($newPaidAmount > 0 ? 'partial' : 'unpaid');

                $purchase->update([
                    'paid_amount' => $newPaidAmount,
                    'due_amount' => $newDueAmount,
                    'payment_status' => $newStatus,
                ]);

                $remAmount -= $paidThisPurchase;
            }
        });

        return redirect()->back()->with('success', 'Supplier payment recorded and purchase statuses updated.');
    }
}

