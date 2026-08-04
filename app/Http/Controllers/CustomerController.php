<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $customers = Customer::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        Customer::create($validated);

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        if ($customer->is_walk_in) {
            return redirect()->back()->with('error', 'Cannot modify system Walk-in Customer.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $customer->update($validated);

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        if ($customer->is_walk_in) {
            return redirect()->back()->with('error', 'Cannot delete system Walk-in Customer.');
        }

        $customer->delete();

        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }

    public function show(Customer $customer): Response
    {
        $customer->load([
            'transactions' => function ($q) {
                $q->with('order')->latest();
            },
            'orders' => function ($q) {
                $q->with(['items', 'paymentMethod'])->latest();
            },
        ]);

        $paymentMethods = \App\Models\PaymentMethod::active()->get();

        return Inertia::render('customers/show', [
            'customer' => $customer,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function receivePayment(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'description' => 'nullable|string|max:255',
        ]);

        $amount = (float) $validated['amount'];
        $prevBalance = (float) $customer->outstanding_balance;
        $newBalance = $prevBalance - $amount;

        $customer->update(['outstanding_balance' => $newBalance]);

        CustomerTransaction::create([
            'customer_id' => $customer->id,
            'type' => 'payment',
            'amount' => $amount,
            'previous_balance' => $prevBalance,
            'new_balance' => $newBalance,
            'description' => $validated['description'] ?? 'Payment received from customer',
        ]);

        // Auto-allocate payment to customer's open/unpaid orders (oldest first)
        $pendingOrders = \App\Models\Order::where('customer_id', $customer->id)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->orderBy('created_at', 'asc')
            ->get();

        $remAmount = $amount;
        foreach ($pendingOrders as $order) {
            if ($remAmount <= 0) break;

            $due = (float) $order->due_amount;
            if ($due <= 0) continue;

            $pay = min($remAmount, $due);
            $newOrderPaid = (float) $order->paid_amount + $pay;
            $newOrderDue = max(0, $due - $pay);
            $newStatus = $newOrderDue <= 0 ? 'paid' : 'partial';

            $order->update([
                'paid_amount' => $newOrderPaid,
                'due_amount' => $newOrderDue,
                'payment_status' => $newStatus,
            ]);

            $remAmount -= $pay;
        }

        return redirect()->back()->with('success', 'Payment of Rs. ' . number_format($amount, 2) . ' recorded successfully.');
    }
}
