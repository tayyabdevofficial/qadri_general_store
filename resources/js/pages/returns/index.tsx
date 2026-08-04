import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import Pagination, { PaginatedData } from '@/components/pagination';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SalesReturn {
    id: number;
    return_number: string;
    total_refund_amount: number;
    refund_type: string;
    reason?: string;
    created_at: string;
    order?: { order_number: string };
    customer?: { name: string };
}

interface ReturnsProps {
    returns: PaginatedData<SalesReturn>;
    filters: {
        search?: string;
    };
}

export default function SalesReturnsIndex({ returns, filters }: ReturnsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/returns', { search: val }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/returns/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Sales return deleted, restocked inventory adjusted, and reports updated.');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                toast.error(msg || 'Failed to delete sales return.');
            },
        });
    };

    const exportColumns = [
        { header: 'Return #', key: 'return_number' },
        { header: 'Order #', key: 'order', formatter: (val: any) => val?.order_number || 'N/A' },
        { header: 'Customer', key: 'customer', formatter: (val: any) => val?.name || 'Walk-in' },
        { header: 'Refund Amount (Rs.)', key: 'total_refund_amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Refund Type', key: 'refund_type' },
        { header: 'Date', key: 'created_at', formatter: (val: any) => new Date(val).toLocaleDateString() },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Sales Returns', href: '/returns' }]}>
            <Head title="Sales Returns - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Sales Returns & Refunds</h1>
                        <p className="text-xs text-muted-foreground">Process item returns, restock inventory, and issue cash or credit refunds.</p>
                    </div>
                    <Link href="/returns/create">
                        <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4" /> Process Sales Return
                        </Button>
                    </Link>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Sales Returns Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={returns.data}
                            placeholder="Search return # or order #..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Return #</th>
                                        <th className="p-3">Order #</th>
                                        <th className="p-3">Customer</th>
                                        <th className="p-3 text-right">Refund Amount</th>
                                        <th className="p-3 text-center">Refund Type</th>
                                        <th className="p-3">Reason</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {returns.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                                No sales returns recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        returns.data.map((r) => (
                                            <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold font-mono">{r.return_number}</td>
                                                <td className="p-3 font-medium">{r.order?.order_number || 'N/A'}</td>
                                                <td className="p-3 text-muted-foreground">{r.customer?.name || 'Walk-in'}</td>
                                                <td className="p-3 text-right font-bold text-red-600">
                                                    Rs. {Number(r.total_refund_amount).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline" className="capitalize text-[10px]">
                                                        {r.refund_type.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-muted-foreground max-w-xs truncate">{r.reason || 'N/A'}</td>
                                                <td className="p-3 font-mono text-[11px]">
                                                    {new Date(r.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        onClick={() => setDeleteTargetId(r.id)}
                                                        title="Delete Sales Return"
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

                        <Pagination data={returns} />
                    </CardContent>
                </Card>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmDeleteDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Delete Sales Return"
                description="Are you sure you want to delete this sales return? Restocked inventory will be deducted, customer balance adjusted, and sales return reports updated."
            />
        </AppLayout>
    );
}
