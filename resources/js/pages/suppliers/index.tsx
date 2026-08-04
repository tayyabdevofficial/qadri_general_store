import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { Edit, Eye, Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
    id: number;
    name: string;
    company_name: string;
    phone: string;
    email: string;
    address: string;
    outstanding_balance: number;
    status: string;
}

interface SuppliersProps {
    suppliers: PaginatedData<Supplier>;
    filters: {
        search?: string;
    };
}

export default function SuppliersIndex({ suppliers, filters }: SuppliersProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        company_name: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/suppliers', { search: val }, { preserveState: true, replace: true });
    };

    const handleOpenCreate = () => {
        setEditingSupplier(null);
        reset();
        setIsOpen(true);
    };

    const handleOpenEdit = (s: Supplier) => {
        setEditingSupplier(s);
        setData({
            name: s.name,
            company_name: s.company_name || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            status: s.status,
        });
        setIsOpen(true);
    };

    const handleToggleStatus = (s: Supplier) => {
        const nextStatus = s.status === 'active' ? 'inactive' : 'active';
        router.put(
            `/suppliers/${s.id}`,
            {
                name: s.name,
                company_name: s.company_name,
                phone: s.phone,
                email: s.email,
                address: s.address,
                status: nextStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextStatus === 'active'
                            ? `Supplier "${s.name}" enabled (Active)`
                            : `Supplier "${s.name}" disabled`
                    );
                },
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            put(`/suppliers/${editingSupplier.id}`, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Supplier updated successfully!');
                },
            });
        } else {
            post('/suppliers', {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Supplier created successfully!');
                },
            });
        }
    };

    const handleMakePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentSupplier) return;

        router.post(
            `/suppliers/${paymentSupplier.id}/make-payment`,
            {
                amount: parseFloat(paymentAmount) || 0,
                description: paymentDesc,
            },
            {
                onSuccess: () => {
                    toast.success('Payment to supplier recorded successfully!');
                    setPaymentSupplier(null);
                    setPaymentAmount('');
                    setPaymentDesc('');
                },
            }
        );
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/suppliers/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Supplier deleted successfully!');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Cannot delete supplier with active records.';
                toast.error(msg);
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Supplier Name', key: 'name' },
        { header: 'Company Name', key: 'company_name', formatter: (val: any) => val || 'N/A' },
        { header: 'Phone Number', key: 'phone', formatter: (val: any) => val || 'N/A' },
        { header: 'Address', key: 'address', formatter: (val: any) => val || 'N/A' },
        { header: 'Payable Balance (Rs.)', key: 'outstanding_balance', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Status', key: 'status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Suppliers', href: '/suppliers' }]}>
            <Head title="Suppliers - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Suppliers & Wholesalers Management</h1>
                        <p className="text-xs text-muted-foreground">Manage distributor contacts and outstanding payable balances.</p>
                    </div>
                    <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <Plus className="h-4 w-4" /> Add Supplier
                    </Button>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Suppliers Payable Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={suppliers.data}
                            placeholder="Search suppliers by name, company, or phone..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Supplier Name</th>
                                        <th className="p-3">Company</th>
                                        <th className="p-3">Phone</th>
                                        <th className="p-3 text-right">Payable Balance</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {suppliers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                                No suppliers found.
                                            </td>
                                        </tr>
                                    ) : (
                                        suppliers.data.map((s) => (
                                            <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold">
                                                    <Link href={`/suppliers/${s.id}`} className="text-foreground hover:text-emerald-600 hover:underline">
                                                        {s.name}
                                                    </Link>
                                                </td>
                                                <td className="p-3 text-muted-foreground font-medium">{s.company_name || 'N/A'}</td>
                                                <td className="p-3 font-mono">{s.phone || 'N/A'}</td>
                                                <td className="p-3 text-right font-bold">
                                                    {Number(s.outstanding_balance) > 0 ? (
                                                        <span className="text-red-600">Rs. {Number(s.outstanding_balance).toLocaleString()}</span>
                                                    ) : Number(s.outstanding_balance) < 0 ? (
                                                        <span className="text-emerald-600">Rs. {Math.abs(Number(s.outstanding_balance)).toLocaleString()} (Advance)</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Rs. 0.00</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(s)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${s.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                                            }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                        {s.status === 'active' ? 'Active' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    {Number(s.outstanding_balance) > 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPaymentSupplier(s)}
                                                            className="h-7 text-[11px] gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                                        >
                                                            <Wallet className="h-3 w-3" /> Make Payment
                                                        </Button>
                                                    )}
                                                    <Link href={`/suppliers/${s.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" title="View Statement & History">
                                                            <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)} className="h-7 w-7">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(s.id)} className="h-7 w-7 text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={suppliers} />
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Contact Person Name *</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Tariq Mehmood"
                                className="text-xs"
                            />
                            {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Company / Distributorship Name</Label>
                            <Input
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                placeholder="e.g. Unilever Pakistan Traders"
                                className="text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Phone Number</Label>
                                <Input
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="0300-9876543"
                                    className="text-xs font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Status *</Label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-bold"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Disabled</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Address / Location</Label>
                            <Input
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Warehouse address"
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Save Supplier
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Make Payment Modal */}
            <Dialog open={paymentSupplier !== null} onOpenChange={(op) => !op && setPaymentSupplier(null)}>
                <DialogContent className="max-w-sm p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Make Payment to Supplier</DialogTitle>
                    </DialogHeader>
                    {paymentSupplier && (
                        <form onSubmit={handleMakePaymentSubmit} className="space-y-4 pt-2">
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs">
                                <span className="block text-muted-foreground">Supplier: <strong>{paymentSupplier.name} ({paymentSupplier.company_name})</strong></span>
                                <span className="block font-bold text-red-700 text-sm mt-1">
                                    Current Payable: Rs. {Number(paymentSupplier.outstanding_balance).toLocaleString()}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Payment Amount (Rs.) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="e.g. 15000"
                                    className="text-xs font-bold text-emerald-600"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Notes / Transaction Ref</Label>
                                <Input
                                    value={paymentDesc}
                                    onChange={(e) => setPaymentDesc(e.target.value)}
                                    placeholder="Cheque # or Cash Slip"
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setPaymentSupplier(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                    Confirm Payment
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
                title="Delete Supplier Account"
                description="Are you sure you want to delete this supplier account? Historical stock purchases linked to this supplier will remain in record."
            />
        </AppLayout>
    );
}
