import React, { useMemo } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/searchable-select';
import { ArrowLeft, Plus, RefreshCw, Save, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
    id: number;
    name: string;
    sell_price: number;
    product_type: string;
    unit?: { short_name: string };
    variants?: any[];
}

interface PackageItem {
    id?: number;
    product_id: number;
    product_variant_id: number | null;
    quantity: number;
    product?: Product;
    productVariant?: any;
}

interface PackageBundle {
    id: number;
    name: string;
    barcode?: string;
    price: number;
    description?: string;
    status: string;
    items?: PackageItem[];
}

interface PackageEditProps {
    package: PackageBundle;
    products: Product[];
}

interface SelectOption {
    value: string;
    label: string;
    product_id: number;
    product_variant_id: number | null;
    sell_price: number;
}

export default function PackageEdit({ package: pkg, products }: PackageEditProps) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: pkg.name || '',
        barcode: pkg.barcode || '',
        price: String(pkg.price || ''),
        description: pkg.description || '',
        status: pkg.status || 'active',
        items: (pkg.items || []).map((item) => ({
            option_key: item.product_variant_id ? `v_${item.product_variant_id}` : `p_${item.product_id}`,
            product_id: String(item.product_id),
            product_variant_id: item.product_variant_id ? String(item.product_variant_id) : '',
            quantity: String(item.quantity || '1'),
        })),
    });

    const productOptions: SelectOption[] = useMemo(() => {
        const list: SelectOption[] = [];
        products.forEach((p) => {
            if (p.product_type === 'variant' && p.variants && p.variants.length > 0) {
                p.variants.forEach((v: any) => {
                    list.push({
                        value: `v_${v.id}`,
                        label: `${p.name} - ${v.variant_name} (Rs. ${Number(v.sell_price).toFixed(2)})`,
                        product_id: p.id,
                        product_variant_id: v.id,
                        sell_price: Number(v.sell_price || 0),
                    });
                });
            } else {
                list.push({
                    value: `p_${p.id}`,
                    label: `${p.name} (Rs. ${Number(p.sell_price).toFixed(2)})`,
                    product_id: p.id,
                    product_variant_id: null,
                    sell_price: Number(p.sell_price || 0),
                });
            }
        });
        return list;
    }, [products]);

    const referenceTotalWorth = useMemo(() => {
        return data.items.reduce((sum, item) => {
            const opt = productOptions.find((o) => o.value === item.option_key);
            const qty = parseFloat(item.quantity) || 0;
            const price = opt ? opt.sell_price : 0;
            return sum + qty * price;
        }, 0);
    }, [data.items, productOptions]);

    const generateRandomBarcode = () => {
        const randomCode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
        setData('barcode', randomCode);
        toast.info('Generated unique random barcode: ' + randomCode);
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { option_key: '', product_id: '', product_variant_id: '', quantity: '1' },
        ]);
    };

    const removeItem = (idx: number) => {
        const updated = [...data.items];
        updated.splice(idx, 1);
        setData('items', updated);
    };

    const handleOptionSelect = (idx: number, val: string | number) => {
        const optionKey = String(val);
        const matched = productOptions.find((opt) => opt.value === optionKey);
        const updated = [...data.items];
        if (matched) {
            updated[idx] = {
                option_key: optionKey,
                product_id: String(matched.product_id),
                product_variant_id: matched.product_variant_id ? String(matched.product_variant_id) : '',
                quantity: updated[idx].quantity || '1',
            };
        } else {
            updated[idx] = {
                option_key: '',
                product_id: '',
                product_variant_id: '',
                quantity: '1',
            };
        }
        setData('items', updated);
    };

    const updateQuantity = (idx: number, qty: string) => {
        const updated = [...data.items];
        updated[idx].quantity = qty;
        setData('items', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.name) {
            toast.error('Package name is required.');
            return;
        }
        if (!data.price || Number(data.price) < 0) {
            toast.error('Valid selling price is required.');
            return;
        }
        if (data.items.length === 0) {
            toast.error('Please add at least one product to the package bundle.');
            return;
        }
        post(`/packages/${pkg.id}`, {
            onSuccess: () => {
                toast.success('Package bundle updated successfully!');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Packages', href: '/packages' }, { title: 'Edit Bundle', href: `/packages/${pkg.id}/edit` }]}>
            <Head title={`Edit ${pkg.name} - Qadri General Store`} />

            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/packages">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Edit Package Bundle: {pkg.name}</h1>
                        <p className="text-xs text-muted-foreground">Modify included products, pricing, barcode, and status.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">1. Bundle Information & Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Package Name *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Family Grocery Deal Pack"
                                        className="text-xs"
                                    />
                                    {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Bundle Selling Price (Rs.) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="e.g. 1200"
                                        className="text-xs font-extrabold text-emerald-600"
                                    />
                                    {errors.price && <p className="text-[10px] text-red-500">{errors.price}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Package Barcode Code</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={data.barcode}
                                            onChange={(e) => setData('barcode', e.target.value)}
                                            placeholder="Auto-generated if left blank"
                                            className="text-xs font-mono"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={generateRandomBarcode}
                                            className="h-9 px-2.5 text-[10px] gap-1 shrink-0 bg-muted hover:bg-accent"
                                        >
                                            <RefreshCw className="h-3 w-3" /> Auto Gen
                                        </Button>
                                    </div>
                                    {errors.barcode && <p className="text-[10px] text-red-500">{errors.barcode}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">POS Status *</Label>
                                    <select
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-bold"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        <option value="active">Active (Visible on POS)</option>
                                        <option value="inactive">Disabled (Hidden from POS)</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Included Products Card */}
                    <Card className="shadow-xs border-dashed border-2 border-emerald-500/40">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-base font-semibold">2. Included Products & Variants</CardTitle>
                                <p className="text-[11px] text-muted-foreground">Add or modify products/variants inside this bundle.</p>
                            </div>
                            <Button type="button" size="sm" onClick={addItem} className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                <Plus className="h-3.5 w-3.5" /> Add Product to Package
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.items.length === 0 ? (
                                <p className="text-center py-8 text-xs text-muted-foreground">Click Add Product to Package to include items in this bundle.</p>
                            ) : (
                                data.items.map((item, idx) => {
                                    const matchedOpt = productOptions.find((o) => o.value === item.option_key);
                                    const unitPrice = matchedOpt ? matchedOpt.sell_price : 0;
                                    const qty = parseFloat(item.quantity) || 0;
                                    const rowSubtotal = unitPrice * qty;

                                    return (
                                        <div key={idx} className="p-3 border rounded-lg bg-card grid sm:grid-cols-12 gap-3 items-center">
                                            <div className="sm:col-span-6 space-y-1">
                                                <Label className="text-[10px] font-semibold">Search Product / Variant *</Label>
                                                <SearchableSelect
                                                    options={productOptions}
                                                    value={item.option_key}
                                                    onChange={(val) => handleOptionSelect(idx, String(val))}
                                                    placeholder="Search product or variant..."
                                                    searchPlaceholder="Search product name or variant..."
                                                />
                                            </div>

                                            <div className="sm:col-span-2 space-y-1">
                                                <Label className="text-[10px] font-semibold">Reference Unit Price</Label>
                                                <div className="h-9 px-3 flex items-center bg-muted/40 border rounded text-xs font-mono font-medium">
                                                    Rs. {unitPrice.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="sm:col-span-2 space-y-1">
                                                <Label className="text-[10px] font-semibold">Quantity *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(idx, e.target.value)}
                                                    className="h-9 text-xs font-bold"
                                                />
                                            </div>

                                            <div className="sm:col-span-2 flex items-center justify-between pt-4">
                                                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                                    Rs. {rowSubtotal.toFixed(2)}
                                                </span>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-7 w-7 text-red-500">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Reference Retail Worth Calculation Box */}
                            {data.items.length > 0 && (
                                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                                        <Info className="h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>
                                            Reference Total Retail Value of Included Items: <strong>Rs. {referenceTotalWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                        </span>
                                    </div>
                                    {data.price && Number(data.price) > 0 && (
                                        <div className="font-bold text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 text-emerald-700 dark:text-emerald-300 shrink-0">
                                            Discount Savings: Rs. {Math.max(0, referenceTotalWorth - Number(data.price)).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 pt-2">
                        <Link href="/packages">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing || data.items.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                            <Save className="h-4 w-4" /> Save & Update Package Bundle
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
