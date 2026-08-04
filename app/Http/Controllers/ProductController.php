<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Package;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $status = $request->input('status');

        $products = Product::query()
            ->with(['category', 'unit', 'variants'])
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhereHas('variants', function ($q) use ($search) {
                        $q->where('variant_name', 'like', "%{$search}%")
                            ->orWhere('barcode', 'like', "%{$search}%");
                    });
            })
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $categories = Category::active()->get();
        $units = Unit::active()->get();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => $categories,
            'units' => $units,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('products/create', [
            'categories' => Category::active()->get(),
            'units' => Unit::active()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'category_id' => 'required|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:100|unique:products,barcode|unique:product_variants,barcode|unique:packages,barcode',
            'product_type' => 'required|in:simple,variant',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ];

        if ($request->input('product_type') === 'simple') {
            $rules['buy_price'] = 'required|numeric|gt:0|lte:sell_price';
            $rules['sell_price'] = 'required|numeric|gt:0|gte:buy_price';
            $rules['quantity'] = 'required|numeric|min:0';
        } else {
            $rules['variants'] = 'required|array|min:1';
            $rules['variants.*.variant_name'] = 'required|string|max:255';
            $rules['variants.*.barcode'] = 'nullable|string|max:100|unique:product_variants,barcode|unique:products,barcode|unique:packages,barcode';
            $rules['variants.*.buy_price'] = 'required|numeric|gt:0';
            $rules['variants.*.sell_price'] = 'required|numeric|gt:0';
            $rules['variants.*.quantity'] = 'required|numeric|min:0';
        }

        $validator = Validator::make($request->all(), $rules, [
            'category_id.required' => 'Please select a product category.',
            'unit_id.required' => 'Please select a unit of measurement.',
            'name.required' => 'Product name is required.',
            'barcode.unique' => 'This barcode is already assigned to another product or package.',
            'buy_price.required' => 'Purchase cost price is required.',
            'buy_price.gt' => 'Purchase cost price must be greater than Rs. 0.',
            'buy_price.lte' => 'Purchase cost price cannot be greater than the selling price.',
            'sell_price.required' => 'Selling price is required.',
            'sell_price.gt' => 'Selling price must be greater than Rs. 0.',
            'sell_price.gte' => 'Selling price must be equal to or greater than the purchase cost price.',
            'variants.required' => 'Please add at least one product variant.',
            'variants.min' => 'Please add at least one product variant.',
            'variants.*.variant_name.required' => 'Variant name is required.',
            'variants.*.buy_price.required' => 'Variant purchase cost is required.',
            'variants.*.buy_price.gt' => 'Variant purchase cost price must be greater than Rs. 0.',
            'variants.*.sell_price.required' => 'Variant selling price is required.',
            'variants.*.sell_price.gt' => 'Variant selling price must be greater than Rs. 0.',
            'variants.*.barcode.unique' => 'Variant barcode is already assigned to another product, variant, or package.',
        ]);

        $validator->after(function ($validator) use ($request) {
            if ($request->input('product_type') === 'variant') {
                $variants = $request->input('variants', []);
                foreach ($variants as $idx => $v) {
                    if (isset($v['buy_price'], $v['sell_price']) && is_numeric($v['buy_price']) && is_numeric($v['sell_price'])) {
                        if (floatval($v['buy_price']) > floatval($v['sell_price'])) {
                            $validator->errors()->add(
                                "variants.{$idx}.buy_price",
                                "Variant #" . ($idx + 1) . " purchase cost cannot be greater than its selling price."
                            );
                        }
                    }
                }
            }
        });

        $validated = $validator->validate();

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $slug = $this->generateUniqueSlug($validated['name']);

        $productData = [
            'category_id' => $validated['category_id'],
            'unit_id' => $validated['unit_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'barcode' => $validated['barcode'] ?? null,
            'product_type' => $validated['product_type'],
            'buy_price' => $validated['product_type'] === 'simple' ? $validated['buy_price'] : 0,
            'sell_price' => $validated['product_type'] === 'simple' ? $validated['sell_price'] : 0,
            'quantity' => $validated['product_type'] === 'simple' ? $validated['quantity'] : 0,
            'min_stock_alert' => $validated['min_stock_alert'] ?? 5,
            'expiry_date' => $validated['expiry_date'] ?? null,
            'status' => $validated['status'],
            'image_path' => $imagePath,
        ];

        $product = Product::create($productData);

        if ($validated['product_type'] === 'variant' && !empty($validated['variants'])) {
            foreach ($validated['variants'] as $v) {
                $product->variants()->create([
                    'variant_name' => $v['variant_name'],
                    'barcode' => $v['barcode'] ?? Product::generateUniqueBarcode(),
                    'buy_price' => $v['buy_price'],
                    'sell_price' => $v['sell_price'],
                    'quantity' => $v['quantity'],
                    'status' => 'active',
                ]);
            }
        }

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }

    public function edit(Product $product): Response
    {
        $product->load(['category', 'unit', 'variants']);

        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => Category::active()->get(),
            'units' => Unit::active()->get(),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $rules = [
            'category_id' => 'required|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:100|unique:products,barcode,' . $product->id,
            'product_type' => 'required|in:simple,variant',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ];

        if ($request->input('product_type') === 'simple') {
            $rules['buy_price'] = 'required|numeric|gt:0|lte:sell_price';
            $rules['sell_price'] = 'required|numeric|gt:0|gte:buy_price';
            $rules['quantity'] = 'required|numeric|min:0';
        } else {
            $rules['variants'] = 'required|array|min:1';
            $rules['variants.*.id'] = 'nullable|exists:product_variants,id';
            $rules['variants.*.variant_name'] = 'required|string|max:255';
            $rules['variants.*.barcode'] = 'nullable|string|max:100';
            $rules['variants.*.buy_price'] = 'required|numeric|gt:0';
            $rules['variants.*.sell_price'] = 'required|numeric|gt:0';
            $rules['variants.*.quantity'] = 'required|numeric|min:0';
        }

        $validator = Validator::make($request->all(), $rules, [
            'category_id.required' => 'Please select a product category.',
            'unit_id.required' => 'Please select a unit of measurement.',
            'name.required' => 'Product name is required.',
            'barcode.unique' => 'This barcode is already assigned to another product.',
            'buy_price.required' => 'Purchase cost price is required.',
            'buy_price.gt' => 'Purchase cost price must be greater than Rs. 0.',
            'buy_price.lte' => 'Purchase cost price cannot be greater than the selling price.',
            'sell_price.required' => 'Selling price is required.',
            'sell_price.gt' => 'Selling price must be greater than Rs. 0.',
            'sell_price.gte' => 'Selling price must be equal to or greater than the purchase cost price.',
            'variants.required' => 'Please add at least one product variant.',
            'variants.min' => 'Please add at least one product variant.',
            'variants.*.variant_name.required' => 'Variant name is required.',
            'variants.*.buy_price.required' => 'Variant purchase cost is required.',
            'variants.*.buy_price.gt' => 'Variant purchase cost price must be greater than Rs. 0.',
            'variants.*.sell_price.required' => 'Variant selling price is required.',
            'variants.*.sell_price.gt' => 'Variant selling price must be greater than Rs. 0.',
        ]);

        $validator->after(function ($validator) use ($request) {
            if ($request->input('product_type') === 'variant') {
                $variants = $request->input('variants', []);
                foreach ($variants as $idx => $v) {
                    if (isset($v['buy_price'], $v['sell_price']) && is_numeric($v['buy_price']) && is_numeric($v['sell_price'])) {
                        if (floatval($v['buy_price']) > floatval($v['sell_price'])) {
                            $validator->errors()->add(
                                "variants.{$idx}.buy_price",
                                "Variant #" . ($idx + 1) . " purchase cost cannot be greater than its selling price."
                            );
                        }
                    }
                }
            }
        });

        $validated = $validator->validate();

        if ($request->hasFile('image')) {
            if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
                Storage::disk('public')->delete($product->image_path);
            }
            $product->image_path = $request->file('image')->store('products', 'public');
        }

        if ($product->name !== $validated['name']) {
            $product->slug = $this->generateUniqueSlug($validated['name'], $product->id);
        }

        $product->category_id = $validated['category_id'];
        $product->unit_id = $validated['unit_id'];
        $product->name = $validated['name'];
        $product->barcode = $validated['barcode'] ?? $product->barcode;
        $product->product_type = $validated['product_type'];
        $product->buy_price = $validated['product_type'] === 'simple' ? $validated['buy_price'] : 0;
        $product->sell_price = $validated['product_type'] === 'simple' ? $validated['sell_price'] : 0;
        $product->quantity = $validated['product_type'] === 'simple' ? $validated['quantity'] : 0;
        $product->min_stock_alert = $validated['min_stock_alert'] ?? 5;
        $product->expiry_date = $validated['expiry_date'] ?? null;
        $product->status = $validated['status'];
        $product->save();

        if ($validated['product_type'] === 'variant' && !empty($validated['variants'])) {
            $existingVariantIds = [];
            foreach ($validated['variants'] as $v) {
                if (!empty($v['id'])) {
                    $variant = ProductVariant::find($v['id']);
                    if ($variant) {
                        $variant->update([
                            'variant_name' => $v['variant_name'],
                            'barcode' => $v['barcode'] ?? $variant->barcode,
                            'buy_price' => $v['buy_price'],
                            'sell_price' => $v['sell_price'],
                            'quantity' => $v['quantity'],
                        ]);
                        $existingVariantIds[] = $variant->id;
                    }
                } else {
                    $newVariant = $product->variants()->create([
                        'variant_name' => $v['variant_name'],
                        'barcode' => $v['barcode'] ?? Product::generateUniqueBarcode(),
                        'buy_price' => $v['buy_price'],
                        'sell_price' => $v['sell_price'],
                        'quantity' => $v['quantity'],
                        'status' => 'active',
                    ]);
                    $existingVariantIds[] = $newVariant->id;
                }
            }
            $product->variants()->whereNotIn('id', $existingVariantIds)->delete();
        } else if ($validated['product_type'] === 'simple') {
            $product->variants()->delete();
        }

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    public function updateStatus(Request $request, Product $product)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $product->update(['status' => $validated['status']]);

        $message = $validated['status'] === 'active'
            ? 'Product enabled and visible on POS.'
            : 'Product disabled and hidden from POS.';

        return redirect()->back()->with('success', $message);
    }

    public function destroy(Product $product)
    {
        if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->variants()->delete();
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }

    private function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (
            Product::where('slug', $slug)
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        return $slug;
    }
}
