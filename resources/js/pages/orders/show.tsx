import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { ArrowLeft, Printer, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
    id: number;
    item_name: string;
    unit_name?: string;
    quantity: number;
    unit_cost_price: number;
    unit_sell_price: number;
    total_price: number;
    profit: number;
}

interface OrderShowProps {
    order: {
        id: number;
        order_number: string;
        subtotal: number;
        discount_amount: number;
        tax_amount: number;
        total_amount: number;
        total_cost: number;
        total_profit: number;
        paid_amount: number;
        due_amount: number;
        change_return: number;
        payment_status: string;
        created_at: string;
        customer?: { name: string; phone?: string; address?: string };
        payment_method?: { name: string };
        user?: { name: string };
        items: OrderItem[];
    };
    storeSettings: any;
}

export default function OrderShow({ order, storeSettings }: OrderShowProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = () => {
        router.delete(`/orders/${order.id}`, {
            onSuccess: () => {
                toast.success('Sales order deleted, product stock restored, and reports updated.');
                setIsDeleting(false);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                toast.error(msg || 'Failed to delete order.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Orders', href: '/orders' }, { title: order.order_number, href: `/orders/${order.id}` }]}>
            <Head title={`Order #${order.order_number} - Qadri General Store`} />

            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/orders">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Order #{order.order_number}</h1>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => setIsDeleting(true)}
                            className="gap-1.5 font-semibold text-xs"
                        >
                            <Trash2 className="h-4 w-4" /> Delete Order
                        </Button>
                        <Link href={`/orders/${order.id}/receipt`}>
                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                <Printer className="h-4 w-4" /> Print Thermal Receipt
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Order Details & Items */}
                    <Card className="shadow-xs md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-emerald-600" />
                                Order Line Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto rounded-lg border border-border">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                        <tr>
                                            <th className="p-3">Item</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="p-3 font-semibold">{item.item_name}</td>
                                                <td className="p-3 text-center">
                                                    {Number(item.quantity)} {item.unit_name}
                                                </td>
                                                <td className="p-3 text-right">Rs. {Number(item.unit_sell_price).toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold">Rs. {Number(item.total_price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card className="shadow-xs md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                            <div className="p-3 bg-muted rounded-lg space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Customer:</span>
                                    <span className="font-semibold">{order.customer?.name || 'Walk-in'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Method:</span>
                                    <span className="font-semibold">{order.payment_method?.name || 'Cash'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Status:</span>
                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                                        {order.payment_status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span>Rs. {Number(order.subtotal).toFixed(2)}</span>
                                </div>
                                {Number(order.discount_amount) > 0 && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Discount:</span>
                                        <span>- Rs. {Number(order.discount_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
                                    <span>Total Amount:</span>
                                    <span className="text-emerald-600">Rs. {Number(order.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-1 font-semibold">
                                    <span>Amount Paid:</span>
                                    <span>Rs. {Number(order.paid_amount).toFixed(2)}</span>
                                </div>
                                {Number(order.due_amount) > 0 && (
                                    <div className="flex justify-between text-amber-600 font-bold">
                                        <span>Outstanding Due:</span>
                                        <span>Rs. {Number(order.due_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(order.change_return) > 0 && (
                                    <div className="flex justify-between font-semibold">
                                        <span>Change Return:</span>
                                        <span>Rs. {Number(order.change_return).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDeleteDialog
                open={isDeleting}
                onOpenChange={setIsDeleting}
                onConfirm={confirmDelete}
                title="Delete Sales Order"
                description="Are you sure you want to delete this sales order? Product stock levels will be restored, customer due balance updated, and financial reports recalculated."
            />
        </AppLayout>
    );
}
