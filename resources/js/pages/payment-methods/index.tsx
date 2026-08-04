import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { CreditCard, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
    account_number: string;
    is_active: boolean;
}

interface PaymentMethodsProps {
    paymentMethods: PaginatedData<PaymentMethod>;
    filters?: {
        search?: string;
    };
}

export default function PaymentMethodsIndex({ paymentMethods, filters }: PaymentMethodsProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const methodList = paymentMethods.data || [];

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        type: 'cash',
        account_number: '',
        is_active: true,
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/payment-methods', { search: val }, { preserveState: true, replace: true });
    };

    const handleOpenCreate = () => {
        setEditingMethod(null);
        reset();
        setIsOpen(true);
    };

    const handleOpenEdit = (pm: PaymentMethod) => {
        setEditingMethod(pm);
        setData({
            name: pm.name,
            type: pm.type,
            account_number: pm.account_number || '',
            is_active: pm.is_active,
        });
        setIsOpen(true);
    };

    const handleToggleStatus = (pm: PaymentMethod) => {
        const nextActive = !pm.is_active;
        router.put(
            `/payment-methods/${pm.id}`,
            {
                name: pm.name,
                type: pm.type,
                account_number: pm.account_number,
                is_active: nextActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextActive
                            ? `Payment method "${pm.name}" enabled (Visible on POS)`
                            : `Payment method "${pm.name}" disabled`
                    );
                },
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMethod) {
            put(`/payment-methods/${editingMethod.id}`, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Payment method updated successfully!');
                },
            });
        } else {
            post('/payment-methods', {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Payment method added successfully!');
                },
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/payment-methods/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Payment method deleted successfully!');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Cannot delete payment method with active sales records.';
                toast.error(msg);
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Payment Method', key: 'name' },
        { header: 'Type', key: 'type' },
        { header: 'Account / Notes', key: 'account_number', formatter: (val: any) => val || 'N/A' },
        { header: 'Status', key: 'is_active', formatter: (val: any) => (val ? 'Active' : 'Inactive') },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Payment Methods', href: '/payment-methods' }]}>
            <Head title="Payment Methods - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Payment Methods Management</h1>
                        <p className="text-xs text-muted-foreground">Manage store payment channels (Cash, EasyPaisa, JazzCash, Card, Bank) used in POS checkout.</p>
                    </div>
                    <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <Plus className="h-4 w-4" /> Add Payment Method
                    </Button>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Payment Methods Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={methodList}
                            placeholder="Search payment methods..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Payment Method</th>
                                        <th className="p-3">Channel Type</th>
                                        <th className="p-3">Account Details / Notes</th>
                                        <th className="p-3 text-center">POS Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {methodList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                                No payment methods found.
                                            </td>
                                        </tr>
                                    ) : (
                                        methodList.map((pm) => (
                                            <tr key={pm.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-emerald-600" />
                                                    {pm.name}
                                                </td>
                                                <td className="p-3 capitalize font-medium text-muted-foreground">{pm.type}</td>
                                                <td className="p-3 font-mono text-[11px] text-muted-foreground">{pm.account_number || 'N/A'}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(pm)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                            pm.is_active
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${pm.is_active ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                        {pm.is_active ? 'Active' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(pm)} className="h-7 w-7">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(pm.id)} className="h-7 w-7 text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={paymentMethods} />
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">{editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Payment Method Name *</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. EasyPaisa Store Account"
                                className="text-xs"
                            />
                            {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Channel Type *</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-medium"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="mobile_wallet">Mobile Wallet (EasyPaisa / JazzCash)</option>
                                <option value="card">Debit / Credit Card</option>
                                <option value="other">Other Channel</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Account / IBAN Number (Optional)</Label>
                            <Input
                                value={data.account_number}
                                onChange={(e) => setData('account_number', e.target.value)}
                                placeholder="e.g. 03001234567 or IBAN"
                                className="text-xs font-mono"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(val) => setData('is_active', !!val)}
                            />
                            <Label htmlFor="is_active" className="text-xs cursor-pointer font-bold">
                                Enable this payment method on POS Checkout terminal
                            </Label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Save Payment Method
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Custom Confirm Delete Modal */}
            <ConfirmDeleteDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Delete Payment Method"
                description="Are you sure you want to delete this payment method? Historical checkout transactions using this method will remain saved."
            />
        </AppLayout>
    );
}
