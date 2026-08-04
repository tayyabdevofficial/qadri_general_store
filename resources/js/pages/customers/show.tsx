import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReceiptPrint } from '@/components/receipt-print';
import {
    ArrowLeft,
    CreditCard,
    DollarSign,
    FileText,
    History,
    Loader2,
    Package,
    Phone,
    PlusCircle,
    Printer,
    Search,
    ShoppingCart,
    User,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
}

interface OrderItem {
    id: number;
    item_name: string;
    quantity: number;
    unit_name?: string;
    unit_sell_price: number;
    total_price: number;
}

interface Order {
    id: number;
    order_number: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    change_return: number;
    payment_status: 'paid' | 'partial' | 'unpaid';
    created_at: string;
    items: OrderItem[];
    payment_method?: PaymentMethod;
    customer?: {
        name: string;
        phone?: string;
    };
}

interface Transaction {
    id: number;
    type: 'sale' | 'payment' | 'adjustment' | 'return';
    amount: number;
    previous_balance: number;
    new_balance: number;
    description?: string;
    created_at: string;
    order?: { order_number: string };
}

interface CustomerShowProps {
    customer: {
        id: number;
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        outstanding_balance: number;
        is_walk_in: boolean;
        status: string;
        transactions: Transaction[];
        orders: Order[];
    };
    paymentMethods: PaymentMethod[];
    storeSettings?: any;
}

export default function CustomerShow({ customer, paymentMethods = [], storeSettings }: CustomerShowProps) {
    const [activeTab, setActiveTab] = useState<'ledger' | 'orders'>('ledger');
    const [ledgerSearch, setLedgerSearch] = useState('');
    const [ordersSearch, setOrdersSearch] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_method_id: paymentMethods[0]?.id ? String(paymentMethods[0].id) : '',
        description: '',
    });

    const currentBalance = Number(customer.outstanding_balance);
    const isDebt = currentBalance > 0;
    const isAdvance = currentBalance < 0;
    const advanceAmount = Math.abs(currentBalance);

    const filteredTransactions = customer.transactions.filter((tx) => {
        const q = ledgerSearch.toLowerCase();
        return (
            !ledgerSearch ||
            tx.type.toLowerCase().includes(q) ||
            (tx.description && tx.description.toLowerCase().includes(q)) ||
            (tx.order?.order_number && tx.order.order_number.toLowerCase().includes(q)) ||
            String(tx.amount).includes(q) ||
            new Date(tx.created_at).toLocaleString().toLowerCase().includes(q)
        );
    });

    const filteredOrders = customer.orders.filter((order) => {
        const q = ordersSearch.toLowerCase();
        return (
            !ordersSearch ||
            order.order_number.toLowerCase().includes(q) ||
            order.payment_status.toLowerCase().includes(q) ||
            (order.payment_method?.name && order.payment_method.name.toLowerCase().includes(q)) ||
            String(order.total_amount).includes(q) ||
            String(order.paid_amount).includes(q) ||
            String(order.due_amount).includes(q) ||
            new Date(order.created_at).toLocaleString().toLowerCase().includes(q)
        );
    });

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(`/customers/${customer.id}/receive-payment`, {
            onSuccess: () => {
                setIsPaymentModalOpen(false);
                reset();
                toast.success('Payment recorded successfully.');
            },
        });
    };

    const defaultStoreSettings = storeSettings || {
        store_name: 'Qadri General Store',
        phone: '0300-0000000',
        address: 'Main Market, Gujranwala',
        currency_symbol: 'Rs.',
        receipt_footer: 'Thank you for shopping with us!',
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Customers', href: '/customers' }, { title: customer.name, href: `/customers/${customer.id}` }]}>
            <Head title={`${customer.name} - Ledger & History`} />

            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
                {/* Header with Title & Receive Payment Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/customers">
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight">{customer.name}</h1>
                                {customer.is_walk_in && <Badge variant="secondary">System Walk-in</Badge>}
                                <Badge variant={customer.status === 'active' ? 'default' : 'outline'} className="capitalize">
                                    {customer.status}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Customer Account Statement, Order History & Ledger
                            </p>
                        </div>
                    </div>

                    {!customer.is_walk_in && (
                        <Button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-xs"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Receive Payment / Clear Dues
                        </Button>
                    )}
                </div>

                {/* Key Financial Metrics Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* Contact Info Card */}
                    <Card className="shadow-xs bg-card border-border">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">Contact & Address</p>
                                <p className="font-bold text-sm">{customer.phone || 'No phone'}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{customer.address || 'No address'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Balance Card */}
                    <Card className={`shadow-xs border ${isDebt ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900' : isAdvance ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900' : 'bg-card border-border'}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isDebt ? 'bg-amber-100 text-amber-800' : isAdvance ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    {isDebt ? 'Outstanding Debt (Due)' : isAdvance ? 'Advance Customer Credit' : 'Current Account Balance'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className={`font-extrabold text-lg ${isDebt ? 'text-amber-600 dark:text-amber-400' : isAdvance ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                        Rs. {isAdvance ? advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    {isAdvance && <Badge className="bg-emerald-600 text-white text-[10px]">Advance Credit</Badge>}
                                    {isDebt && <Badge variant="destructive" className="text-[10px]">Pending Due</Badge>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Orders Metric Card */}
                    <Card className="shadow-xs bg-card border-border">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">Total POS Purchases</p>
                                <p className="font-extrabold text-base">{customer.orders.length} Orders</p>
                                <p className="text-xs text-muted-foreground">
                                    Total Value: Rs. {customer.orders.reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Tabs Header */}
                <div className="flex items-center gap-2 border-b border-border pb-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('ledger')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            activeTab === 'ledger'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        <History className="h-4 w-4" />
                        Ledger & Payment Transactions ({customer.transactions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            activeTab === 'orders'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        POS Orders History ({customer.orders.length})
                    </button>
                </div>

                {/* TAB 1: Ledger & Balance History */}
                {activeTab === 'ledger' && (
                    <Card className="shadow-xs">
                        <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <History className="h-4 w-4 text-indigo-500" />
                                Account Balance & Ledger Statement ({filteredTransactions.length})
                            </CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search ledger by desc, type, ref..."
                                    value={ledgerSearch}
                                    onChange={(e) => setLedgerSearch(e.target.value)}
                                    className="pl-8 h-8 text-xs bg-background"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 uppercase text-[10px] font-semibold text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="p-3">Date & Time</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Description / Reference</th>
                                            <th className="p-3 text-right">Amount (Rs.)</th>
                                            <th className="p-3 text-right">Prev Balance</th>
                                            <th className="p-3 text-right">New Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                    No ledger transactions found matching search.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 font-mono text-[11px]">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge
                                                            variant={
                                                                tx.type === 'payment'
                                                                    ? 'default'
                                                                    : tx.type === 'sale'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                            className="capitalize text-[10px]"
                                                        >
                                                            {tx.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {tx.description}{' '}
                                                        {tx.order && (
                                                            <span className="font-semibold text-foreground">
                                                                ({tx.order.order_number})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-bold">
                                                        Rs. {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-3 text-right text-muted-foreground font-mono">
                                                        Rs. {Number(tx.previous_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-3 text-right font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                                                        Rs. {Number(tx.new_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 2: Orders History */}
                {activeTab === 'orders' && (
                    <Card className="shadow-xs">
                        <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                                Purchased POS Invoices ({filteredOrders.length})
                            </CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search order #, status, method..."
                                    value={ordersSearch}
                                    onChange={(e) => setOrdersSearch(e.target.value)}
                                    className="pl-8 h-8 text-xs bg-background"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 uppercase text-[10px] font-semibold text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="p-3">Order #</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Payment Status</th>
                                            <th className="p-3">Payment Method</th>
                                            <th className="p-3 text-right">Total Amount</th>
                                            <th className="p-3 text-right">Paid Amount</th>
                                            <th className="p-3 text-right">Due Amount</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                    No POS orders found matching search.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 font-bold font-mono text-emerald-600">
                                                        {order.order_number}
                                                    </td>
                                                    <td className="p-3 font-mono text-[11px]">
                                                        {new Date(order.created_at).toLocaleString([], {
                                                            dateStyle: 'short',
                                                            timeStyle: 'short',
                                                        })}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge
                                                            variant={
                                                                order.payment_status === 'paid'
                                                                    ? 'default'
                                                                    : order.payment_status === 'partial'
                                                                    ? 'secondary'
                                                                    : 'destructive'
                                                            }
                                                            className="capitalize text-[10px]"
                                                        >
                                                            {order.payment_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {order.payment_method?.name || 'Cash'}
                                                    </td>
                                                    <td className="p-3 text-right font-extrabold">
                                                        Rs. {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-3 text-right font-semibold text-emerald-600">
                                                        Rs. {Number(order.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-amber-600">
                                                        Rs. {Number(order.due_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedOrderReceipt(order)}
                                                            className="h-7 text-[11px] gap-1"
                                                        >
                                                            <Printer className="h-3 w-3" />
                                                            Receipt
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal 1: Receive Payment / Pay Dues Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-emerald-600" />
                            Receive Payment from {customer.name}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
                        {/* Current Balance Notice */}
                        <div className="p-3 bg-muted rounded-lg space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground block">
                                Current Account Balance:
                            </span>
                            <span className={`text-lg font-black ${isDebt ? 'text-amber-600' : isAdvance ? 'text-emerald-600' : 'text-foreground'}`}>
                                {isDebt ? `Rs. ${currentBalance.toFixed(2)} (Pending Debt)` : isAdvance ? `Rs. ${advanceAmount.toFixed(2)} (Advance Credit)` : 'Rs. 0.00 (Clear)'}
                            </span>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Amount Received (Rs.)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter payment amount..."
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="text-base font-bold"
                                autoFocus
                            />
                            {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Payment Method</Label>
                            <Select
                                value={data.payment_method_id}
                                onValueChange={(val) => setData('payment_method_id', val)}
                            >
                                <SelectTrigger className="w-full text-xs">
                                    <SelectValue placeholder="Select Payment Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map((pm) => (
                                        <SelectItem key={pm.id} value={String(pm.id)}>
                                            {pm.name} ({pm.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description / Reference Field */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Notes / Reference (Optional)</Label>
                            <Input
                                placeholder="e.g. Received cash payment at counter"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        {/* Overpay Advance Hint */}
                        {Number(data.amount) > currentBalance && currentBalance > 0 && (
                            <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 p-2.5 rounded border border-emerald-200">
                                Overpayment Notice: Paying Rs. {Number(data.amount).toFixed(2)} will clear the Rs. {currentBalance.toFixed(2)} debt and add Rs. {(Number(data.amount) - currentBalance).toFixed(2)} as customer advance credit.
                            </p>
                        )}

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving Payment...
                                    </>
                                ) : (
                                    'Save Payment'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 2: View Order Receipt Modal */}
            <Dialog open={!!selectedOrderReceipt} onOpenChange={() => setSelectedOrderReceipt(null)}>
                <DialogContent className="max-w-md p-6">
                    {selectedOrderReceipt && (
                        <ReceiptPrint
                            order={selectedOrderReceipt}
                            storeSettings={defaultStoreSettings}
                            onClose={() => setSelectedOrderReceipt(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
