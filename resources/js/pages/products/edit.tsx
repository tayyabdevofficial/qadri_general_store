import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { SearchableSelect } from '@/components/searchable-select';
import { AlertCircle, ArrowLeft, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
    short_name: string;
}

interface VariantItem {
    id?: number;
    variant_name: string;
    barcode: string;
    buy_price: string;
    sell_price: string;
    quantity: string;
}

interface ProductEditProps {
    product: any;
    categories: Category[];
    units: Unit[];
}

export default function ProductEdit({ product, categories, units }: ProductEditProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(
        product.image_path ? `/storage/${product.image_path}` : null
    );

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: product.name || '',
        category_id: String(product.category_id || ''),
        unit_id: String(product.unit_id || ''),
        barcode: product.barcode || '',
        product_type: product.product_type || 'simple',
        buy_price: product.buy_price ? String(product.buy_price) : '',
        sell_price: product.sell_price ? String(product.sell_price) : '',
        quantity: product.quantity !== undefined ? String(product.quantity) : '0',
        min_stock_alert: product.min_stock_alert ? String(product.min_stock_alert) : '5',
        expiry_date: product.expiry_date || '',
        status: product.status || 'active',
        image: null as File | null,
        variants: (product.variants || []).map((v: any) => ({
            id: v.id,
            variant_name: v.variant_name || '',
            barcode: v.barcode || '',
            buy_price: String(v.buy_price || ''),
            sell_price: String(v.sell_price || ''),
            quantity: String(v.quantity !== undefined ? v.quantity : '0'),
        })) as VariantItem[],
    });

    const focusFirstError = (errs: Record<string, string>) => {
        const keys = Object.keys(errs);
        if (keys.length === 0) return;
        const firstKey = keys[0];

        let targetEl = document.querySelector(`[data-error-key="${firstKey}"]`) as HTMLElement;
        if (!targetEl) {
            targetEl = document.querySelector(`[name="${firstKey}"]`) as HTMLElement;
        }
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const focusable = targetEl.tagName === 'INPUT' || targetEl.tagName === 'SELECT' || targetEl.tagName === 'BUTTON'
                ? targetEl
                : (targetEl.querySelector('input, select, button') as HTMLElement) || targetEl;

            setTimeout(() => {
                if (focusable && typeof focusable.focus === 'function') {
                    focusable.focus();
                }
            }, 150);
        }
    };

    useEffect(() => {
        focusFirstError(errors);
    }, [errors]);

    const handleProductTypeChange = (type: 'simple' | 'variant') => {
        setData((prev) => ({
            ...prev,
            product_type: type,
            buy_price: type === 'simple' ? prev.buy_price : '',
            sell_price: type === 'simple' ? prev.sell_price : '',
            variants: type === 'variant' && prev.variants.length === 0 ? [
                {
                    variant_name: '',
                    barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
                    buy_price: '',
                    sell_price: '',
                    quantity: '0',
                }
            ] : prev.variants,
        }));
    };

    const generateRandomBarcode = (targetField: 'main' | number) => {
        const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
        const code = `890${randomDigits}`;
        if (targetField === 'main') {
            setData('barcode', code);
        } else {
            const updated = [...data.variants];
            updated[targetField].barcode = code;
            setData('variants', updated);
        }
        toast.info('Generated unique random barcode: ' + code);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setData('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const addVariant = () => {
        const randomCode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
        setData('variants', [
            ...data.variants,
            {
                variant_name: '',
                barcode: randomCode,
                buy_price: '',
                sell_price: '',
                quantity: '0',
            },
        ]);
    };

    const removeVariant = (idx: number) => {
        const updated = [...data.variants];
        updated.splice(idx, 1);
        setData('variants', updated);
    };

    const updateVariant = (idx: number, field: keyof VariantItem, val: string) => {
        const updated = [...data.variants];
        (updated[idx] as any)[field] = val;
        setData('variants', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.name || data.name.trim() === '') {
            toast.error('Product name is required.');
            focusFirstError({ name: 'Product name is required.' });
            return;
        }

        if (!data.category_id) {
            toast.error('Please select a category.');
            focusFirstError({ category_id: 'Please select a category.' });
            return;
        }

        if (!data.unit_id) {
            toast.error('Please select a unit of measurement.');
            focusFirstError({ unit_id: 'Please select a unit of measurement.' });
            return;
        }

        if (data.product_type === 'simple') {
            if (!data.buy_price || Number(data.buy_price) <= 0) {
                toast.error('Purchase cost price must be greater than Rs. 0.');
                focusFirstError({ buy_price: 'Purchase cost price must be greater than Rs. 0.' });
                return;
            }
            if (!data.sell_price || Number(data.sell_price) <= 0) {
                toast.error('Selling price must be greater than Rs. 0.');
                focusFirstError({ sell_price: 'Selling price must be greater than Rs. 0.' });
                return;
            }
            if (Number(data.buy_price) > Number(data.sell_price)) {
                toast.error('Purchase cost price cannot be greater than the selling price.');
                focusFirstError({ buy_price: 'Purchase cost price cannot be greater than the selling price.' });
                return;
            }
        } else {
            if (data.variants.length === 0) {
                toast.error('Please add at least one product variant.');
                return;
            }
            for (let i = 0; i < data.variants.length; i++) {
                const v = data.variants[i];
                if (!v.variant_name || v.variant_name.trim() === '') {
                    toast.error(`Variant #${i + 1} name is required.`);
                    focusFirstError({ [`variants.${i}.variant_name`]: `Variant #${i + 1} name is required.` });
                    return;
                }
                if (!v.buy_price || Number(v.buy_price) <= 0) {
                    toast.error(`Variant #${i + 1} (${v.variant_name}) purchase cost must be greater than Rs. 0.`);
                    focusFirstError({ [`variants.${i}.buy_price`]: 'Variant purchase cost is required.' });
                    return;
                }
                if (!v.sell_price || Number(v.sell_price) <= 0) {
                    toast.error(`Variant #${i + 1} (${v.variant_name}) selling price must be greater than Rs. 0.`);
                    focusFirstError({ [`variants.${i}.sell_price`]: 'Variant selling price is required.' });
                    return;
                }
                if (Number(v.buy_price) > Number(v.sell_price)) {
                    toast.error(`Variant #${i + 1} (${v.variant_name}) purchase cost price cannot be greater than its selling price.`);
                    focusFirstError({ [`variants.${i}.buy_price`]: 'Purchase cost cannot be greater than selling price.' });
                    return;
                }
            }
        }

        post(`/products/${product.id}`, {
            onSuccess: () => {
                toast.success('Product updated successfully!');
            },
            onError: (errs) => {
                const firstMsg = Object.values(errs)[0] || 'Validation failed. Please review errors.';
                toast.error(firstMsg);
                focusFirstError(errs);
            },
        });
    };

    const categoryOptions = categories.map((c) => ({
        value: String(c.id),
        label: c.name,
    }));

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }, { title: 'Edit Product', href: `/products/${product.id}/edit` }]}>
            <Head title={`Edit ${product.name} - Qadri General Store`} />

            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/products">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Edit Product: {product.name}</h1>
                        <p className="text-xs text-muted-foreground">Modify inventory details, stock, pricing, status, and variant options.</p>
                    </div>
                </div>

                {hasErrors && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                            <span>Please fix the following validation errors:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 pl-2 text-[11px]">
                            {Object.entries(errors).map(([key, msg]) => (
                                <li key={key}>
                                    <span className="font-semibold capitalize">{key.replace(/_/g, ' ').replace(/variants\.\d+\./, 'variant ')}: </span>
                                    {msg}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">1. Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Product Name *</Label>
                                <Input
                                    data-error-key="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Tapal Danedar Tea 950g"
                                    className={`text-xs ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Category (Searchable) *</Label>
                                    <div data-error-key="category_id">
                                        <SearchableSelect
                                            options={categoryOptions}
                                            value={data.category_id}
                                            onChange={(val) => setData('category_id', String(val))}
                                            placeholder="Select category..."
                                            searchPlaceholder="Search categories..."
                                            className={errors.category_id ? 'border-red-500' : ''}
                                        />
                                    </div>
                                    <InputError message={errors.category_id} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Unit of Measurement *</Label>
                                    <select
                                        data-error-key="unit_id"
                                        className={`w-full h-9 rounded-md border bg-background px-3 py-1 text-xs shadow-xs ${errors.unit_id ? 'border-red-500 ring-1 ring-red-500' : 'border-input'}`}
                                        value={data.unit_id}
                                        onChange={(e) => setData('unit_id', e.target.value)}
                                    >
                                        <option value="">-- Select Unit --</option>
                                        {units.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.short_name})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.unit_id} />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Product Barcode</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            data-error-key="barcode"
                                            value={data.barcode}
                                            onChange={(e) => setData('barcode', e.target.value)}
                                            placeholder="Barcode code (e.g. 890123456789)"
                                            className={`text-xs font-mono ${errors.barcode ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => generateRandomBarcode('main')}
                                            className="h-9 px-2.5 text-[10px] gap-1 shrink-0 bg-muted hover:bg-accent"
                                        >
                                            <RefreshCw className="h-3 w-3" /> Auto Gen
                                        </Button>
                                    </div>
                                    <InputError message={errors.barcode} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Product Type *</Label>
                                    <select
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-bold"
                                        value={data.product_type}
                                        onChange={(e) => handleProductTypeChange(e.target.value as any)}
                                    >
                                        <option value="simple">Simple Product (Single Price & Stock)</option>
                                        <option value="variant">Variant Product (Multiple Weights/Sizes)</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simple Product Pricing & Stock */}
                    {data.product_type === 'simple' && (
                        <Card className="shadow-xs bg-slate-50/50 dark:bg-slate-900/30">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">2. Pricing & Initial Inventory</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Buy / Purchase Price (Rs.) *</Label>
                                        <Input
                                            data-error-key="buy_price"
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 250"
                                            value={data.buy_price}
                                            onChange={(e) => setData('buy_price', e.target.value)}
                                            className={`text-xs font-bold ${errors.buy_price ? 'border-red-500 ring-1 ring-red-500' : 'text-slate-700 dark:text-slate-300'}`}
                                        />
                                        <InputError message={errors.buy_price} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Selling Price (Rs.) *</Label>
                                        <Input
                                            data-error-key="sell_price"
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 300"
                                            value={data.sell_price}
                                            onChange={(e) => setData('sell_price', e.target.value)}
                                            className={`text-xs font-extrabold ${errors.sell_price ? 'border-red-500 ring-1 ring-red-500' : 'text-emerald-600'}`}
                                        />
                                        <InputError message={errors.sell_price} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Available Stock Quantity *</Label>
                                        <Input
                                            data-error-key="quantity"
                                            type="number"
                                            step="0.001"
                                            placeholder="e.g. 50"
                                            value={data.quantity}
                                            onChange={(e) => setData('quantity', e.target.value)}
                                            className={`text-xs font-bold ${errors.quantity ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        />
                                        <InputError message={errors.quantity} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Variant Product Rows */}
                    {data.product_type === 'variant' && (
                        <Card className="shadow-xs border-dashed border-2 border-emerald-500/40">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold">2. Product Variants (Sizes / Flavors)</CardTitle>
                                <Button type="button" size="sm" onClick={addVariant} className="gap-1 text-xs bg-emerald-600">
                                    <Plus className="h-3.5 w-3.5" /> Add Variant
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <InputError message={errors.variants as string} />
                                {data.variants.length === 0 ? (
                                    <p className="text-center py-6 text-xs text-muted-foreground">Click Add Variant to configure size or weight options.</p>
                                ) : (
                                    data.variants.map((variant, idx) => {
                                        const varNameErr = (errors as any)[`variants.${idx}.variant_name`];
                                        const varBuyErr = (errors as any)[`variants.${idx}.buy_price`];
                                        const varSellErr = (errors as any)[`variants.${idx}.sell_price`];
                                        const varQtyErr = (errors as any)[`variants.${idx}.quantity`];

                                        return (
                                            <div key={idx} className="p-3 border rounded-lg bg-card grid sm:grid-cols-12 gap-2 items-start">
                                                <div className="sm:col-span-3 space-y-1">
                                                    <Label className="text-[10px]">Variant Name *</Label>
                                                    <Input
                                                        data-error-key={`variants.${idx}.variant_name`}
                                                        placeholder="e.g. 500g Pack"
                                                        value={variant.variant_name}
                                                        onChange={(e) => updateVariant(idx, 'variant_name', e.target.value)}
                                                        className={`h-8 text-xs font-semibold ${varNameErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                    <InputError message={varNameErr} />
                                                </div>

                                                <div className="sm:col-span-3 space-y-1">
                                                    <Label className="text-[10px]">Barcode</Label>
                                                    <div className="flex gap-1">
                                                        <Input
                                                            data-error-key={`variants.${idx}.barcode`}
                                                            placeholder="Barcode"
                                                            value={variant.barcode}
                                                            onChange={(e) => updateVariant(idx, 'barcode', e.target.value)}
                                                            className="h-8 text-[11px] font-mono"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => generateRandomBarcode(idx)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                                                        >
                                                            <RefreshCw className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="sm:col-span-2 space-y-1">
                                                    <Label className="text-[10px]">Buy Price *</Label>
                                                    <Input
                                                        data-error-key={`variants.${idx}.buy_price`}
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Cost"
                                                        value={variant.buy_price}
                                                        onChange={(e) => updateVariant(idx, 'buy_price', e.target.value)}
                                                        className={`h-8 text-xs ${varBuyErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                    <InputError message={varBuyErr} />
                                                </div>

                                                <div className="sm:col-span-2 space-y-1">
                                                    <Label className="text-[10px]">Sell Price *</Label>
                                                    <Input
                                                        data-error-key={`variants.${idx}.sell_price`}
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Sell"
                                                        value={variant.sell_price}
                                                        onChange={(e) => updateVariant(idx, 'sell_price', e.target.value)}
                                                        className={`h-8 text-xs font-bold text-emerald-600 ${varSellErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                    <InputError message={varSellErr} />
                                                </div>

                                                <div className="sm:col-span-1 space-y-1">
                                                    <Label className="text-[10px]">Stock</Label>
                                                    <Input
                                                        data-error-key={`variants.${idx}.quantity`}
                                                        type="number"
                                                        step="0.001"
                                                        value={variant.quantity}
                                                        onChange={(e) => updateVariant(idx, 'quantity', e.target.value)}
                                                        className={`h-8 text-xs font-bold ${varQtyErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                    <InputError message={varQtyErr} />
                                                </div>

                                                <div className="sm:col-span-1 flex justify-end pt-5">
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(idx)} className="h-7 w-7 text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Stock Alert, Status & Image Upload */}
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">3. Additional Stock, Status & Image Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">POS Status (Active / Disabled) *</Label>
                                    <select
                                        data-error-key="status"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-bold"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        <option value="active">Active (Visible on POS)</option>
                                        <option value="inactive">Disabled (Hidden from POS)</option>
                                    </select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Minimum Low Stock Alert Threshold</Label>
                                    <Input
                                        data-error-key="min_stock_alert"
                                        type="number"
                                        value={data.min_stock_alert}
                                        onChange={(e) => setData('min_stock_alert', e.target.value)}
                                        placeholder="5"
                                        className="text-xs"
                                    />
                                    <InputError message={errors.min_stock_alert} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Expiry Date (Optional)</Label>
                                    <Input
                                        data-error-key="expiry_date"
                                        type="date"
                                        value={data.expiry_date}
                                        onChange={(e) => setData('expiry_date', e.target.value)}
                                        className="text-xs"
                                    />
                                    <InputError message={errors.expiry_date} />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <Label className="text-xs font-semibold">Square Product Image</Label>
                                <div className="flex items-center gap-4">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border p-1" />
                                    ) : (
                                        <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-[10px] border border-dashed">
                                            Square Image
                                        </div>
                                    )}
                                    <Input data-error-key="image" type="file" accept="image/*" onChange={handleImageChange} className="text-xs max-w-xs" />
                                </div>
                                <InputError message={errors.image} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 pt-2">
                        <Link href="/products">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                            <Save className="h-4 w-4" /> Save & Update Product
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
