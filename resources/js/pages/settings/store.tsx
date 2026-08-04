import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, DollarSign, FileCheck, Image as ImageIcon, Loader2, Phone, Printer, Save, Store } from 'lucide-react';
import { toast } from 'sonner';

interface StoreSetting {
    store_name: string;
    phone: string;
    email?: string;
    address: string;
    currency_symbol: string;
    ntn_number?: string;
    strn_number?: string;
    receipt_footer: string;
    logo_url?: string;
}

interface StoreSettingsProps {
    settings: StoreSetting;
}

export default function StoreSettingsPage({ settings }: StoreSettingsProps) {
    const [logoPreview, setLogoPreview] = useState<string | null>(settings?.logo_url || null);

    const { data, setData, post, processing, errors } = useForm({
        store_name: settings?.store_name || 'Qadri General Store',
        phone: settings?.phone || '+92 300 1234567',
        email: settings?.email || 'info@qadrigeneralstore.com',
        address: settings?.address || 'Main Market, Gujranwala, Punjab, Pakistan',
        currency_symbol: settings?.currency_symbol || 'Rs.',
        ntn_number: settings?.ntn_number || 'NTN-1234567',
        strn_number: settings?.strn_number || 'STRN-9876543',
        receipt_footer: settings?.receipt_footer || 'Thank you for shopping at Qadri General Store!',
        logo: null as File | null,
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/store', {
            onSuccess: () => toast.success('Store settings updated successfully!'),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Store Settings', href: '/settings/store' }]}>
            <Head title="Store Settings - Qadri General Store" />

            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <Store className="h-5 w-5 text-emerald-600" /> Store & Business Settings
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage store branding, contact info, tax registration, and POS receipt customization.
                        </p>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-xs min-w-[170px]"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving Settings...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Save Store Settings
                            </>
                        )}
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
                    {/* Left & Middle Column: Configuration Forms (2 Columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. Store Basic Information */}
                        <Card className="shadow-xs border-border">
                            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-emerald-600" /> Store Information & Contact
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Primary store identity displayed across customer invoices and reports.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Store Name *</Label>
                                        <Input
                                            value={data.store_name}
                                            onChange={(e) => setData('store_name', e.target.value)}
                                            className="text-xs font-bold"
                                            placeholder="e.g. Qadri General Store"
                                        />
                                        {errors.store_name && <p className="text-[10px] text-red-500">{errors.store_name}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Contact Phone *</Label>
                                        <Input
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="text-xs font-mono"
                                            placeholder="0300-1234567"
                                        />
                                        {errors.phone && <p className="text-[10px] text-red-500">{errors.phone}</p>}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Email Address</Label>
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="text-xs"
                                            placeholder="store@example.com"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Currency Symbol *</Label>
                                        <Input
                                            value={data.currency_symbol}
                                            onChange={(e) => setData('currency_symbol', e.target.value)}
                                            className="text-xs font-bold"
                                            placeholder="Rs."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Full Store Address *</Label>
                                    <Input
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="text-xs"
                                        placeholder="Street, Area, City"
                                    />
                                    {errors.address && <p className="text-[10px] text-red-500">{errors.address}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Tax & Legal Registrations */}
                        <Card className="shadow-xs border-border">
                            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-blue-600" /> Tax & Business Registration
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Official tax registration numbers for compliance.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">NTN Number (Optional)</Label>
                                        <Input
                                            value={data.ntn_number}
                                            onChange={(e) => setData('ntn_number', e.target.value)}
                                            placeholder="e.g. NTN-1234567"
                                            className="text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">STRN Number (Optional)</Label>
                                        <Input
                                            value={data.strn_number}
                                            onChange={(e) => setData('strn_number', e.target.value)}
                                            placeholder="e.g. STRN-9876543"
                                            className="text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Receipt Customization & Logo */}
                        <Card className="shadow-xs border-border">
                            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Printer className="h-4 w-4 text-indigo-600" /> POS Thermal Receipt Customizer
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Upload store logo and set footer notes printed on customer receipts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Receipt Footer Message</Label>
                                    <Input
                                        value={data.receipt_footer}
                                        onChange={(e) => setData('receipt_footer', e.target.value)}
                                        placeholder="e.g. Thank you for shopping with us! No returns without receipt."
                                        className="text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-xs font-semibold">Store Branding Logo</Label>
                                    <div className="flex items-center gap-4 p-3 rounded-lg border border-dashed border-border bg-muted/20">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded object-contain border bg-background p-1" />
                                        ) : (
                                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-semibold border">
                                                No Logo
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <Input type="file" accept="image/*" onChange={handleLogoChange} className="text-xs max-w-xs" />
                                            <p className="text-[10px] text-muted-foreground">PNG or JPG. Recommended max 200x200px.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Live Thermal Receipt Preview */}
                    <div className="space-y-4">
                        <Card className="shadow-xs border-border sticky top-6">
                            <CardHeader className="py-3 px-4 bg-slate-900 text-white rounded-t-xl">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Printer className="h-4 w-4 text-emerald-400" /> Thermal Receipt Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] space-y-3">
                                {/* Receipt Header */}
                                <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                                    {logoPreview && (
                                        <img src={logoPreview} alt="Logo" className="h-10 mx-auto object-contain mb-1" />
                                    )}
                                    <p className="font-extrabold text-sm uppercase tracking-wide text-foreground">{data.store_name || 'STORE NAME'}</p>
                                    <p className="text-[10px] text-muted-foreground">{data.address || 'Store Address'}</p>
                                    <p className="text-[10px] text-muted-foreground">Phone: {data.phone || '0300-0000000'}</p>
                                    {data.ntn_number && <p className="text-[10px] text-muted-foreground">NTN: {data.ntn_number}</p>}
                                </div>

                                {/* Dummy Order Metadata */}
                                <div className="text-[10px] text-muted-foreground space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                                    <div className="flex justify-between">
                                        <span>Invoice #: ORD-2026-001</span>
                                        <span>POS Counter</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Date: {new Date().toLocaleDateString()}</span>
                                        <span>Cashier: Admin</span>
                                    </div>
                                </div>

                                {/* Sample Items */}
                                <div className="space-y-1 text-[10px]">
                                    <div className="flex justify-between font-bold border-b pb-1">
                                        <span>Item</span>
                                        <span>Qty x Rate</span>
                                        <span>Total</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Rice Kernel (5kg)</span>
                                        <span>1 x 1200</span>
                                        <span>1,200.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cooking Oil (1L)</span>
                                        <span>2 x 550</span>
                                        <span>1,100.00</span>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5 text-right font-bold text-xs">
                                    <div className="flex justify-between">
                                        <span>Grand Total:</span>
                                        <span>{data.currency_symbol || 'Rs.'} 2,300.00</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-emerald-600">
                                        <span>Paid Amount:</span>
                                        <span>{data.currency_symbol || 'Rs.'} 2,500.00</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Change Return:</span>
                                        <span>{data.currency_symbol || 'Rs.'} 200.00</span>
                                    </div>
                                </div>

                                {/* Footer Message */}
                                <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-muted-foreground">
                                    <p className="font-semibold italic">{data.receipt_footer || 'Thank you for your visit!'}</p>
                                    <p className="text-[9px] mt-1 text-slate-500 font-semibold">Developed by Tayyab Dev (0309 9700930)</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
