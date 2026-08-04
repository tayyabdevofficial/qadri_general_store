import React, { useState } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, RotateCcw } from 'lucide-react';

interface ReturnCreateProps {
    order?: any;
    searchOrderNumber?: string;
}

export default function ReturnCreate({ order, searchOrderNumber }: ReturnCreateProps) {
    const [orderNumInput, setOrderNumInput] = useState(searchOrderNumber || '');
    const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
    const [refundType, setRefundType] = useState('cash');
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSearchOrder = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/returns/create', { order_number: orderNumInput });
    };

    const handleQtyChange = (orderItemId: number, qty: number) => {
        setReturnQtys((prev) => ({ ...prev, [orderItemId]: qty }));
    };

    const handleSubmitReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;

        const itemsToReturn = Object.entries(returnQtys)
            .filter(([_, qty]) => qty > 0)
            .map(([orderItemId, qty]) => ({
                order_item_id: Number(orderItemId),
                quantity: qty,
            }));

        if (itemsToReturn.length === 0) {
            alert('Please specify quantity for at least one item to return.');
            return;
        }

        setProcessing(true);
        router.post(
            '/returns',
            {
                order_id: order.id,
                refund_type: refundType,
                reason: reason,
                items: itemsToReturn,
            },
            {
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Sales Returns', href: '/returns' }, { title: 'Process Return', href: '/returns/create' }]}>
            <Head title="Process Return - Qadri General Store" />

            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/returns">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Process Sales Return</h1>
                        <p className="text-xs text-muted-foreground">Lookup original order by invoice # and select items to return & restock.</p>
                    </div>
                </div>

                {/* Search Order Invoice # Card */}
                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">1. Search Order Invoice Number</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearchOrder} className="flex gap-3">
                            <Input
                                placeholder="Enter Order Number (e.g. ORD-20260721-0001)"
                                value={orderNumInput}
                                onChange={(e) => setOrderNumInput(e.target.value)}
                                className="font-mono text-xs max-w-md"
                            />
                            <Button type="submit" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                <Search className="h-4 w-4" /> Lookup Order
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Found Order Items Table */}
                {order && (
                    <form onSubmit={handleSubmitReturn} className="space-y-6">
                        <Card className="shadow-xs">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center justify-between">
                                    <span>Order Items for {order.order_number}</span>
                                    <span className="text-xs text-muted-foreground">Customer: {order.customer?.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative overflow-x-auto rounded-lg border border-border">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                            <tr>
                                                <th className="p-3">Item Name</th>
                                                <th className="p-3 text-center">Sold Qty</th>
                                                <th className="p-3 text-right">Unit Price</th>
                                                <th className="p-3 text-center w-36">Return Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {order.items.map((item: any) => (
                                                <tr key={item.id}>
                                                    <td className="p-3 font-semibold">{item.item_name}</td>
                                                    <td className="p-3 text-center font-bold">
                                                        {Number(item.quantity)} {item.unit_name}
                                                    </td>
                                                    <td className="p-3 text-right">Rs. {Number(item.unit_sell_price).toFixed(2)}</td>
                                                    <td className="p-3 text-center">
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            min="0"
                                                            max={item.quantity}
                                                            placeholder="0"
                                                            value={returnQtys[item.id] || ''}
                                                            onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value) || 0)}
                                                            className="h-8 text-center font-bold text-xs"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Refund Type *</Label>
                                        <select
                                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                                            value={refundType}
                                            onChange={(e) => setRefundType(e.target.value)}
                                        >
                                            <option value="cash">Cash Refund</option>
                                            <option value="customer_credit">Credit / Adjust Customer Balance</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Reason for Return</Label>
                                        <Input
                                            placeholder="e.g. Damaged product, incorrect item purchased"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2">
                            <Link href="/returns">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                                <RotateCcw className="h-4 w-4" /> Process & Restock Inventory
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
