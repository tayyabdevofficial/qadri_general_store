<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Package;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\RegisterSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderProcessingService
{
    public function createOrder(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $customer = Customer::findOrFail($data['customer_id']);
            $items = $data['items'] ?? [];

            if (empty($items)) {
                throw ValidationException::withMessages([
                    'items' => 'Cart cannot be empty.',
                ]);
            }

            // Calculate Order Items
            $processedItems = [];
            $orderSubtotal = 0;
            $orderTotalCost = 0;

            foreach ($items as $itemData) {
                $itemType = $itemData['item_type'] ?? 'product';
                $pricingMode = $itemData['pricing_mode'] ?? 'qty'; // 'qty' or 'amount'
                $unitCostPrice = 0;
                $unitSellPrice = 0;
                $soldQty = 0;
                $itemName = '';
                $unitName = '';
                $productId = null;
                $productVariantId = null;
                $packageId = null;

                if ($itemType === 'product') {
                    $product = Product::with('unit')->findOrFail($itemData['product_id']);
                    $productId = $product->id;
                    $itemName = $product->name;
                    $unitName = $product->unit ? $product->unit->short_name : '';
                    $unitCostPrice = (float) $product->buy_price;
                    $unitSellPrice = (float) $product->sell_price;

                    if ($pricingMode === 'amount' && $product->unit && $product->unit->is_variable_price) {
                        $inputAmount = (float) ($itemData['manual_amount'] ?? 0);
                        if ($unitSellPrice <= 0) {
                            throw ValidationException::withMessages(['items' => "Product {$product->name} sell price must be greater than zero."]);
                        }
                        $soldQty = round($inputAmount / $unitSellPrice, 3);
                    } else {
                        $soldQty = (float) ($itemData['quantity'] ?? 1);
                    }

                    // Stock check & deduction
                    if ($product->product_type === 'simple') {
                        if ($product->quantity < $soldQty) {
                            throw ValidationException::withMessages([
                                'items' => "Insufficient stock for {$product->name}. Available: {$product->quantity}, Requested: {$soldQty}",
                            ]);
                        }
                        $product->decrement('quantity', $soldQty);
                    }
                } elseif ($itemType === 'variant') {
                    $variant = ProductVariant::with('product.unit')->findOrFail($itemData['product_variant_id']);
                    $productVariantId = $variant->id;
                    $productId = $variant->product_id;
                    $itemName = $variant->product->name . ' - ' . $variant->variant_name;
                    $unitName = $variant->product->unit ? $variant->product->unit->short_name : '';
                    $unitCostPrice = (float) $variant->buy_price;
                    $unitSellPrice = (float) $variant->sell_price;
                    $soldQty = (float) ($itemData['quantity'] ?? 1);

                    if ($variant->quantity < $soldQty) {
                        throw ValidationException::withMessages([
                            'items' => "Insufficient stock for {$itemName}. Available: {$variant->quantity}, Requested: {$soldQty}",
                        ]);
                    }
                    $variant->decrement('quantity', $soldQty);
                } elseif ($itemType === 'package') {
                    $package = Package::with(['items.product', 'items.productVariant'])->findOrFail($itemData['package_id']);
                    $packageId = $package->id;
                    $itemName = '[Package] ' . $package->name;
                    $unitName = 'pkg';
                    $soldQty = (float) ($itemData['quantity'] ?? 1);
                    $unitSellPrice = (float) $package->price;
                    $packageCost = 0;

                    // Deduct stock for each item in package
                    foreach ($package->items as $pItem) {
                        $reqQty = $pItem->quantity * $soldQty;
                        if ($pItem->product_variant_id) {
                            $v = $pItem->productVariant;
                            if ($v->quantity < $reqQty) {
                                throw ValidationException::withMessages(['items' => "Package stock error: Insufficient stock for {$v->variant_name}"]);
                            }
                            $v->decrement('quantity', $reqQty);
                            $packageCost += ($v->buy_price * $pItem->quantity);
                        } else {
                            $p = $pItem->product;
                            if ($p->quantity < $reqQty) {
                                throw ValidationException::withMessages(['items' => "Package stock error: Insufficient stock for {$p->name}"]);
                            }
                            $p->decrement('quantity', $reqQty);
                            $packageCost += ($p->buy_price * $pItem->quantity);
                        }
                    }

                    $unitCostPrice = $packageCost;
                }

                $lineSubtotal = round($soldQty * $unitSellPrice, 2);
                $lineTotalCost = round($soldQty * $unitCostPrice, 2);
                $lineDiscount = (float) ($itemData['discount'] ?? 0);
                $lineTotalPrice = max(0, $lineSubtotal - $lineDiscount);
                $lineProfit = $lineTotalPrice - $lineTotalCost;

                $orderSubtotal += $lineSubtotal;
                $orderTotalCost += $lineTotalCost;

                $processedItems[] = [
                    'item_type' => $itemType,
                    'product_id' => $productId,
                    'product_variant_id' => $productVariantId,
                    'package_id' => $packageId,
                    'item_name' => $itemName,
                    'unit_name' => $unitName,
                    'quantity' => $soldQty,
                    'unit_cost_price' => $unitCostPrice,
                    'unit_sell_price' => $unitSellPrice,
                    'total_cost' => $lineTotalCost,
                    'subtotal' => $lineSubtotal,
                    'discount' => $lineDiscount,
                    'total_price' => $lineTotalPrice,
                    'profit' => $lineProfit,
                    'pricing_mode' => $pricingMode,
                ];
            }

            // Discount & Tax calculations
            $discountType = $data['discount_type'] ?? null;
            $discountValue = (float) ($data['discount_amount'] ?? 0);
            $taxAmount = (float) ($data['tax_amount'] ?? 0);
            $discountAmount = 0;

            if ($discountType === 'percentage') {
                $discountAmount = round(($orderSubtotal * $discountValue) / 100, 2);
            } elseif ($discountType === 'fixed') {
                $discountAmount = $discountValue;
            }

            $totalAmount = max(0, ($orderSubtotal - $discountAmount) + $taxAmount);
            $totalProfit = $totalAmount - $orderTotalCost;
            $paidAmount = (float) ($data['paid_amount'] ?? 0);

            // Walk-in Customer Validation Rule
            if ($customer->is_walk_in && $paidAmount < $totalAmount) {
                throw ValidationException::withMessages([
                    'paid_amount' => 'Walk-in Customer must pay the full order amount or more. Debt is only allowed for registered customers.',
                ]);
            }

            $dueAmount = 0;
            $changeReturn = 0;

            if ($paidAmount >= $totalAmount) {
                $changeReturn = round($paidAmount - $totalAmount, 2);
                $paymentStatus = 'paid';
            } else {
                $dueAmount = round($totalAmount - $paidAmount, 2);
                $paymentStatus = $paidAmount > 0 ? 'partial' : 'unpaid';
            }

            $activeSession = RegisterSession::getActiveSession($userId);

            // Create Order Record
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'customer_id' => $customer->id,
                'payment_method_id' => $data['payment_method_id'] ?? null,
                'register_session_id' => $activeSession ? $activeSession->id : null,
                'subtotal' => $orderSubtotal,
                'discount_type' => $discountType,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'total_cost' => $orderTotalCost,
                'total_profit' => $totalProfit,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'change_return' => $changeReturn,
                'payment_status' => $paymentStatus,
                'payment_reference' => $data['payment_reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'user_id' => $userId,
            ]);

            // Save Order Items
            foreach ($processedItems as $itemData) {
                $order->items()->create($itemData);
            }

            // Customer Advance Credit & Balance Ledger Update
            if (!$customer->is_walk_in) {
                $prevBalance = (float) $customer->outstanding_balance;

                // 1. If customer has advance credit (negative balance) and order has a due amount, apply advance credit
                if ($prevBalance < 0 && $dueAmount > 0) {
                    $advanceAvailable = abs($prevBalance);
                    $creditApplied = min($advanceAvailable, $dueAmount);

                    $paidAmount += $creditApplied;
                    $dueAmount -= $creditApplied;
                    $paymentStatus = $dueAmount <= 0 ? 'paid' : ($paidAmount > 0 ? 'partial' : 'unpaid');

                    // Update order record with applied advance
                    $order->update([
                        'paid_amount' => $paidAmount,
                        'due_amount' => $dueAmount,
                        'payment_status' => $paymentStatus,
                    ]);

                    $newBalance = $prevBalance + $creditApplied;
                    $customer->update(['outstanding_balance' => $newBalance]);

                    CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'order_id' => $order->id,
                        'type' => 'sale',
                        'amount' => $creditApplied,
                        'previous_balance' => $prevBalance,
                        'new_balance' => $newBalance,
                        'description' => "Applied Rs. " . number_format($creditApplied, 2) . " advance credit to Order #{$order->order_number}",
                    ]);
                }
                // 2. Otherwise if order leaves a remaining due amount, add to customer debt balance
                elseif ($dueAmount > 0) {
                    $newBalance = $prevBalance + $dueAmount;
                    $customer->update(['outstanding_balance' => $newBalance]);

                    CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'order_id' => $order->id,
                        'type' => 'sale',
                        'amount' => $dueAmount,
                        'previous_balance' => $prevBalance,
                        'new_balance' => $newBalance,
                        'description' => "Unpaid balance for Order #{$order->order_number}",
                    ]);
                }
            }

            return $order->load(['customer', 'items', 'paymentMethod', 'user']);
        });
    }
}
