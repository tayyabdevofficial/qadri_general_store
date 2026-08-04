import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
    ArrowLeft,
    Building,
    CreditCard,
    DollarSign,
    FileText,
    History,
    Mail,
    MapPin,
    Phone,
    Plus,
    ShoppingBag,
    SquarePen,
    Trash2,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
    id: number;
    type: 'purchase' | 'payment' | 'adjustment';
    amount: number;
    previous_balance: number;
    new_balance: number;
    description?: string;
    created_at: string;
    purchase?: { purchase_number: string };
}

interface PurchaseItem {
    id: number;
    product?: { name: string };
    quantity: number;
    unit_cost_price: number;
}

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    created_at: string;
    items?: PurchaseItem[];
}

interface Supplier {
    id: number;
    name: string;
    company_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    outstanding_balance: number;
    status: string;
    transactions: Transaction[];
    purchases: Purchase[];
}

interface SupplierShowProps {
    supplier: Supplier;
}

export default function SupplierShow({ supplier }: SupplierShowProps) {
    const [activeTab, setActiveTab] = useState<'transactions' | 'purchases'>('transactions');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Single Purchase Payment Modal State
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [singlePurchasePayAmount, setSinglePurchasePayAmount] = useState('');
    const [singlePurchasePayNotes, setSinglePurchasePayNotes] = useState('');
    const [deletePurchaseTargetId, setDeletePurchaseTargetId] = useState<number | null>(null);

    const balance = Number(supplier.outstanding_balance || 0);

    const confirmDeletePurchase = () => {
        if (!deletePurchaseTargetId) return;
        router.delete(`/purchases/${deletePurchaseTargetId}`, {
            onSuccess: () => {
                toast.success('Purchase deleted, stock reverted, and supplier balance updated.');
                setDeletePurchaseTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                toast.error(msg || 'Failed to delete purchase.');
            },
        });
    };

    const handleOpenGeneralPayment = () => {
        setPaymentAmount(balance > 0 ? String(balance) : '');
        setPaymentDesc('');
        setIsPaymentModalOpen(true);
    };

    const handleGeneralPaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid payment amount.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            `/suppliers/${supplier.id}/make-payment`,
            {
                amount: paymentAmount,
                description: paymentDesc,
            },
            {
                onSuccess: () => {
                    toast.success('Supplier payment recorded successfully!');
                    setIsPaymentModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errs) => {
                    const msg = Object.values(errs)[0] as string;
                    toast.error(msg || 'Failed to record supplier payment.');
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleOpenPurchasePayment = (p: Purchase) => {
        setSelectedPurchase(p);
        setSinglePurchasePayAmount(String(p.due_amount));
        setSinglePurchasePayNotes('');
    };

    const handleSinglePurchasePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPurchase) return;

        setIsSubmitting(true);
        router.post(
            `/purchases/${selectedPurchase.id}/pay`,
            {
                amount: singlePurchasePayAmount,
                notes: singlePurchasePayNotes,
            },
            {
                onSuccess: () => {
                    toast.success(`Payment recorded for Purchase #${selectedPurchase.purchase_number}`);
                    setSelectedPurchase(null);
                    setIsSubmitting(false);
                },
                onError: (errs) => {
                    const msg = Object.values(errs)[0] as string;
                    toast.error(msg || 'Failed to process purchase payment.');
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Suppliers', href: '/suppliers' }, { title: supplier.name, href: `/suppliers/${supplier.id}` }]}>
            <Head title={`${supplier.name} Supplier Account - Qadri General Store`} />

            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/suppliers">
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight">{supplier.name}</h1>
                                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                                    {supplier.status}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {supplier.company_name ? `${supplier.company_name} • ` : ''}Supplier Statement & Ledger History
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleOpenGeneralPayment}
                            size="sm"
                            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                            <Wallet className="h-3.5 w-3.5" /> Make Payment
                        </Button>
                        <Link href={`/purchases/create?supplier_id=${supplier.id}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                                <Plus className="h-3.5 w-3.5" /> New Stock-In Purchase
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Key Metrics / Contact Info Cards */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {/* Balance Card */}
                    <Card className={`shadow-xs border-l-4 ${balance > 0 ? 'border-l-amber-500 bg-amber-50/20' : balance < 0 ? 'border-l-emerald-500 bg-emerald-50/20' : 'border-l-muted'}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Outstanding Balance</p>
                                <p className={`font-extrabold text-lg mt-0.5 ${balance > 0 ? 'text-amber-600' : balance < 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                                    Rs. {Math.abs(balance).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {balance > 0 ? 'Owed to Supplier' : balance < 0 ? 'Advance Credit (Supplier Owes Us)' : 'Account Settled (Zero Balance)'}
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${balance > 0 ? 'bg-amber-100 text-amber-700' : balance < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Purchases Summary */}
                    <Card className="shadow-xs">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Stock-In Purchases</p>
                                <p className="font-extrabold text-lg mt-0.5">{supplier.purchases.length} Invoices</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Total Value: Rs. {supplier.purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Phone & Email */}
                    <Card className="shadow-xs">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium">Contact Phone</p>
                                <p className="font-semibold text-xs flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {supplier.phone || 'N/A'}
                                </p>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate max-w-[140px]">
                                    <Mail className="h-3 w-3 text-muted-foreground" /> {supplier.email || 'No Email'}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                <Building className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card className="shadow-xs">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Address Location</p>
                                <p className="font-semibold text-xs mt-1 flex items-start gap-1 text-muted-foreground leading-tight">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>{supplier.address || 'No physical address listed.'}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Navigation Header */}
                <div className="border-b border-border">
                    <nav className="flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'transactions'
                                    ? 'border-emerald-600 text-emerald-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <History className="h-4 w-4" />
                            Balance & Ledger Transactions ({supplier.transactions.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('purchases')}
                            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'purchases'
                                    ? 'border-emerald-600 text-emerald-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Purchases & Stock-In History ({supplier.purchases.length})
                        </button>
                    </nav>
                </div>

                {/* Tab 1: Balance & Ledger History Table */}
                {activeTab === 'transactions' && (
                    <Card className="shadow-xs">
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/30">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <History className="h-4 w-4 text-emerald-600" />
                                Comprehensive Ledger & Transaction History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/70 uppercase text-[10px] font-semibold text-muted-foreground border-b">
                                        <tr>
                                            <th className="p-3">Date & Time</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3 text-right">Amount (Rs.)</th>
                                            <th className="p-3 text-right">Previous Balance</th>
                                            <th className="p-3 text-right">New Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {supplier.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                                                    No ledger transactions recorded yet for this supplier.
                                                </td>
                                            </tr>
                                        ) : (
                                            supplier.transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge
                                                            variant={
                                                                tx.type === 'payment'
                                                                    ? 'default'
                                                                    : tx.type === 'purchase'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                            className={`capitalize text-[10px] ${
                                                                tx.type === 'payment'
                                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                                                                    : tx.type === 'purchase'
                                                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {tx.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-foreground font-medium">
                                                        {tx.description}{' '}
                                                        {tx.purchase ? (
                                                            <span className="font-mono text-emerald-600 font-bold ml-1">
                                                                (#{tx.purchase.purchase_number})
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className="p-3 text-right font-bold">Rs. {Number(tx.amount).toLocaleString()}</td>
                                                    <td className="p-3 text-right text-muted-foreground">
                                                        Rs. {Number(tx.previous_balance).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 text-right font-extrabold">
                                                        <span
                                                            className={
                                                                Number(tx.new_balance) > 0
                                                                    ? 'text-amber-600'
                                                                    : Number(tx.new_balance) < 0
                                                                    ? 'text-emerald-600'
                                                                    : 'text-muted-foreground'
                                                            }
                                                        >
                                                            Rs. {Number(tx.new_balance).toLocaleString()}
                                                        </span>
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

                {/* Tab 2: Purchases History Table */}
                {activeTab === 'purchases' && (
                    <Card className="shadow-xs">
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/30">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                                Stock-In Purchase Invoices
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/70 uppercase text-[10px] font-semibold text-muted-foreground border-b">
                                        <tr>
                                            <th className="p-3">Purchase #</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Items Purchased</th>
                                            <th className="p-3 text-right">Total Amount</th>
                                            <th className="p-3 text-right">Paid Amount</th>
                                            <th className="p-3 text-right">Due Balance</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {supplier.purchases.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                                                    No purchases recorded from this supplier yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            supplier.purchases.map((p) => (
                                                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="p-3 font-semibold font-mono">{p.purchase_number}</td>
                                                    <td className="p-3 text-muted-foreground">{p.purchase_date}</td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {p.items && p.items.length > 0 ? (
                                                            <span>
                                                                {p.items.length} product(s):{' '}
                                                                <span className="font-medium text-foreground">
                                                                    {p.items.map((i) => i.product?.name).filter(Boolean).slice(0, 2).join(', ')}
                                                                    {p.items.length > 2 ? '...' : ''}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            'No item details'
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-bold">Rs. {Number(p.total_amount).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-medium text-emerald-600">
                                                        Rs. {Number(p.paid_amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 text-right font-bold">
                                                        {Number(p.due_amount) > 0 ? (
                                                            <span className="text-red-600">Rs. {Number(p.due_amount).toLocaleString()}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Rs. 0.00</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Badge
                                                            variant={p.payment_status === 'paid' ? 'default' : 'secondary'}
                                                            className="capitalize text-[10px]"
                                                        >
                                                            {p.payment_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right space-x-1">
                                                        {Number(p.due_amount) > 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenPurchasePayment(p)}
                                                                className="h-7 text-[11px] gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                            >
                                                                <Wallet className="h-3 w-3" /> Pay Invoice
                                                            </Button>
                                                        )}
                                                        <Link href={`/purchases/${p.id}/edit`}>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                                title="Edit Purchase"
                                                            >
                                                                <SquarePen className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setDeletePurchaseTargetId(p.id)}
                                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            title="Delete Purchase Invoice"
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
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* General Supplier Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Make Payment to {supplier.name}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGeneralPaymentSubmit} className="space-y-4 py-2">
                        <div className="p-3 rounded bg-muted/60 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Supplier Name:</span>
                                <span className="font-semibold">{supplier.name}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Current Balance Owed:</span>
                                <span className={balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                    Rs. {balance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Payment Amount (Rs.) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter payment amount"
                                className="text-xs font-bold text-emerald-600"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Notes / Reference</Label>
                            <Input
                                type="text"
                                value={paymentDesc}
                                onChange={(e) => setPaymentDesc(e.target.value)}
                                placeholder="e.g. Bank transfer, Cash, Cheque #..."
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                                Record Payment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Single Purchase Payment Modal */}
            <Dialog open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Pay Purchase #{selectedPurchase?.purchase_number}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedPurchase && (
                        <form onSubmit={handleSinglePurchasePaymentSubmit} className="space-y-4 py-2">
                            <div className="p-3 rounded bg-muted/60 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Invoice Cost:</span>
                                    <span>Rs. {Number(selectedPurchase.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span className="text-muted-foreground">Already Paid:</span>
                                    <span className="text-emerald-600">Rs. {Number(selectedPurchase.paid_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Due Balance on Invoice:</span>
                                    <span className="text-red-600">Rs. {Number(selectedPurchase.due_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Payment Amount (Rs.) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={singlePurchasePayAmount}
                                    onChange={(e) => setSinglePurchasePayAmount(e.target.value)}
                                    placeholder="Enter payment amount"
                                    className="text-xs font-bold text-emerald-600"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Note / Description</Label>
                                <Input
                                    type="text"
                                    value={singlePurchasePayNotes}
                                    onChange={(e) => setSinglePurchasePayNotes(e.target.value)}
                                    placeholder="e.g. Partial cash payment"
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedPurchase(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                                    Submit Payment
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Custom Confirm Delete Modal */}
            <ConfirmDeleteDialog
                open={deletePurchaseTargetId !== null}
                onOpenChange={(open) => !open && setDeletePurchaseTargetId(null)}
                onConfirm={confirmDeletePurchase}
                title="Delete Purchase Invoice"
                description="Are you sure you want to delete this purchase entry? Product stock will be reverted and the supplier's balance updated."
            />
        </AppLayout>
    );
}
