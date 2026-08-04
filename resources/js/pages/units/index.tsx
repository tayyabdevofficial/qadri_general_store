import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Unit {
    id: number;
    name: string;
    short_name: string;
    allow_decimal: boolean;
    is_variable_price: boolean;
    status: string;
    products_count?: number;
}

interface UnitsProps {
    units: PaginatedData<Unit>;
    filters: {
        search?: string;
    };
}

export default function UnitsIndex({ units, filters }: UnitsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        short_name: '',
        allow_decimal: false,
        is_variable_price: false,
        status: 'active',
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/units', { search: val }, { preserveState: true, replace: true });
    };

    const handleOpenCreate = () => {
        setEditingUnit(null);
        reset();
        setIsOpen(true);
    };

    const handleOpenEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setData({
            name: unit.name,
            short_name: unit.short_name,
            allow_decimal: unit.allow_decimal,
            is_variable_price: unit.is_variable_price,
            status: unit.status,
        });
        setIsOpen(true);
    };

    const handleToggleStatus = (unit: Unit) => {
        const nextStatus = unit.status === 'active' ? 'inactive' : 'active';
        router.put(
            `/units/${unit.id}`,
            {
                name: unit.name,
                short_name: unit.short_name,
                allow_decimal: unit.allow_decimal,
                is_variable_price: unit.is_variable_price,
                status: nextStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextStatus === 'active'
                            ? `Unit "${unit.name}" enabled (Visible on POS)`
                            : `Unit "${unit.name}" disabled (Hidden from POS)`
                    );
                },
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit) {
            put(`/units/${editingUnit.id}`, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Unit updated successfully!');
                },
            });
        } else {
            post('/units', {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Unit created successfully!');
                },
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/units/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Unit deleted successfully!');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Cannot delete unit associated with products.';
                toast.error(msg);
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Unit Name', key: 'name' },
        { header: 'Short Symbol', key: 'short_name' },
        { header: 'Allow Decimal Qty', key: 'allow_decimal', formatter: (val: any) => (val ? 'Yes' : 'No') },
        { header: 'Variable Price Unit', key: 'is_variable_price', formatter: (val: any) => (val ? 'Yes (POS Amount Mode)' : 'No') },
        { header: 'Status', key: 'status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Units', href: '/units' }]}>
            <Head title="Measurement Units - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Units Management</h1>
                        <p className="text-xs text-muted-foreground">Manage measurement units & POS variable price modes (e.g. Kg, Gram, Piece).</p>
                    </div>
                    <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <Plus className="h-4 w-4" /> Add Unit
                    </Button>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Measurement Units Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={units.data}
                            placeholder="Search units..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Unit Name</th>
                                        <th className="p-3">Short Symbol</th>
                                        <th className="p-3 text-center">Allow Decimals</th>
                                        <th className="p-3 text-center">Variable Price (POS)</th>
                                        <th className="p-3 text-center">POS Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {units.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                                No units found.
                                            </td>
                                        </tr>
                                    ) : (
                                        units.data.map((u) => (
                                            <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold">{u.name}</td>
                                                <td className="p-3 font-mono font-bold text-emerald-600">{u.short_name}</td>
                                                <td className="p-3 text-center">
                                                    <Badge variant={u.allow_decimal ? 'default' : 'secondary'} className="text-[10px]">
                                                        {u.allow_decimal ? 'Allowed' : 'Integers Only'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge variant={u.is_variable_price ? 'default' : 'outline'} className={u.is_variable_price ? 'bg-amber-500 text-white' : ''}>
                                                        {u.is_variable_price ? 'Variable Price (Amount Mode)' : 'Standard Qty'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(u)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                            u.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                        {u.status === 'active' ? 'Active' : 'Disabled (Hidden)'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(u)} className="h-7 w-7">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(u.id)} className="h-7 w-7 text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={units} />
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Unit Name *</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Kilogram"
                                className="text-xs"
                            />
                            {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Short Symbol *</Label>
                            <Input
                                value={data.short_name}
                                onChange={(e) => setData('short_name', e.target.value)}
                                placeholder="e.g. kg"
                                className="text-xs font-mono"
                            />
                            {errors.short_name && <p className="text-[10px] text-red-500">{errors.short_name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">POS Status *</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-bold"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            >
                                <option value="active">Active (Visible on POS)</option>
                                <option value="inactive">Disabled (Hidden from POS)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                id="allow_decimal"
                                checked={data.allow_decimal}
                                onCheckedChange={(val) => setData('allow_decimal', !!val)}
                            />
                            <Label htmlFor="allow_decimal" className="text-xs cursor-pointer">
                                Allow decimal quantities (e.g., 0.500 kg)
                            </Label>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                                id="is_variable_price"
                                checked={data.is_variable_price}
                                onCheckedChange={(val) => setData('is_variable_price', !!val)}
                            />
                            <Label htmlFor="is_variable_price" className="text-xs cursor-pointer font-bold text-amber-600">
                                Variable Price Unit (Enables Amount Mode on POS terminal)
                            </Label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Save Unit
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
                title="Delete Unit"
                description="Are you sure you want to delete this measurement unit? Associated products will maintain their records."
            />
        </AppLayout>
    );
}
