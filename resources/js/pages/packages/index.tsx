import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { Edit, Gift, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PackageBundle {
    id: number;
    name: string;
    barcode?: string;
    price: number;
    status: string;
    items?: any[];
}

interface PackagesProps {
    packages: PaginatedData<PackageBundle>;
    filters: {
        search?: string;
    };
}

export default function PackagesIndex({ packages, filters }: PackagesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/packages', { search: val }, { preserveState: true, replace: true });
    };

    const handleToggleStatus = (pkg: PackageBundle) => {
        const nextStatus = pkg.status === 'active' ? 'inactive' : 'active';
        router.patch(
            `/packages/${pkg.id}/status`,
            { status: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextStatus === 'active'
                            ? `Package "${pkg.name}" enabled (Visible on POS)`
                            : `Package "${pkg.name}" disabled (Hidden from POS)`
                    );
                },
            }
        );
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/packages/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Package deleted successfully!');
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Package Name', key: 'name' },
        { header: 'Barcode', key: 'barcode', formatter: (val: any) => val || 'N/A' },
        { header: 'Bundle Price (Rs.)', key: 'price', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Items Count', key: 'items', formatter: (val: any) => String(val?.length || 0) },
        { header: 'Status', key: 'status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Packages', href: '/packages' }]}>
            <Head title="Packages & Bundles - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Packages & Bundles Management</h1>
                        <p className="text-xs text-muted-foreground">Create promotional product bundles containing multiple items sold at a single package price.</p>
                    </div>
                    <Link href="/packages/create">
                        <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                            <Plus className="h-4 w-4" /> Create Package Bundle
                        </Button>
                    </Link>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Package Bundles Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={packages.data}
                            placeholder="Search package name or barcode..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Package Name</th>
                                        <th className="p-3">Barcode</th>
                                        <th className="p-3">Included Products</th>
                                        <th className="p-3 text-right">Bundle Price</th>
                                        <th className="p-3 text-center">POS Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {packages.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                                No packages created yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        packages.data.map((pkg) => (
                                            <tr key={pkg.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold flex items-center gap-2">
                                                    <Gift className="h-4 w-4 text-emerald-600" />
                                                    {pkg.name}
                                                </td>
                                                <td className="p-3 font-mono">{pkg.barcode || 'N/A'}</td>
                                                <td className="p-3 text-muted-foreground">
                                                    {pkg.items?.map((i) => (i.productVariant ? `${i.product?.name} (${i.productVariant.variant_name})` : i.product?.name)).join(', ') || 'N/A'}
                                                </td>
                                                <td className="p-3 text-right font-extrabold text-emerald-600">
                                                    Rs. {Number(pkg.price).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(pkg)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                            pkg.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${pkg.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                        {pkg.status === 'active' ? 'Active' : 'Disabled (Hidden)'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    <Link href={`/packages/${pkg.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(pkg.id)} className="h-7 w-7 text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={packages} />
                    </CardContent>
                </Card>
            </div>

            {/* Custom Confirm Delete Modal */}
            <ConfirmDeleteDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Delete Package Bundle"
                description="Are you sure you want to delete this package bundle? Historical sales containing this package will remain saved."
            />
        </AppLayout>
    );
}
