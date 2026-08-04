import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import Pagination, { PaginatedData } from '@/components/pagination';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Plus, SquarePen, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    supplier?: { id: number; name: string };
    user?: { name: string };
    items?: any[];
}

interface PurchasesProps {
    purchases: PaginatedData<Purchase>;
    filters: {
        search?: string;
    };
}

export default function PurchasesIndex({ purchases, filters }: PurchasesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { post, processing } = useForm();

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/purchases', { search: val }, { preserveState: true, replace: true });
    };

    const handleOpenPaymentModal = (p: Purchase) => {
        setPaymentPurchase(p);
        setPaymentAmount(String(p.due_amount));
        setPaymentNotes('');
    };

    const handleMakePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentPurchase) return;

        router.post(
            `/purchases/${paymentPurchase.id}/pay`,
            {
                amount: paymentAmount,
                notes: paymentNotes,
            },
            {
                onSuccess: () => {
                    toast.success(`Payment of Rs. ${paymentAmount} recorded for Purchase #${paymentPurchase.purchase_number}`);
                    setPaymentPurchase(null);
                },
                onError: (errs) => {
                    const msg = Object.values(errs)[0] as string;
                    toast.error(msg || 'Failed to process payment.');
                },
            }
        );
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/purchases/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Purchase entry deleted, inventory stock reverted, and supplier balance updated.');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                toast.error(msg || 'Failed to delete purchase.');
            },
        });
    };

    const exportColumns = [
        { header: 'Purchase #', key: 'purchase_number' },
        { header: 'Date', key: 'purchase_date' },
        { header: 'Supplier', key: 'supplier', formatter: (val: any) => val?.name || 'N/A' },
        { header: 'Total (Rs.)', key: 'total_amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Paid (Rs.)', key: 'paid_amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Due (Rs.)', key: 'due_amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Status', key: 'payment_status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Purchases (Stock-In)', href: '/purchases' }]}>
            <Head title="Stock-In Purchases - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Purchases & Stock-In Entries</h1>
                        <p className="text-xs text-muted-foreground">Record incoming inventory shipments from suppliers and update cost/sell prices.</p>
                    </div>
                    <Link href="/purchases/create">
                        <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4" /> New Stock-In Entry
                        </Button>
                    </Link>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Stock-In Purchases Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={purchases.data}
                            placeholder="Search purchase number or supplier..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Purchase #</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Supplier</th>
                                        <th className="p-3 text-right">Total Amount</th>
                                        <th className="p-3 text-right">Paid</th>
                                        <th className="p-3 text-right">Due Balance</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {purchases.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                                No purchase entries found.
                                            </td>
                                        </tr>
                                    ) : (
                                        purchases.data.map((p) => (
                                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold font-mono">{p.purchase_number}</td>
                                                <td className="p-3 text-muted-foreground">{p.purchase_date}</td>
                                                <td className="p-3 font-medium">{p.supplier?.name || 'N/A'}</td>
                                                <td className="p-3 text-right font-bold">Rs. {Number(p.total_amount).toLocaleString()}</td>
                                                <td className="p-3 text-right font-medium text-emerald-600">Rs. {Number(p.paid_amount).toLocaleString()}</td>
                                                <td className="p-3 text-right font-bold">
                                                    {Number(p.due_amount) > 0 ? (
                                                        <span className="text-red-600">Rs. {Number(p.due_amount).toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Rs. 0.00</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge variant={p.payment_status === 'paid' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                                                        {p.payment_status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    {Number(p.due_amount) > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenPaymentModal(p)}
                                                            className="h-7 text-[11px] gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                        >
                                                            <Wallet className="h-3 w-3" /> Pay Supplier
                                                        </Button>
                                                    )}
                                                    <Link href={`/purchases/${p.id}/edit`}>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                            title="Edit Purchase"
                                                        >
                                                            <SquarePen className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setDeleteTargetId(p.id)}
                                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        title="Delete Purchase"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={purchases} />
                    </CardContent>
                </Card>
            </div>

            {/* Payment Modal */}
            <Dialog open={!!paymentPurchase} onOpenChange={(open) => !open && setPaymentPurchase(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Pay Purchase #{paymentPurchase?.purchase_number}
                        </DialogTitle>
                    </DialogHeader>
                    {paymentPurchase && (
                        <form onSubmit={handleMakePayment} className="space-y-4 py-2">
                            <div className="p-3 rounded bg-muted/60 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Supplier:</span>
                                    <span className="font-semibold">{paymentPurchase.supplier?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Purchase Cost:</span>
                                    <span>Rs. {Number(paymentPurchase.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span className="text-muted-foreground">Already Paid:</span>
                                    <span className="text-emerald-600">Rs. {Number(paymentPurchase.paid_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Current Due Balance:</span>
                                    <span className="text-red-600">Rs. {Number(paymentPurchase.due_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Payment Amount (Rs.) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter payment amount"
                                    className="text-xs font-bold text-emerald-600"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Note / Payment Description</Label>
                                <Input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="e.g. Bank transfer, cash paid, check #..."
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setPaymentPurchase(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                                    Submit Payment
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Custom Confirm Delete Modal */}
            <ConfirmDeleteDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Delete Purchase Entry"
                description="Are you sure you want to delete this stock-in purchase? Product stock levels will be reverted and the supplier outstanding balance updated."
            />
        </AppLayout>
    );
}

