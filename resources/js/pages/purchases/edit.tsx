import React, { useMemo } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/searchable-select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
    id: number;
    name: string;
}

interface Variant {
    id: number;
    variant_name: string;
    barcode?: string;
    buy_price: number;
    sell_price: number;
}

interface Product {
    id: number;
    name: string;
    barcode?: string;
    product_type?: 'simple' | 'variant';
    buy_price: number;
    sell_price: number;
    variants?: Variant[];
}

interface PurchaseItem {
    id: number;
    product_id: number;
    product_variant_id?: number | null;
    quantity: number;
    unit_cost_price: number;
    unit_sell_price: number;
    total_cost: number;
    expiry_date?: string | null;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier_id: number;
    purchase_date: string;
    paid_amount: number;
    total_amount: number;
    notes?: string | null;
    items: PurchaseItem[];
}

interface PurchaseEditProps {
    purchase: Purchase;
    suppliers: Supplier[];
    products: Product[];
}

interface SelectOption {
    value: string;
    label: string;
    product_id: number;
    product_variant_id: number | null;
    buy_price: number;
    sell_price: number;
}

export default function PurchaseEdit({ purchase, suppliers, products }: PurchaseEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        supplier_id: String(purchase.supplier_id || ''),
        purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0],
        paid_amount: String(purchase.paid_amount || 0),
        notes: purchase.notes || '',
        items: (purchase.items || []).map((i) => ({
            option_key: i.product_variant_id ? `v_${i.product_variant_id}` : `p_${i.product_id}`,
            product_id: String(i.product_id),
            product_variant_id: i.product_variant_id ? String(i.product_variant_id) : '',
            quantity: String(i.quantity),
            total_cost: String(i.total_cost || (Number(i.quantity) * Number(i.unit_cost_price)).toFixed(2)),
            unit_cost_price: String(i.unit_cost_price),
            unit_sell_price: String(i.unit_sell_price),
            expiry_date: i.expiry_date ? i.expiry_date.split('T')[0] : '',
        })),
    });

    const productOptions: SelectOption[] = useMemo(() => {
        const list: SelectOption[] = [];
        products.forEach((p) => {
            if (p.product_type === 'variant' && p.variants && p.variants.length > 0) {
                p.variants.forEach((v) => {
                    const code = v.barcode || '890000000000';
                    list.push({
                        value: `v_${v.id}`,
                        label: `${p.name} - ${v.variant_name} (Rs. ${v.sell_price}) - [${code}]`,
                        product_id: p.id,
                        product_variant_id: v.id,
                        buy_price: Number(v.buy_price || 0),
                        sell_price: Number(v.sell_price || 0),
                    });
                });
            } else {
                const code = p.barcode || '890000000000';
                list.push({
                    value: `p_${p.id}`,
                    label: `${p.name} (Rs. ${p.sell_price}) - [${code}]`,
                    product_id: p.id,
                    product_variant_id: null,
                    buy_price: Number(p.buy_price || 0),
                    sell_price: Number(p.sell_price || 0),
                });
            }
        });
        return list;
    }, [products]);

    const addItem = () => {
        setData('items', [
            ...data.items,
            { option_key: '', product_id: '', product_variant_id: '', quantity: '1', total_cost: '0', unit_cost_price: '0', unit_sell_price: '0', expiry_date: '' },
        ]);
    };

    const removeItem = (idx: number) => {
        const updated = [...data.items];
        updated.splice(idx, 1);
        setData('items', updated);
    };

    const updateItemOption = (idx: number, val: string | number) => {
        const stringVal = String(val);
        const updated = [...data.items];
        const matched = productOptions.find((opt) => opt.value === stringVal);

        if (matched) {
            const buyPrice = Number(matched.buy_price || 0);
            const qty = parseFloat(updated[idx].quantity) || 1;
            updated[idx].option_key = matched.value;
            updated[idx].product_id = String(matched.product_id);
            updated[idx].product_variant_id = matched.product_variant_id ? String(matched.product_variant_id) : '';
            updated[idx].unit_cost_price = String(buyPrice);
            updated[idx].total_cost = (qty * buyPrice).toFixed(2);
            updated[idx].unit_sell_price = String(matched.sell_price);
        } else {
            updated[idx].option_key = '';
            updated[idx].product_id = '';
            updated[idx].product_variant_id = '';
        }
        setData('items', updated);
    };

    const updateItemField = (idx: number, field: string, val: string) => {
        const updated = [...data.items];
        const item = { ...updated[idx], [field]: val };

        const q = parseFloat(item.quantity) || 0;
        const tc = parseFloat(item.total_cost || '0') || 0;
        const uc = parseFloat(item.unit_cost_price || '0') || 0;

        if (field === 'total_cost') {
            if (q > 0) {
                item.unit_cost_price = (tc / q).toFixed(2);
            }
        } else if (field === 'unit_cost_price') {
            if (q > 0) {
                item.total_cost = (q * uc).toFixed(2);
            }
        } else if (field === 'quantity') {
            if (tc > 0 && q > 0) {
                item.unit_cost_price = (tc / q).toFixed(2);
            } else if (uc > 0 && q > 0) {
                item.total_cost = (q * uc).toFixed(2);
            }
        }

        updated[idx] = item;
        setData('items', updated);
    };

    const calculateTotal = () => {
        return data.items.reduce((sum, i) => {
            const tc = parseFloat(i.total_cost || '0');
            if (tc > 0) return sum + tc;
            return sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_cost_price) || 0);
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            const cost = parseFloat(item.unit_cost_price || '0');
            const sell = parseFloat(item.unit_sell_price || '0');

            if (sell <= cost) {
                const opt = productOptions.find((o) => o.value === item.option_key);
                const name = opt ? opt.label.split(' (')[0] : `Item #${i + 1}`;
                toast.error(`Unit sell price (Rs. ${sell}) for ${name} must be greater than unit cost price (Rs. ${cost}).`);
                return;
            }
        }

        put(`/purchases/${purchase.id}`);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Purchases', href: '/purchases' }, { title: `Edit ${purchase.purchase_number}`, href: `/purchases/${purchase.id}/edit` }]}>
            <Head title={`Edit ${purchase.purchase_number} - Qadri General Store`} />

            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/purchases">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Edit Stock-In Entry #{purchase.purchase_number}</h1>
                        <p className="text-xs text-muted-foreground">Modify purchase shipment details. Stock quantities & supplier balance will be updated.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Purchase & Supplier Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Supplier *</Label>
                                <Select value={data.supplier_id} onValueChange={(val) => setData('supplier_id', val)}>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Select Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-[10px] text-red-500">{errors.supplier_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Purchase Date *</Label>
                                <Input
                                    type="date"
                                    value={data.purchase_date}
                                    onChange={(e) => setData('purchase_date', e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Amount Paid Now (Rs.) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.paid_amount}
                                    onChange={(e) => setData('paid_amount', e.target.value)}
                                    className="text-xs font-bold text-emerald-600"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock-In Items Table */}
                    <Card className="shadow-xs border-dashed border-2 border-emerald-500/40">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold">Shipment Line Items</CardTitle>
                            <Button type="button" size="sm" onClick={addItem} className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="h-3.5 w-3.5" /> Add Product Item
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.items.length === 0 ? (
                                <p className="text-center py-6 text-xs text-muted-foreground">Click Add Product Item to add stock-in lines.</p>
                            ) : (
                                data.items.map((item, idx) => {
                                    const currentOptionVal = item.option_key || (item.product_variant_id ? `v_${item.product_variant_id}` : item.product_id ? `p_${item.product_id}` : '');
                                    const costVal = parseFloat(item.unit_cost_price || '0');
                                    const sellVal = parseFloat(item.unit_sell_price || '0');
                                    const isInvalidSellPrice = sellVal <= costVal && costVal > 0;

                                    return (
                                        <div key={idx} className={`p-3 border rounded-lg bg-card grid sm:grid-cols-12 gap-2 items-center ${isInvalidSellPrice ? 'border-red-300 dark:border-red-900 bg-red-50/30' : ''}`}>
                                            <div className="sm:col-span-4">
                                                <Label className="text-[10px]">Select Product</Label>
                                                <SearchableSelect
                                                    options={productOptions}
                                                    value={currentOptionVal}
                                                    onChange={(val) => updateItemOption(idx, val)}
                                                    placeholder="Select Product / Variant"
                                                    searchPlaceholder="Type product name, variant, or barcode..."
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <Label className="text-[10px]">Received Qty</Label>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                                                    className="h-9 text-xs font-bold"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <Label className="text-[10px] font-semibold text-emerald-600">Total Cost (Rs.)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.total_cost || ''}
                                                    onChange={(e) => updateItemField(idx, 'total_cost', e.target.value)}
                                                    className="h-9 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <Label className="text-[10px]">Unit Cost (Rs.)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unit_cost_price}
                                                    onChange={(e) => updateItemField(idx, 'unit_cost_price', e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>

                                            <div className="sm:col-span-1">
                                                <Label className="text-[10px]">Unit Sell (Rs.)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unit_sell_price}
                                                    onChange={(e) => updateItemField(idx, 'unit_sell_price', e.target.value)}
                                                    className={`h-9 text-xs font-bold ${isInvalidSellPrice ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20' : 'text-emerald-600'}`}
                                                />
                                                {isInvalidSellPrice && (
                                                    <p className="text-[9px] text-red-500 font-bold mt-0.5 leading-tight">&gt; {costVal}</p>
                                                )}
                                            </div>

                                            <div className="sm:col-span-1 flex justify-end pt-3">
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg font-bold text-sm">
                                <span>Total Purchase Cost:</span>
                                <span className="text-emerald-600 text-base">Rs. {calculateTotal().toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 pt-2">
                        <Link href="/purchases">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing || data.items.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                            Update Purchase Entry
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
