import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import Pagination, { PaginatedData } from '@/components/pagination';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Eye, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
    id: number;
    order_number: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    created_at: string;
    customer?: { name: string; phone?: string };
    payment_method?: { name: string };
    user?: { name: string };
}

interface OrdersProps {
    orders: PaginatedData<Order>;
    filters: {
        search?: string;
        payment_status?: string;
    };
}

export default function OrdersIndex({ orders, filters }: OrdersProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/orders', { search: val }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/orders/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Sales order deleted, product stock restored, and reports updated.');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                toast.error(msg || 'Failed to delete order.');
            },
        });
    };

    const exportColumns = [
        { header: 'Order #', key: 'order_number' },
        { header: 'Date & Time', key: 'created_at', formatter: (val: any) => new Date(val).toLocaleString() },
        { header: 'Customer', key: 'customer', formatter: (val: any) => val?.name || 'Walk-in' },
        { header: 'Total (Rs.)', key: 'total_amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Paid (Rs.)', key: 'paid_amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Due (Rs.)', key: 'due_amount', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Payment Method', key: 'payment_method', formatter: (val: any) => val?.name || 'Cash' },
        { header: 'Status', key: 'payment_status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Orders', href: '/orders' }]}>
            <Head title="Orders & Receipts - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Sales Orders & Thermal Receipts</h1>
                        <p className="text-xs text-muted-foreground">View past sales transactions, filter orders, and print customer receipts.</p>
                    </div>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Sales Orders Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={orders.data}
                            placeholder="Search order # or customer name..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Order #</th>
                                        <th className="p-3">Date & Time</th>
                                        <th className="p-3">Customer</th>
                                        <th className="p-3 text-right">Total Amount</th>
                                        <th className="p-3 text-right">Paid</th>
                                        <th className="p-3 text-[10px] text-right">Due / Outstanding</th>
                                        <th className="p-3 text-center">Payment Method</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-6 text-center text-muted-foreground">
                                                No sales orders recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.data.map((o) => (
                                            <tr key={o.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold font-mono">
                                                    <Link href={`/orders/${o.id}`} className="hover:underline text-emerald-700 dark:text-emerald-400">
                                                        {o.order_number}
                                                    </Link>
                                                </td>
                                                <td className="p-3 text-muted-foreground font-mono text-[11px]">
                                                    {new Date(o.created_at).toLocaleString()}
                                                </td>
                                                <td className="p-3 font-medium">{o.customer?.name || 'Walk-in Customer'}</td>
                                                <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                                                    Rs. {Number(o.total_amount).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-right font-semibold text-emerald-600">
                                                    Rs. {Number(o.paid_amount).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-right font-bold">
                                                    {Number(o.due_amount) > 0 ? (
                                                        <span className="text-amber-600">Rs. {Number(o.due_amount).toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Rs. 0.00</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center text-muted-foreground">
                                                    {o.payment_method?.name || 'Cash'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge variant={o.payment_status === 'paid' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                                                        {o.payment_status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    <Link href={`/orders/${o.id}/receipt`}>
                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                                                            <Printer className="h-3 w-3" /> Thermal Receipt
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/orders/${o.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        onClick={() => setDeleteTargetId(o.id)}
                                                        title="Delete Order"
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

                        <Pagination data={orders} />
                    </CardContent>
                </Card>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmDeleteDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Delete Sales Order"
                description="Are you sure you want to delete this order? Sold item quantities will be restored back to inventory stock, customer balance adjusted, and sales reports updated."
            />
        </AppLayout>
    );
}
