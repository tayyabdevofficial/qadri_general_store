<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $paymentMethods = PaymentMethod::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            })
            ->orderBy('sort_order')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('payment-methods/index', [
            'paymentMethods' => $paymentMethods,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,card,mobile_wallet,bank_transfer',
            'account_number' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $validated['code'] = Str::slug($validated['name']);

        PaymentMethod::create($validated);

        return redirect()->back()->with('success', 'Payment method added successfully.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,card,mobile_wallet,bank_transfer',
            'account_number' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $validated['code'] = Str::slug($validated['name']);

        $paymentMethod->update($validated);

        return redirect()->back()->with('success', 'Payment method updated successfully.');
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        if ($paymentMethod->orders()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete payment method with existing orders.');
        }

        $paymentMethod->delete();

        return redirect()->back()->with('success', 'Payment method deleted.');
    }
}
