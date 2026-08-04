import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ReceiptPrint } from '@/components/receipt-print';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface OrderReceiptProps {
    order: any;
    storeSettings: any;
}

export default function OrderReceiptPage({ order, storeSettings }: OrderReceiptProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Orders', href: '/orders' }, { title: `Receipt ${order.order_number}`, href: `/orders/${order.id}/receipt` }]}>
            <Head title={`Receipt #${order.order_number} - Qadri General Store`} />

            <div className="p-4 md:p-6 flex flex-col items-center">
                <div className="w-full max-w-sm mb-4 print:hidden flex items-center justify-between">
                    <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                            <ArrowLeft className="h-4 w-4" /> Back to Order
                        </Button>
                    </Link>
                </div>

                <ReceiptPrint order={order} storeSettings={storeSettings} />
            </div>
        </AppLayout>
    );
}
