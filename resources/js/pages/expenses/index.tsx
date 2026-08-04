import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
    id: number;
    title: string;
    amount: number;
    expense_date: string;
    notes?: string;
    category?: { name: string };
    paymentMethod?: { name: string };
}

interface ExpensesProps {
    expenses: PaginatedData<Expense>;
    categories: any[];
    paymentMethods: any[];
    filters: {
        search?: string;
    };
}

export default function ExpensesIndex({ expenses, categories, paymentMethods, filters }: ExpensesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [catName, setCatName] = useState('');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        expense_category_id: '',
        payment_method_id: '',
        title: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/expenses', { search: val }, { preserveState: true, replace: true });
    };

    const handleOpenCreate = () => {
        reset();
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/expenses', {
            onSuccess: () => {
                setIsOpen(false);
                toast.success('Expense recorded successfully!');
            },
        });
    };

    const handleCatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/expenses/categories',
            { name: catName },
            {
                onSuccess: () => {
                    setIsCatOpen(false);
                    setCatName('');
                    toast.success('Expense category added!');
                },
            }
        );
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/expenses/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Expense record deleted!');
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Title', key: 'title' },
        { header: 'Category', key: 'category', formatter: (val: any) => val?.name || 'General' },
        { header: 'Amount (Rs.)', key: 'amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Date', key: 'expense_date' },
        { header: 'Payment Method', key: 'paymentMethod', formatter: (val: any) => val?.name || 'Cash' },
        { header: 'Notes', key: 'notes', formatter: (val: any) => val || 'N/A' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Expenses', href: '/expenses' }]}>
            <Head title="Store Expenses - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Store Expenses & Overheads</h1>
                        <p className="text-xs text-muted-foreground">Track daily store operational expenses (electricity, rent, staff tea) for net profit calculation.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsCatOpen(true)} className="gap-1 text-xs">
                            + Category
                        </Button>
                        <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                            <Plus className="h-4 w-4" /> Add Expense
                        </Button>
                    </div>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Operational Expenses Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={expenses.data}
                            placeholder="Search expenses by title or category..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Expense Title</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Payment Channel</th>
                                        <th className="p-3 text-right">Amount (Rs.)</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {expenses.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                                No expense records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.data.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                                    {exp.title}
                                                </td>
                                                <td className="p-3 text-muted-foreground">{exp.category?.name || 'General'}</td>
                                                <td className="p-3 font-mono text-[11px]">{exp.expense_date}</td>
                                                <td className="p-3 font-medium">{exp.paymentMethod?.name || 'Cash'}</td>
                                                <td className="p-3 text-right font-bold text-red-600">
                                                    Rs. {Number(exp.amount).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(exp.id)} className="h-7 w-7 text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={expenses} />
                    </CardContent>
                </Card>
            </div>

            {/* Add Expense Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Record Store Expense</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Expense Title *</Label>
                            <Input
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="e.g. Monthly Electricity Bill"
                                className="text-xs"
                            />
                            {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Category</Label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                                    value={data.expense_category_id}
                                    onChange={(e) => setData('expense_category_id', e.target.value)}
                                >
                                    <option value="">-- General --</option>
                                    {categories.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Amount (Rs.) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="e.g. 4500"
                                    className="text-xs font-bold text-red-600"
                                />
                                {errors.amount && <p className="text-[10px] text-red-500">{errors.amount}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Expense Date *</Label>
                                <Input
                                    type="date"
                                    value={data.expense_date}
                                    onChange={(e) => setData('expense_date', e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Paid Via</Label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                                    value={data.payment_method_id}
                                    onChange={(e) => setData('payment_method_id', e.target.value)}
                                >
                                    <option value="">Cash</option>
                                    {paymentMethods.map((pm: any) => (
                                        <option key={pm.id} value={pm.id}>
                                            {pm.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Additional Notes</Label>
                            <Input
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Ref number or voucher details"
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Save Expense
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Category Modal */}
            <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
                <DialogContent className="max-w-xs p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Add Expense Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCatSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Category Name *</Label>
                            <Input
                                value={catName}
                                onChange={(e) => setCatName(e.target.value)}
                                placeholder="e.g. Utilities / Staff Wages"
                                className="text-xs"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCatOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Add Category
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
                title="Delete Expense Record"
                description="Are you sure you want to delete this operational expense record? Your financial analytics report will be updated."
            />
        </AppLayout>
    );
}
