import React, { useState, useEffect, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReceiptPrint } from '@/components/receipt-print';
import {
    AlertCircle,
    Barcode,
    Calculator,
    Check,
    ChevronsUpDown,
    CreditCard,
    DollarSign,
    Gift,
    Loader2,
    Minus,
    Package,
    Pause,
    Plus,
    Printer,
    RefreshCw,
    Search,
    ShoppingCart,
    Trash2,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface Unit {
    id: number;
    name: string;
    short_name: string;
    allow_decimal: boolean;
    is_variable_price: boolean;
}

interface Category {
    id: number;
    name: string;
}

interface ProductVariant {
    id: number;
    product_id: number;
    variant_name: string;
    barcode: string;
    buy_price: number;
    sell_price: number;
    quantity: number;
}

interface Product {
    id: number;
    category_id: number;
    unit_id: number;
    name: string;
    barcode: string;
    product_type: 'simple' | 'variant';
    buy_price: number;
    sell_price: number;
    quantity: number;
    image_url?: string;
    unit?: Unit;
    category?: Category;
    variants?: ProductVariant[];
}

interface PackageItem {
    id: number;
    product?: Product;
    productVariant?: ProductVariant;
    quantity: number;
}

interface PackageBundle {
    id: number;
    name: string;
    barcode: string;
    price: number;
    image_url?: string;
    items?: PackageItem[];
}

interface Customer {
    id: number;
    name: string;
    phone?: string;
    outstanding_balance: number;
    is_walk_in: boolean;
}

interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    type: string;
    account_number?: string;
}

interface CartItem {
    [key: string]: any;
    cart_id: string; // unique key
    item_type: 'product' | 'variant' | 'package';
    product_id?: number;
    product_variant_id?: number;
    package_id?: number;
    name: string;
    unit_name: string;
    sell_price: number;
    quantity: number;
    manual_amount: number;
    pricing_mode: 'qty' | 'amount';
    is_variable_price: boolean;
    stock: number;
    discount: number;
}

interface PosProps {
    activeSession: any;
    categories: Category[];
    customers: Customer[];
    walkInCustomer: Customer;
    paymentMethods: PaymentMethod[];
    products: Product[];
    packages: PackageBundle[];
    heldCarts: any[];
    storeSettings: any;
    flash?: {
        success?: string;
        completedOrder?: any;
    };
}

export default function PosTerminal({
    activeSession,
    categories,
    customers,
    walkInCustomer,
    paymentMethods,
    products,
    packages,
    heldCarts,
    storeSettings,
    flash,
}: PosProps) {
    const [selectedCategory, setSelectedCategory] = useState<number | 'all' | 'packages'>('all');
    const [mobileTab, setMobileTab] = useState<'cart' | 'catalog'>('cart');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer>(walkInCustomer || customers[0]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(
        paymentMethods.find((p) => p.type === 'cash') || paymentMethods[0] || null
    );

    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [taxAmount, setTaxAmount] = useState<number>(0);
    const [paidAmountInput, setPaidAmountInput] = useState<string>('');
    const [paymentReference, setPaymentReference] = useState('');

    // Modals
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isHeldCartsOpen, setIsHeldCartsOpen] = useState(false);
    const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<any>(null);
    // Customer Searchable Select state
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    const filteredCustomersList = [
        walkInCustomer,
        ...customers.filter((c) => !c.is_walk_in),
    ].filter((c) => {
        if (!customerSearch) return true;
        const q = customerSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
                setIsCustomerSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const focusSearchInput = () => {
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 50);
    };

    // Auto Barcode Match & Add to Cart
    const handleBarcodeScan = (code: string): boolean => {
        const trimmed = code.trim();
        if (!trimmed) return false;

        // 1. Check simple products barcode
        const simpleProd = products.find(
            (p) => p.product_type === 'simple' && p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()
        );
        if (simpleProd) {
            if (Number(simpleProd.quantity) <= 0) {
                toast.error(`Out of stock: ${simpleProd.name}`);
            } else {
                addProductToCart(simpleProd);
                toast.success(`Added: ${simpleProd.name}`);
            }
            setSearchQuery('');
            focusSearchInput();
            return true;
        }

        // 2. Check product variants barcode
        for (const p of products) {
            if (p.product_type === 'variant' && p.variants) {
                const v = p.variants.find((variant) => variant.barcode && variant.barcode.toLowerCase() === trimmed.toLowerCase());
                if (v) {
                    if (Number(v.quantity) <= 0) {
                        toast.error(`Out of stock: ${p.name} - ${v.variant_name}`);
                    } else {
                        addVariantToCart(p, v);
                        toast.success(`Added: ${p.name} - ${v.variant_name}`);
                    }
                    setSearchQuery('');
                    focusSearchInput();
                    return true;
                }
            }
        }

        // 3. Check packages barcode
        const pkg = packages.find((p) => p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase());
        if (pkg) {
            addPackageToCart(pkg);
            toast.success(`Added Bundle: ${pkg.name}`);
            setSearchQuery('');
            focusSearchInput();
            return true;
        }

        return false;
    };

    // Auto Focus Barcode Input on Mount & Modal Dismissal
    useEffect(() => {
        focusSearchInput();
    }, []);

    useEffect(() => {
        if (!isCheckoutOpen && !isHeldCartsOpen && !isNewCustomerOpen && !completedOrder) {
            focusSearchInput();
        }
    }, [isCheckoutOpen, isHeldCartsOpen, isNewCustomerOpen, completedOrder]);

    // Auto-detect scanned barcode string
    useEffect(() => {
        if (searchQuery.trim().length >= 3) {
            handleBarcodeScan(searchQuery);
        }
    }, [searchQuery]);

    // Filtered Products & Packages
    const filteredPackages = packages.filter((pkg) => {
        const q = searchQuery.toLowerCase();
        return !searchQuery || pkg.name.toLowerCase().includes(q) || (pkg.barcode && pkg.barcode.includes(q));
    });

    const filteredProducts = products.filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.includes(q)) ||
            p.variants?.some((v) => v.variant_name.toLowerCase().includes(q) || v.barcode?.includes(q));

        return matchesCategory && matchesSearch;
    });

    const handleCheckoutSubmitRef = useRef<() => void>(() => {});

    // Keyboard Shortcuts (F1: Focus Search, F7: Hold Cart, F8: Held Carts, F9: Checkout, Ctrl+P: Submit Payment)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                if (isCheckoutOpen) {
                    e.preventDefault();
                    handleCheckoutSubmitRef.current();
                }
            } else if (e.key === 'F1') {
                e.preventDefault();
                focusSearchInput();
            } else if (e.key === 'F7') {
                e.preventDefault();
                if (cart.length > 0) handleHoldCart();
            } else if (e.key === 'F8') {
                e.preventDefault();
                setIsHeldCartsOpen(true);
            } else if (e.key === 'F9') {
                e.preventDefault();
                if (cart.length > 0) setIsCheckoutOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, isCheckoutOpen]);

    // Handle Completed Order Flash from Backend
    useEffect(() => {
        if (flash?.completedOrder) {
            setCompletedOrder(flash.completedOrder);
            setCart([]);
            setPaidAmountInput('');
            setIsCheckoutOpen(false);
            toast.success('Order completed & thermal receipt ready!');
        }
    }, [flash]);

    // Cart Calculations
    const cartSubtotal = cart.reduce((sum, item) => {
        const numQty = typeof item.quantity === 'number' ? item.quantity : (parseFloat(String(item.quantity)) || 0);
        const numAmt = typeof item.manual_amount === 'number' ? item.manual_amount : (parseFloat(String(item.manual_amount)) || 0);
        if (item.pricing_mode === 'amount') {
            return sum + numAmt;
        }
        return sum + numQty * item.sell_price;
    }, 0);

    const calculatedDiscount =
        discountType === 'percentage' ? (cartSubtotal * discountValue) / 100 : discountValue;

    const cartTotal = Math.max(0, cartSubtotal - calculatedDiscount + taxAmount);
    const paidAmount = parseFloat(paidAmountInput) || 0;
    const changeReturn = Math.max(0, paidAmount - cartTotal);
    const dueAmount = Math.max(0, cartTotal - paidAmount);

    // Add Simple Product to Cart
    const addProductToCart = (product: Product) => {
        const cartId = `prod-${product.id}`;
        const isVariable = product.unit?.is_variable_price || false;

        setCart((prev) => {
            const existing = prev.find((item) => item.cart_id === cartId);
            if (existing) {
                const currentQty = typeof existing.quantity === 'number' ? existing.quantity : (parseFloat(String(existing.quantity)) || 0);
                const nextQty = Number((currentQty + 1).toFixed(3));
                const nextAmt = Number((nextQty * existing.sell_price).toFixed(2));
                return prev.map((item) =>
                    item.cart_id === cartId ? { ...item, quantity: nextQty, manual_amount: nextAmt } : item
                );
            }
            return [
                ...prev,
                {
                    cart_id: cartId,
                    item_type: 'product',
                    product_id: product.id,
                    name: product.name,
                    unit_name: product.unit?.short_name || 'pc',
                    sell_price: Number(product.sell_price),
                    quantity: 1,
                    manual_amount: Number(product.sell_price),
                    pricing_mode: 'qty',
                    is_variable_price: isVariable,
                    stock: Number(product.quantity),
                    discount: 0,
                },
            ];
        });
        focusSearchInput();
    };

    // Add Variant Product to Cart
    const addVariantToCart = (product: Product, variant: ProductVariant) => {
        const cartId = `var-${variant.id}`;
        setCart((prev) => {
            const existing = prev.find((item) => item.cart_id === cartId);
            if (existing) {
                const currentQty = typeof existing.quantity === 'number' ? existing.quantity : (parseFloat(String(existing.quantity)) || 0);
                const nextQty = Number((currentQty + 1).toFixed(3));
                const nextAmt = Number((nextQty * existing.sell_price).toFixed(2));
                return prev.map((item) =>
                    item.cart_id === cartId ? { ...item, quantity: nextQty, manual_amount: nextAmt } : item
                );
            }
            return [
                ...prev,
                {
                    cart_id: cartId,
                    item_type: 'variant',
                    product_id: product.id,
                    product_variant_id: variant.id,
                    name: `${product.name} - ${variant.variant_name}`,
                    unit_name: product.unit?.short_name || 'pc',
                    sell_price: Number(variant.sell_price),
                    quantity: 1,
                    manual_amount: Number(variant.sell_price),
                    pricing_mode: 'qty',
                    is_variable_price: product.unit?.is_variable_price || false,
                    stock: Number(variant.quantity),
                    discount: 0,
                },
            ];
        });
        focusSearchInput();
    };

    // Add Package to Cart
    const addPackageToCart = (pkg: PackageBundle) => {
        const cartId = `pkg-${pkg.id}`;
        setCart((prev) => {
            const existing = prev.find((item) => item.cart_id === cartId);
            if (existing) {
                return prev.map((item) =>
                    item.cart_id === cartId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [
                ...prev,
                {
                    cart_id: cartId,
                    item_type: 'package',
                    package_id: pkg.id,
                    name: `[Package] ${pkg.name}`,
                    unit_name: 'pkg',
                    sell_price: Number(pkg.price),
                    quantity: 1,
                    manual_amount: Number(pkg.price),
                    pricing_mode: 'qty',
                    is_variable_price: false,
                    stock: 999,
                    discount: 0,
                },
            ];
        });
        focusSearchInput();
    };

    // Update Cart Item
    const updateCartItem = (cartId: string, field: keyof CartItem, value: any) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.cart_id === cartId) {
                    const updated = { ...item, [field]: value };

                    if (field === 'quantity') {
                        const numQty = typeof value === 'number' ? value : (parseFloat(String(value)) || 0);
                        updated.quantity = value;
                        if (updated.sell_price > 0) {
                            updated.manual_amount = Number((numQty * updated.sell_price).toFixed(2));
                        }
                    } else if (field === 'manual_amount') {
                        const numAmt = typeof value === 'number' ? value : (parseFloat(String(value)) || 0);
                        updated.manual_amount = value;
                        if (updated.sell_price > 0) {
                            updated.quantity = Number((numAmt / updated.sell_price).toFixed(3));
                        }
                    } else if (field === 'pricing_mode') {
                        const numQty = typeof item.quantity === 'number' ? item.quantity : (parseFloat(String(item.quantity)) || 0);
                        const numAmt = typeof item.manual_amount === 'number' ? item.manual_amount : (parseFloat(String(item.manual_amount)) || 0);

                        if (value === 'qty') {
                            updated.manual_amount = Number((numQty * item.sell_price).toFixed(2));
                        } else if (value === 'amount') {
                            if (item.sell_price > 0) {
                                updated.quantity = Number((numAmt / item.sell_price).toFixed(3));
                            }
                        }
                    }

                    return updated;
                }
                return item;
            })
        );
    };

    const removeCartItem = (cartId: string) => {
        setCart((prev) => prev.filter((item) => item.cart_id !== cartId));
        focusSearchInput();
    };

    // Submit POS Checkout Order
    const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);

    const handleCheckoutSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isCheckoutSubmitting) return;

        if (selectedCustomer.is_walk_in && paidAmount < cartTotal) {
            toast.error('Walk-in Customer must pay the full order amount or more.');
            return;
        }

        setIsCheckoutSubmitting(true);

        router.post(
            '/pos/checkout',
            {
                customer_id: selectedCustomer.id,
                payment_method_id: selectedPaymentMethod?.id,
                paid_amount: paidAmount,
                discount_type: discountType,
                discount_amount: discountValue,
                tax_amount: taxAmount,
                payment_reference: paymentReference,
                items: cart.map((i) => ({
                    item_type: i.item_type,
                    product_id: i.product_id,
                    product_variant_id: i.product_variant_id,
                    package_id: i.package_id,
                    quantity: typeof i.quantity === 'number' ? i.quantity : (parseFloat(String(i.quantity)) || 0),
                    manual_amount: typeof i.manual_amount === 'number' ? i.manual_amount : (parseFloat(String(i.manual_amount)) || 0),
                    pricing_mode: i.pricing_mode,
                    discount: i.discount,
                })),
            } as any,
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsCheckoutSubmitting(false);
                    setIsCheckoutOpen(false);
                    const order = (page.props as any).flash?.completedOrder;
                    if (order) {
                        setCompletedOrder(order);
                        setCart([]);
                        setPaidAmountInput('');
                        toast.success(`Order #${order.order_number} completed successfully!`);
                    }
                },
                onError: (errs) => {
                    setIsCheckoutSubmitting(false);
                    const firstMsg = Object.values(errs)[0] as string;
                    toast.error(firstMsg || 'Failed to complete checkout order.');
                },
                onFinish: () => {
                    setIsCheckoutSubmitting(false);
                },
            }
        );
    };

    useEffect(() => {
        handleCheckoutSubmitRef.current = () => handleCheckoutSubmit();
    });

    // Hold Cart
    const handleHoldCart = () => {
        if (cart.length === 0) return;
        router.post(
            '/pos/hold-cart',
            {
                customer_id: selectedCustomer.id,
                cart_payload: cart,
                total_amount: cartTotal,
            },
            {
                onSuccess: () => {
                    setCart([]);
                    toast.success('Cart suspended successfully.');
                    focusSearchInput();
                },
            }
        );
    };

    // Resume Held Cart
    const handleResumeCart = (held: any) => {
        setCart(held.cart_payload || []);
        if (held.customer) setSelectedCustomer(held.customer);
        router.delete(`/pos/held-cart/${held.id}`);
        setIsHeldCartsOpen(false);
        toast.success('Cart resumed!');
        focusSearchInput();
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'POS Terminal', href: '/pos' }]}>
            <Head title="POS Terminal - Qadri General Store" />

            {/* Receipt Modal after completed transaction */}
            {completedOrder && (
                <Dialog open={!!completedOrder} onOpenChange={() => setCompletedOrder(null)}>
                    <DialogContent className="max-w-md p-6">
                        <ReceiptPrint
                            order={completedOrder}
                            storeSettings={storeSettings}
                            onClose={() => setCompletedOrder(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}

            <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background">
                {/* Mobile Header Tab Switcher (Only visible on screens < lg) */}
                <div className="flex items-center gap-2 p-2.5 bg-card border-b border-border lg:hidden shrink-0">
                    <button
                        type="button"
                        onClick={() => setMobileTab('cart')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            mobileTab === 'cart' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Cart ({cart.length})
                        {cartTotal > 0 && <span className="ml-1 text-[11px] font-extrabold font-mono">Rs. {cartTotal.toLocaleString()}</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('catalog')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            mobileTab === 'catalog' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        <Package className="h-4 w-4" />
                        Browse Catalog
                    </button>
                </div>

                {/* LEFT: Interactive POS Cart Sidebar (35% width on desktop, full view on mobile when cart active) */}
                <div className={`w-full lg:w-[420px] flex-col bg-card border-r border-border h-full ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Customer Searchable Selection Header */}
                    <div className="p-3 border-b border-border bg-muted/30">
                        <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Selection</Label>
                        <div ref={customerDropdownRef} className="relative w-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCustomerSearchOpen(!isCustomerSearchOpen);
                                    setCustomerSearch('');
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-xs font-semibold shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{selectedCustomer.name}</span>
                                    {selectedCustomer.phone && (
                                        <span className="text-muted-foreground text-[10px]">({selectedCustomer.phone})</span>
                                    )}
                                    {Number(selectedCustomer.outstanding_balance) > 0 && (
                                        <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                                            Due: Rs. {Number(selectedCustomer.outstanding_balance).toLocaleString()}
                                        </Badge>
                                    )}
                                    {Number(selectedCustomer.outstanding_balance) < 0 && (
                                        <Badge className="text-[9px] px-1 py-0 h-4 bg-emerald-600">
                                            Adv: Rs. {Math.abs(Number(selectedCustomer.outstanding_balance)).toLocaleString()}
                                        </Badge>
                                    )}
                                </div>
                                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                            </button>

                            {isCustomerSearchOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in-80">
                                    <div className="p-2 border-b border-border bg-muted/30 flex items-center gap-2">
                                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <Input
                                            placeholder="Type customer name or phone..."
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            className="h-7 text-xs bg-background"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
                                        {filteredCustomersList.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                No customer found matching "{customerSearch}"
                                            </div>
                                        ) : (
                                            filteredCustomersList.map((c) => {
                                                const isSelected = c.id === selectedCustomer.id;
                                                const due = Number(c.outstanding_balance);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCustomer(c);
                                                            setIsCustomerSearchOpen(false);
                                                            setCustomerSearch('');
                                                            focusSearchInput();
                                                        }}
                                                        className={`w-full text-left p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-between text-xs transition-colors ${
                                                            isSelected
                                                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span>{c.name}</span>
                                                                {c.is_walk_in && (
                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0">Walk-in</Badge>
                                                                )}
                                                            </div>
                                                            {c.phone && (
                                                                <p className="text-[10px] text-muted-foreground font-mono">{c.phone}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {due > 0 && (
                                                                <span className="text-[10px] font-bold text-amber-600">Due: Rs. {due.toLocaleString()}</span>
                                                            )}
                                                            {due < 0 && (
                                                                <span className="text-[10px] font-bold text-emerald-600">Adv: Rs. {Math.abs(due).toLocaleString()}</span>
                                                            )}
                                                            {isSelected && (
                                                                <Check className="h-4 w-4 text-emerald-600 ml-1 inline-block" />
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Quick Add Products Trigger */}
                    <div className="p-2 border-b border-border bg-emerald-50/50 dark:bg-emerald-950/20 lg:hidden shrink-0">
                        <Button
                            onClick={() => setMobileTab('catalog')}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs font-bold border-emerald-600 text-emerald-700 dark:text-emerald-300 gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            + Add Products / Browse Catalog
                        </Button>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 py-12">
                                <ShoppingCart className="h-10 w-10 stroke-1 opacity-50" />
                                <p className="text-sm font-medium">Cart is currently empty</p>
                                <p className="text-xs">Click products or scan barcodes to add items</p>
                                <Button
                                    onClick={() => setMobileTab('catalog')}
                                    size="sm"
                                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs lg:hidden"
                                >
                                    Browse Product Catalog
                                </Button>
                            </div>
                        ) : (
                            cart.map((item) => {
                                const numQty = typeof item.quantity === 'number' ? item.quantity : (parseFloat(String(item.quantity)) || 0);
                                const numAmt = typeof item.manual_amount === 'number' ? item.manual_amount : (parseFloat(String(item.manual_amount)) || 0);
                                const lineTotalCost = item.pricing_mode === 'amount' ? numAmt : (numQty * item.sell_price);

                                return (
                                    <div key={item.cart_id} className="p-3 rounded-lg border border-border bg-background space-y-2.5 shadow-2xs">
                                        {/* Item Header & Total Cost */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-xs leading-tight truncate">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                                    Rate: Rs. {Number(item.sell_price).toLocaleString()} / {item.unit_name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 text-right">
                                                <div>
                                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-semibold">Total Cost</span>
                                                    <span className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                                                        Rs. {lineTotalCost.toFixed(2)}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeCartItem(item.cart_id)}
                                                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    title="Remove item"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Controls Row: Amount & Qty Inputs for Variable Units vs Qty Input for Fixed Units */}
                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                                            <span className="text-[10px] font-semibold text-muted-foreground">
                                                {item.is_variable_price ? 'Amount & Qty' : `Quantity (${item.unit_name})`}
                                            </span>

                                            {item.is_variable_price ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-bold text-emerald-600">Rs.</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.manual_amount}
                                                            onChange={(e) => updateCartItem(item.cart_id, 'manual_amount', e.target.value)}
                                                            className="h-7 w-20 text-right text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1 border-l border-border pl-1.5">
                                                        <span className="text-[10px] text-muted-foreground font-semibold">Qty:</span>
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            value={item.quantity}
                                                            onChange={(e) => updateCartItem(item.cart_id, 'quantity', e.target.value)}
                                                            className="h-7 w-16 text-center text-xs font-bold"
                                                            placeholder="0.000"
                                                        />
                                                        <span className="text-[10px] text-muted-foreground font-mono">{item.unit_name}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => {
                                                            const current = parseFloat(String(item.quantity)) || 0;
                                                            updateCartItem(item.cart_id, 'quantity', Math.max(1, current - 1));
                                                        }}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateCartItem(item.cart_id, 'quantity', e.target.value)}
                                                        className="h-6 w-20 text-center text-xs font-bold"
                                                        placeholder="0"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => {
                                                            const current = parseFloat(String(item.quantity)) || 0;
                                                            updateCartItem(item.cart_id, 'quantity', current + 1);
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Cart Footer & Checkout Panel */}
                    <div className="p-4 border-t border-border bg-muted/20 space-y-3 shrink-0">
                        {/* Subtotal & Discount Row */}
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between font-medium">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-bold">Rs. {cartSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 pt-1">
                                <span className="text-muted-foreground">Discount:</span>
                                <div className="flex items-center gap-1">
                                    <Select value={discountType} onValueChange={(val: any) => setDiscountType(val)}>
                                        <SelectTrigger className="h-6 w-16 text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Rs.</SelectItem>
                                            <SelectItem value="percentage">%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        value={discountValue || ''}
                                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                        className="h-6 w-20 text-right text-xs"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Grand Total Bar */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 text-white shadow-md">
                            <div>
                                <span className="text-[10px] text-slate-300 block uppercase tracking-wider font-semibold">Total Payable</span>
                                <span className="text-xl font-extrabold text-emerald-400">Rs. {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleHoldCart}
                                disabled={cart.length === 0}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1 shadow-xs border-0 cursor-pointer transition-colors"
                            >
                                <Pause className="h-3.5 w-3.5" />
                                Hold (F7)
                            </Button>
                        </div>

                        {/* Checkout Trigger Button */}
                        <Button
                            size="lg"
                            disabled={cart.length === 0}
                            onClick={() => setIsCheckoutOpen(true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-lg gap-2"
                        >
                            <CreditCard className="h-5 w-5" />
                            Proceed to Payment (F9)
                        </Button>
                    </div>
                </div>

                {/* RIGHT: Product Catalog & Category Selection (65% width on desktop, full view on mobile when catalog active) */}
                <div className={`flex-1 flex-col p-3 sm:p-4 overflow-hidden ${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Top Bar: Barcode Search & Shortcuts Info */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Scan barcode or search products... (F1)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const handled = handleBarcodeScan(searchQuery);
                                        if (!handled && filteredProducts.length === 1) {
                                            const prod = filteredProducts[0];
                                            if (prod.product_type === 'simple') {
                                                if (Number(prod.quantity) > 0) {
                                                    addProductToCart(prod);
                                                    toast.success(`Added: ${prod.name}`);
                                                } else {
                                                    toast.error(`Out of stock: ${prod.name}`);
                                                }
                                                setSearchQuery('');
                                                focusSearchInput();
                                            }
                                        }
                                    }
                                }}
                                className="pl-9 bg-card font-medium"
                                autoFocus
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsHeldCartsOpen(true)}
                            className="gap-1.5 whitespace-nowrap text-xs h-9"
                        >
                            <Pause className="h-3.5 w-3.5 text-amber-500" />
                            Held ({heldCarts.length}) <span className="hidden sm:inline text-[10px] text-muted-foreground">(F8)</span>
                        </Button>
                    </div>

                    {/* Category Filter Pills (Horizontal Scroller) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 max-w-full border-b border-border/40 scrollbar-thin">
                        <Button
                            variant={selectedCategory === 'packages' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory('packages')}
                            className={`rounded-full text-xs shrink-0 font-bold ${
                                selectedCategory === 'packages'
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700'
                            }`}
                        >
                            <Gift className="h-3.5 w-3.5 mr-1" />
                            Packages ({packages.length})
                        </Button>
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                            className="rounded-full text-xs shrink-0"
                        >
                            All Categories
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.id)}
                                className="rounded-full text-xs shrink-0"
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>

                    {/* Products & Packages Grid */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                            {/* Packages Section: Render ONLY when Packages category tab is active */}
                            {selectedCategory === 'packages' &&
                                filteredPackages.map((pkg) => (
                                    <Card
                                        key={`pkg-${pkg.id}`}
                                        onClick={() => addPackageToCart(pkg)}
                                        className="cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all bg-card border-dashed border-2 border-emerald-500/40 relative overflow-hidden"
                                    >
                                        <CardContent className="p-3">
                                            <Badge className="bg-emerald-600 text-white text-[10px] absolute top-2 right-2">
                                                Bundle
                                            </Badge>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Gift className="h-4 w-4 text-emerald-600" />
                                                <span className="font-bold text-xs truncate">{pkg.name}</span>
                                            </div>
                                            <div className="text-emerald-700 font-extrabold text-sm">
                                                Rs. {Number(pkg.price).toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                            {/* Products List: Render ONLY when NOT in Packages mode */}
                            {selectedCategory !== 'packages' &&
                                filteredProducts.map((product) => {
                                    const isOut = product.product_type === 'simple' && Number(product.quantity) <= 0;
                                    return (
                                        <Card
                                            key={product.id}
                                            onClick={() => {
                                                if (product.product_type === 'simple' && !isOut) {
                                                    addProductToCart(product);
                                                }
                                            }}
                                            className={`bg-card shadow-xs transition-all relative overflow-hidden ${
                                                isOut
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'cursor-pointer hover:border-emerald-500 hover:shadow-md'
                                            }`}
                                        >
                                            <CardContent className="p-3">
                                                {/* Variable Unit Tag */}
                                                {product.unit?.is_variable_price && (
                                                    <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-600 absolute top-2 right-2">
                                                        Variable Unit
                                                    </Badge>
                                                )}

                                                <div className="text-xs font-semibold line-clamp-2 min-h-[2rem] mb-1">
                                                    {product.name}
                                                </div>

                                                {/* Variant Selector vs Simple Price */}
                                                {product.product_type === 'variant' ? (
                                                    <div className="space-y-1 mt-2">
                                                        <span className="text-[10px] font-medium text-muted-foreground">Select Variant:</span>
                                                        {product.variants?.map((v) => (
                                                            <Button
                                                                key={v.id}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    addVariantToCart(product, v);
                                                                }}
                                                                className="w-full justify-between h-7 text-[11px] px-2 cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                                                            >
                                                                <span className="truncate">{v.variant_name}</span>
                                                                <span className="font-bold">Rs. {Number(v.sell_price)}</span>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-end justify-between mt-2 pt-1 border-t border-border/50">
                                                        <div>
                                                            <span className="text-[10px] text-muted-foreground block">
                                                                {Number(product.quantity)} {product.unit?.short_name} left
                                                            </span>
                                                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                                                Rs. {Number(product.sell_price).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <Badge variant={isOut ? 'destructive' : 'outline'} className="text-[10px]">
                                                            {isOut ? 'Out of stock' : '+ Add'}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Floating Mobile Cart Bar when browsing Catalog */}
                    {mobileTab === 'catalog' && cart.length > 0 && (
                        <div className="p-3 border-t border-border bg-slate-900 text-white flex items-center justify-between rounded-t-xl shadow-xl mt-2 lg:hidden shrink-0">
                            <div>
                                <span className="text-[10px] text-slate-300 uppercase block font-semibold">Cart ({cart.length} items)</span>
                                <span className="text-sm font-extrabold text-emerald-400">Rs. {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => setMobileTab('cart')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                View Cart & Checkout
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment / Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center justify-between">
                            <span>Order Payment</span>
                            <Badge variant="outline">{selectedCustomer.name}</Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
                        {/* Grand Total Card */}
                        <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                            <span className="text-xs font-semibold text-muted-foreground">Order Total:</span>
                            <span className="text-xl font-black text-emerald-600">Rs. {cartTotal.toFixed(2)}</span>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Payment Method</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {paymentMethods.map((pm) => (
                                    <Button
                                        key={pm.id}
                                        type="button"
                                        variant={selectedPaymentMethod?.id === pm.id ? 'default' : 'outline'}
                                        onClick={() => setSelectedPaymentMethod(pm)}
                                        className="justify-start text-xs h-9 gap-2"
                                    >
                                        <CreditCard className="h-3.5 w-3.5" />
                                        {pm.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Amount Tendered Field */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Amount Tendered / Received (Rs.)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder={`Enter amount >= ${cartTotal}`}
                                value={paidAmountInput}
                                onChange={(e) => setPaidAmountInput(e.target.value)}
                                className="text-lg font-bold bg-card"
                                autoFocus
                            />
                        </div>

                        {/* Change Return / Customer Balance Calculation Feedback */}
                        {paidAmount >= cartTotal ? (
                            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg flex justify-between items-center text-sm font-semibold">
                                <span>Change Return:</span>
                                <span className="text-base font-extrabold">Rs. {changeReturn.toFixed(2)}</span>
                            </div>
                        ) : (
                            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg flex justify-between items-center text-sm font-semibold">
                                <span>Customer Balance Due:</span>
                                <span className="text-base font-extrabold text-amber-700">Rs. {dueAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCheckoutSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 min-w-[210px]"
                            >
                                {isCheckoutSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing Order...
                                    </>
                                ) : (
                                    <>
                                        <Printer className="h-4 w-4" />
                                        Save & Print Receipt (Ctrl+P)
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Held Carts Dialog */}
            <Dialog open={isHeldCartsOpen} onOpenChange={setIsHeldCartsOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Suspended / Held Carts</DialogTitle>
                    </DialogHeader>
                    <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                        {heldCarts.length === 0 ? (
                            <p className="text-center py-6 text-xs text-muted-foreground">No held carts available.</p>
                        ) : (
                            heldCarts.map((h) => (
                                <div key={h.id} className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-semibold text-xs">{h.cart_reference}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {h.customer?.name || 'Walk-in'} • {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs">Rs. {Number(h.total_amount).toFixed(2)}</span>
                                        <Button size="sm" onClick={() => handleResumeCart(h)} className="h-7 text-xs bg-emerald-600">
                                            Resume
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
