<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $packages = Package::query()
            ->with(['items.product', 'items.productVariant'])
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('packages/index', [
            'packages' => $packages,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('packages/create', [
            'products' => Product::with(['unit', 'variants'])->active()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:100|unique:packages,barcode|unique:products,barcode|unique:product_variants,barcode',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('packages', 'public');
        }

        $package = Package::create([
            'name' => $validated['name'],
            'barcode' => $validated['barcode'] ?? Product::generateUniqueBarcode(),
            'price' => $validated['price'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'image_path' => $imagePath,
        ]);

        foreach ($validated['items'] as $item) {
            $package->items()->create([
                'product_id' => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'] ?? null,
                'quantity' => $item['quantity'],
            ]);
        }

        return redirect()->route('packages.index')->with('success', 'Package created successfully.');
    }

    public function edit(Package $package): Response
    {
        $package->load(['items.product', 'items.productVariant']);

        return Inertia::render('packages/edit', [
            'package' => $package,
            'products' => Product::with(['unit', 'variants'])->active()->get(),
        ]);
    }

    public function update(Request $request, Package $package)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:100|unique:packages,barcode,' . $package->id,
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
        ]);

        if ($request->hasFile('image')) {
            if ($package->image_path && Storage::disk('public')->exists($package->image_path)) {
                Storage::disk('public')->delete($package->image_path);
            }
            $package->image_path = $request->file('image')->store('packages', 'public');
        }

        $package->update([
            'name' => $validated['name'],
            'barcode' => $validated['barcode'] ?? $package->barcode,
            'price' => $validated['price'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

        $package->items()->delete();
        foreach ($validated['items'] as $item) {
            $package->items()->create([
                'product_id' => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'] ?? null,
                'quantity' => $item['quantity'],
            ]);
        }

        return redirect()->route('packages.index')->with('success', 'Package updated successfully.');
    }

    public function updateStatus(Request $request, Package $package)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $package->update(['status' => $validated['status']]);

        $message = $validated['status'] === 'active'
            ? 'Package enabled and visible on POS.'
            : 'Package disabled and hidden from POS.';

        return redirect()->back()->with('success', $message);
    }

    public function destroy(Package $package)
    {
        if ($package->image_path && Storage::disk('public')->exists($package->image_path)) {
            Storage::disk('public')->delete($package->image_path);
        }

        $package->delete();

        return redirect()->back()->with('success', 'Package deleted successfully.');
    }
}
