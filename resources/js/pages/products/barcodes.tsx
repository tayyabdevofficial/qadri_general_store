import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/searchable-select';
import { BarcodeGenerator } from '@/components/barcode-generator';
import { Printer, Barcode as BarcodeIcon, Tag, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Variant {
    id: number;
    variant_name: string;
    barcode: string;
    buy_price: number;
    sell_price: number;
    quantity: number;
    status: string;
}

interface Product {
    id: number;
    name: string;
    barcode: string;
    product_type: 'simple' | 'variant';
    sell_price: number;
    variants?: Variant[];
}

interface BarcodePageProps {
    products: Product[];
    storeSettings: any;
}

interface SelectOption {
    value: string;
    label: string;
    name: string;
    barcode: string;
    price: number;
}

export default function BarcodesIndex({ products, storeSettings }: BarcodePageProps) {
    const [selectedOptionValue, setSelectedOptionValue] = useState<string>('');
    const [selectedBarcode, setSelectedBarcode] = useState<string>('');
    const [selectedName, setSelectedName] = useState<string>('');
    const [selectedPrice, setSelectedPrice] = useState<number>(0);
    const [printCount, setPrintCount] = useState<number>(12);

    // Build searchable options list (supporting simple products and product variants)
    const options: SelectOption[] = useMemo(() => {
        const list: SelectOption[] = [];
        products.forEach((p) => {
            if (p.product_type === 'variant' && p.variants && p.variants.length > 0) {
                p.variants.forEach((v) => {
                    const code = v.barcode || '890000000000';
                    list.push({
                        value: `v_${v.id}`,
                        label: `${p.name} - ${v.variant_name} (Rs. ${v.sell_price}) - [${code}]`,
                        name: `${p.name} - ${v.variant_name}`,
                        barcode: code,
                        price: Number(v.sell_price || 0),
                    });
                });
            } else {
                const code = p.barcode || '890000000000';
                list.push({
                    value: `p_${p.id}`,
                    label: `${p.name} (Rs. ${p.sell_price}) - [${code}]`,
                    name: p.name,
                    barcode: code,
                    price: Number(p.sell_price || 0),
                });
            }
        });
        return list;
    }, [products]);

    const handleSelectOption = (val: string | number) => {
        const stringVal = String(val);
        setSelectedOptionValue(stringVal);

        const matched = options.find((opt) => opt.value === stringVal);
        if (matched) {
            setSelectedName(matched.name);
            setSelectedBarcode(matched.barcode);
            setSelectedPrice(matched.price);
            toast.success(`Selected "${matched.name}" for barcode sticker generation.`);
        }
    };

    const handlePrint = () => {
        if (!selectedBarcode) {
            toast.error('Please select a product or variant first.');
            return;
        }
        window.print();
    };

    const stickerItems = Array.from({ length: Math.max(1, printCount) }, (_, i) => i);

    return (
        <AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }, { title: 'Barcode Stickers', href: '/products/barcodes' }]}>
            <Head title="Barcode Label Generator - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <Tag className="h-5 w-5 text-emerald-600" /> Barcode Label Sticker Generator
                        </h1>
                        <p className="text-xs text-muted-foreground">Select any product or variant to generate and print real, scannable Code128 barcode stickers.</p>
                    </div>
                    <Button onClick={handlePrint} disabled={!selectedBarcode} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0">
                        <Printer className="h-4 w-4" /> Print Sticker Sheet ({printCount})
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Controls Panel */}
                    <Card className="shadow-xs md:col-span-1 print:hidden">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Sticker Configurations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Select Product / Variant (Searchable) *</Label>
                                <SearchableSelect
                                    options={options}
                                    value={selectedOptionValue}
                                    onChange={handleSelectOption}
                                    placeholder="Search product or variant..."
                                    searchPlaceholder="Type product name, variant, or barcode..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Product Title on Sticker</Label>
                                <Input
                                    value={selectedName}
                                    onChange={(e) => setSelectedName(e.target.value)}
                                    placeholder="Product Name"
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Barcode Code</Label>
                                <Input
                                    value={selectedBarcode}
                                    onChange={(e) => setSelectedBarcode(e.target.value)}
                                    placeholder="890123456789"
                                    className="text-xs font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Retail Price (Rs.)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={selectedPrice}
                                    onChange={(e) => setSelectedPrice(parseFloat(e.target.value) || 0)}
                                    className="text-xs font-bold text-emerald-600"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Number of Stickers to Print</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={printCount}
                                    onChange={(e) => setPrintCount(parseInt(e.target.value) || 1)}
                                    className="text-xs font-bold"
                                />
                            </div>

                            {selectedBarcode && (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>Ready to print <strong>{printCount}</strong> scannable stickers.</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview / Print Grid */}
                    <Card className="shadow-xs md:col-span-2 print:border-none print:shadow-none print:p-0">
                        <CardHeader className="print:hidden">
                            <CardTitle className="text-base font-semibold">Sticker Sheet Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="print:p-0">
                            {!selectedBarcode ? (
                                <div className="text-center py-16 text-muted-foreground text-xs space-y-2">
                                    <BarcodeIcon className="h-10 w-10 mx-auto stroke-1 text-muted-foreground/60" />
                                    <p className="font-medium">Search and select a product or variant on the left panel to generate barcode stickers.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg print:bg-white print:p-0 print:gap-2">
                                    {stickerItems.map((idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white p-2 border border-gray-300 rounded text-center flex flex-col items-center justify-between text-black font-mono shadow-xs print:shadow-none print:border-black"
                                            style={{ minHeight: '38mm' }}
                                        >
                                            <span className="font-extrabold text-[9px] uppercase tracking-tighter truncate w-full border-b border-gray-200 pb-0.5">
                                                {storeSettings.store_name || 'QADRI GENERAL STORE'}
                                            </span>
                                            <span className="text-[10px] font-bold truncate w-full px-1 py-0.5 text-slate-900">
                                                {selectedName}
                                            </span>

                                            {/* Real Code128 Vector Barcode */}
                                            <div className="my-1 w-full flex flex-col items-center justify-center overflow-hidden">
                                                <BarcodeGenerator
                                                    value={selectedBarcode}
                                                    width={1.3}
                                                    height={30}
                                                    fontSize={9}
                                                    displayValue={true}
                                                />
                                            </div>

                                            <span className="text-[11px] font-black text-black">
                                                Rs. {selectedPrice.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
