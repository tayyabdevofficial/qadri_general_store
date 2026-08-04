<?php

use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\RegisterSessionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SalesReturnController;
use App\Http\Controllers\StoreSettingController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // POS System
    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::get('/pos/checkout', fn () => redirect()->route('pos.index'));
    Route::post('/pos/checkout', [PosController::class, 'checkout'])->name('pos.checkout');
    Route::post('/pos/hold-cart', [PosController::class, 'holdCart'])->name('pos.hold-cart');
    Route::delete('/pos/held-cart/{heldCart}', [PosController::class, 'deleteHeldCart'])->name('pos.delete-held-cart');

    // Shift Register
    Route::post('/register/open', [RegisterSessionController::class, 'openSession'])->name('register.open');
    Route::post('/register/close/{session}', [RegisterSessionController::class, 'closeSession'])->name('register.close');

    // Products & Barcodes
    Route::get('/products/barcodes', [BarcodeController::class, 'index'])->name('products.barcodes');
    Route::patch('/products/{product}/status', [ProductController::class, 'updateStatus'])->name('products.update-status');
    Route::resource('products', ProductController::class);

    // Packages & Bundles
    Route::patch('/packages/{package}/status', [PackageController::class, 'updateStatus'])->name('packages.update-status');
    Route::resource('packages', PackageController::class);

    // Categories & Units
    Route::resource('categories', CategoryController::class)->except(['create', 'show', 'edit']);
    Route::resource('units', UnitController::class)->except(['create', 'show', 'edit']);

    // Customers & Supplier Management
    Route::post('/customers/{customer}/receive-payment', [CustomerController::class, 'receivePayment'])->name('customers.receive-payment');
    Route::resource('customers', CustomerController::class);

    Route::post('/suppliers/{supplier}/make-payment', [SupplierController::class, 'makePayment'])->name('suppliers.make-payment');
    Route::resource('suppliers', SupplierController::class)->except(['create', 'edit']);

    // Purchases (Stock-In)
    Route::post('/purchases/{purchase}/pay', [PurchaseController::class, 'pay'])->name('purchases.pay');
    Route::resource('purchases', PurchaseController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);

    // Payment Methods
    Route::resource('payment-methods', PaymentMethodController::class)->except(['create', 'show', 'edit']);

    // Orders & Receipts
    Route::get('/orders/{order}/receipt', [OrderController::class, 'receipt'])->name('orders.receipt');
    Route::resource('orders', OrderController::class)->only(['index', 'show', 'destroy']);

    // Sales Returns
    Route::resource('returns', SalesReturnController::class)->only(['index', 'create', 'store', 'destroy']);

    // Expenses
    Route::post('/expenses/categories', [ExpenseController::class, 'storeCategory'])->name('expenses.categories.store');
    Route::resource('expenses', ExpenseController::class)->only(['index', 'store', 'destroy']);

    // Reports & Analytics
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    // Store Settings
    Route::get('/settings/store', [StoreSettingController::class, 'index'])->name('settings.store.index');
    Route::post('/settings/store', [StoreSettingController::class, 'update'])->name('settings.store.update');
});

require __DIR__.'/settings.php';
