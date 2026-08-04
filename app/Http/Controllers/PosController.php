<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\HeldCart;
use App\Models\Package;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\RegisterSession;
use App\Models\StoreSetting;
use App\Services\OrderProcessingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;
        $activeSession = RegisterSession::getActiveSession($userId);

        $categories = Category::active()->get();
        $customers = Customer::active()->get();
        $walkInCustomer = Customer::getWalkInCustomer();
        $paymentMethods = PaymentMethod::active()->get();
        $storeSettings = StoreSetting::getSettings();
        $heldCarts = HeldCart::where('user_id', $userId)->with('customer')->latest()->get();

        $products = Product::query()
            ->with(['category', 'unit', 'variants'])
            ->active()
            ->get();

        $packages = Package::query()
            ->with(['items.product', 'items.productVariant'])
            ->active()
            ->get();

        return Inertia::render('pos/index', [
            'activeSession' => $activeSession,
            'categories' => $categories,
            'customers' => $customers,
            'walkInCustomer' => $walkInCustomer,
            'paymentMethods' => $paymentMethods,
            'products' => $products,
            'packages' => $packages,
            'heldCarts' => $heldCarts,
            'storeSettings' => $storeSettings,
        ]);
    }

    public function checkout(Request $request, OrderProcessingService $orderService)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'paid_amount' => 'required|numeric|min:0',
            'discount_type' => 'nullable|in:fixed,percentage',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_type' => 'required|in:product,variant,package',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.package_id' => 'nullable|exists:packages,id',
            'items.*.quantity' => 'nullable|numeric|min:0.0001',
            'items.*.manual_amount' => 'nullable|numeric|min:0.01',
            'items.*.pricing_mode' => 'required|in:qty,amount',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        $order = $orderService->createOrder($validated, $request->user()->id);

        return redirect()->back()->with([
            'success' => "Order #{$order->order_number} completed successfully.",
            'completedOrder' => $order,
        ]);
    }

    public function holdCart(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'cart_reference' => 'nullable|string|max:100',
            'cart_payload' => 'required|array',
            'total_amount' => 'required|numeric|min:0',
        ]);

        HeldCart::create([
            'user_id' => $request->user()->id,
            'customer_id' => $validated['customer_id'] ?? null,
            'cart_reference' => $validated['cart_reference'] ?? ('Cart #' . time()),
            'cart_payload' => $validated['cart_payload'],
            'total_amount' => $validated['total_amount'],
        ]);

        return redirect()->back()->with('success', 'Cart suspended successfully.');
    }

    public function deleteHeldCart(HeldCart $heldCart)
    {
        $heldCart->delete();
        return redirect()->back()->with('success', 'Held cart removed.');
    }
}
