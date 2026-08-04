import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptItem {
    id: number;
    item_name: string;
    unit_name?: string;
    quantity: number;
    unit_sell_price: number;
    total_price: number;
}

interface ReceiptData {
    order_number: string;
    created_at: string;
    customer?: {
        name: string;
        phone?: string;
        outstanding_balance?: number;
    };
    payment_method?: {
        name: string;
    };
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    change_return: number;
    due_amount: number;
    items: ReceiptItem[];
}

interface StoreSettings {
    store_name: string;
    phone: string;
    address: string;
    currency_symbol: string;
    receipt_footer: string;
    ntn_number?: string;
}

interface ReceiptPrintProps {
    order: ReceiptData;
    storeSettings: StoreSettings;
    onClose?: () => void;
}

export function ReceiptPrint({ order, storeSettings, onClose }: ReceiptPrintProps) {
    const handlePrint = () => {
        window.print();
    };

    const currency = storeSettings.currency_symbol || 'Rs.';

    return (
        <div className="flex flex-col items-center">
            {/* Action Bar (hidden when printing) */}
            <div className="print:hidden flex items-center justify-between w-full max-w-sm mb-4 bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Order Completed
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handlePrint} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                        <Printer className="h-4 w-4" />
                        Print Receipt
                    </Button>
                    {onClose && (
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    )}
                </div>
            </div>

            {/* Thermal Receipt Body (80mm Width Container) */}
            <div
                id="thermal-receipt"
                className="w-[80mm] min-h-[100mm] bg-white text-black p-4 text-xs font-mono border border-gray-200 shadow-sm print:border-none print:shadow-none print:w-full print:p-0"
                style={{ fontFamily: 'Courier New, Courier, monospace' }}
            >
                {/* Store Header */}
                <div className="text-center pb-2 border-b border-dashed border-gray-400">
                    <h2 className="font-bold text-sm tracking-wide uppercase">{storeSettings.store_name}</h2>
                    <p className="text-[10px] leading-tight">{storeSettings.address}</p>
                    <p className="text-[10px]">Tel: {storeSettings.phone}</p>
                    {storeSettings.ntn_number && <p className="text-[10px]">NTN: {storeSettings.ntn_number}</p>}
                </div>

                {/* Invoice Meta */}
                <div className="py-2 border-b border-dashed border-gray-400 text-[10px]">
                    <div className="flex justify-between">
                        <span>Inv #: {order.order_number}</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Customer: {order.customer?.name || 'Walk-in'}</span>
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {order.payment_method && (
                        <div className="flex justify-between font-semibold">
                            <span>Paid via:</span>
                            <span>{order.payment_method.name}</span>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div className="py-2 border-b border-dashed border-gray-400">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-300 text-[10px]">
                                <th className="py-1">Item</th>
                                <th className="py-1 text-center">Qty</th>
                                <th className="py-1 text-right">Price</th>
                                <th className="py-1 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {order.items.map((item, idx) => (
                                <tr key={idx} className="text-[10px]">
                                    <td className="py-1 pr-1 font-semibold break-words max-w-[30mm]">{item.item_name}</td>
                                    <td className="py-1 text-center whitespace-nowrap">
                                        {Number(item.quantity)} {item.unit_name || ''}
                                    </td>
                                    <td className="py-1 text-right whitespace-nowrap">{Number(item.unit_sell_price).toFixed(2)}</td>
                                    <td className="py-1 text-right font-bold whitespace-nowrap">{Number(item.total_price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{currency} {Number(order.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(order.discount_amount) > 0 && (
                        <div className="flex justify-between text-gray-700">
                            <span>Discount:</span>
                            <span>- {currency} {Number(order.discount_amount).toFixed(2)}</span>
                        </div>
                    )}
                    {Number(order.tax_amount) > 0 && (
                        <div className="flex justify-between text-gray-700">
                            <span>Tax:</span>
                            <span>+ {currency} {Number(order.tax_amount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                        <span>TOTAL AMOUNT:</span>
                        <span>{currency} {Number(order.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span>Amount Tendered:</span>
                        <span>{currency} {Number(order.paid_amount).toFixed(2)}</span>
                    </div>
                    {Number(order.change_return) > 0 && (
                        <div className="flex justify-between font-semibold">
                            <span>Change Return:</span>
                            <span>{currency} {Number(order.change_return).toFixed(2)}</span>
                        </div>
                    )}
                    {Number(order.due_amount) > 0 && (
                        <div className="flex justify-between font-bold text-red-600">
                            <span>Outstanding Balance Added:</span>
                            <span>{currency} {Number(order.due_amount).toFixed(2)}</span>
                        </div>
                    )}
                    {order.customer && Number(order.customer.outstanding_balance) > 0 && (
                        <div className="flex justify-between text-[10px] text-gray-800 pt-1 border-t border-dotted">
                            <span>Total Customer Balance:</span>
                            <span className="font-bold">{currency} {Number(order.customer.outstanding_balance).toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="text-center pt-3 text-[9px] text-gray-600 space-y-1">
                    <p>{storeSettings.receipt_footer}</p>
                    <p className="font-bold tracking-widest uppercase">*** Thank You ***</p>
                    <div className="pt-2 border-t border-dotted border-gray-300 text-[8px] text-gray-500 font-sans">
                        <p>Developed by <strong className="font-bold text-gray-800">Tayyab Dev</strong> (03099700930)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
