import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { Edit, Eye, Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
    address: string;
    outstanding_balance: number;
    is_walk_in: boolean;
    status: string;
}

interface CustomersProps {
    customers: PaginatedData<Customer>;
    filters: {
        search?: string;
    };
}

export default function CustomersIndex({ customers, filters }: CustomersProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/customers', { search: val }, { preserveState: true, replace: true });
    };

    const handleOpenCreate = () => {
        setEditingCustomer(null);
        reset();
        setIsOpen(true);
    };

    const handleOpenEdit = (c: Customer) => {
        setEditingCustomer(c);
        setData({
            name: c.name,
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            status: c.status,
        });
        setIsOpen(true);
    };

    const handleToggleStatus = (c: Customer) => {
        const nextStatus = c.status === 'active' ? 'inactive' : 'active';
        router.put(
            `/customers/${c.id}`,
            {
                name: c.name,
                phone: c.phone,
                email: c.email,
                address: c.address,
                status: nextStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextStatus === 'active'
                            ? `Customer "${c.name}" enabled (Active)`
                            : `Customer "${c.name}" disabled`
                    );
                },
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCustomer) {
            put(`/customers/${editingCustomer.id}`, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Customer updated successfully!');
                },
            });
        } else {
            post('/customers', {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Customer added successfully!');
                },
            });
        }
    };

    const handleReceivePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentCustomer) return;
        router.post(
            `/customers/${paymentCustomer.id}/receive-payment`,
            {
                amount: paymentAmount,
                notes: paymentDesc,
            },
            {
                onSuccess: () => {
                    toast.success('Payment recorded successfully!');
                    setPaymentCustomer(null);
                    setPaymentAmount('');
                    setPaymentDesc('');
                },
            }
        );
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/customers/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Customer deleted successfully!');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Cannot delete customer with active records.';
                toast.error(msg);
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Customer Name', key: 'name' },
        { header: 'Phone Number', key: 'phone', formatter: (val: any) => val || 'N/A' },
        { header: 'Email', key: 'email', formatter: (val: any) => val || 'N/A' },
        { header: 'Address', key: 'address', formatter: (val: any) => val || 'N/A' },
        { header: 'Outstanding Balance (Rs.)', key: 'outstanding_balance', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Status', key: 'status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Customers', href: '/customers' }]}>
            <Head title="Customers - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Customers & Ledger Management</h1>
                        <p className="text-xs text-muted-foreground">Manage store customer accounts, outstanding balances, and receive dues payments.</p>
                    </div>
                    <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <Plus className="h-4 w-4" /> Add Customer
                    </Button>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Customers Ledger Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={customers.data}
                            placeholder="Search customers by name or phone..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Customer Name</th>
                                        <th className="p-3">Phone</th>
                                        <th className="p-3">Address</th>
                                        <th className="p-3 text-right">Outstanding Balance</th>
                                        <th className="p-3 text-center">Type</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {customers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                                No customers found.
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.data.map((c) => (
                                            <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold">
                                                    <Link href={`/customers/${c.id}`} className="hover:underline text-emerald-700 dark:text-emerald-400">
                                                        {c.name}
                                                    </Link>
                                                </td>
                                                <td className="p-3 font-mono">{c.phone || 'N/A'}</td>
                                                <td className="p-3 text-muted-foreground max-w-xs truncate">{c.address || 'N/A'}</td>
                                                <td className="p-3 text-right font-bold">
                                                    {Number(c.outstanding_balance) > 0 ? (
                                                        <span className="text-amber-600">Rs. {Number(c.outstanding_balance).toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Rs. 0.00</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {c.is_walk_in ? (
                                                        <Badge variant="outline" className="bg-muted">Walk-in System</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Registered</Badge>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(c)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                            c.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                        {c.status === 'active' ? 'Active' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    {Number(c.outstanding_balance) > 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPaymentCustomer(c)}
                                                            className="h-7 text-[11px] gap-1 border-amber-500 text-amber-600 hover:bg-amber-50"
                                                        >
                                                            <Wallet className="h-3 w-3" /> Receive Dues
                                                        </Button>
                                                    )}
                                                    <Link href={`/customers/${c.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(c)} className="h-7 w-7">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {!c.is_walk_in && (
                                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(c.id)} className="h-7 w-7 text-red-500">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={customers} />
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Customer Full Name *</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Muhammad Ali"
                                className="text-xs"
                            />
                            {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Phone Number</Label>
                                <Input
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="0300-1234567"
                                    className="text-xs font-mono"
                                />
                                {errors.phone && <p className="text-[10px] text-red-500">{errors.phone}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Email Address</Label>
                                <Input
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="ali@example.com"
                                    className="text-xs"
                                />
                                {errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
                            </div>
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

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Address Details</Label>
                            <Input
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Street or City Address"
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Save Customer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Receive Payment Modal */}
            <Dialog open={paymentCustomer !== null} onOpenChange={(op) => !op && setPaymentCustomer(null)}>
                <DialogContent className="max-w-sm p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Receive Dues Payment</DialogTitle>
                    </DialogHeader>
                    {paymentCustomer && (
                        <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 pt-2">
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                                <span className="block text-muted-foreground">Customer: <strong>{paymentCustomer.name}</strong></span>
                                <span className="block font-bold text-amber-700 text-sm mt-1">
                                    Current Dues: Rs. {Number(paymentCustomer.outstanding_balance).toLocaleString()}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Amount Received (Rs.) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="text-xs font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Payment Notes / Ref</Label>
                                <Input
                                    value={paymentDesc}
                                    onChange={(e) => setPaymentDesc(e.target.value)}
                                    placeholder="Cash or Bank Transfer Ref"
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setPaymentCustomer(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
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
                title="Delete Customer Account"
                description="Are you sure you want to delete this customer account? Previous sales orders linked to this customer will remain saved."
            />
        </AppLayout>
    );
}
