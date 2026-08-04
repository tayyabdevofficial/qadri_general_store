import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { BarChart3, Calendar, DollarSign, Filter, TrendingUp } from 'lucide-react';

interface ReportsProps {
    summary: {
        grossSales: number;
        totalDiscounts: number;
        totalTaxes: number;
        netSales: number;
        totalCOGS: number;
        grossProfit: number;
        totalReturns: number;
        totalExpenses: number;
        netProfit: number;
        profitMargin: number;
    };
    topProducts: Array<{
        item_name: string;
        total_qty: number;
        total_revenue: number;
        total_profit: number;
    }>;
    categoriesBreakdown: Array<{
        category_name: string;
        revenue: number;
    }>;
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

export default function ReportsIndex({ summary, topProducts, categoriesBreakdown, filters }: ReportsProps) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports', { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    const exportColumns = [
        { header: 'Product Name', key: 'item_name' },
        { header: 'Total Sold Qty', key: 'total_qty', formatter: (val: any) => String(Number(val)) },
        { header: 'Revenue (Rs.)', key: 'total_revenue', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Gross Profit (Rs.)', key: 'total_profit', formatter: (val: any) => Number(val).toFixed(2) },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Financial Reports', href: '/reports' }]}>
            <Head title="Sales & Profit/Loss Reports - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Financial Reports & Profit/Loss Analytics</h1>
                        <p className="text-xs text-muted-foreground">Historical cost/sell price analytics, gross profit, store expenses, and net profit statement.</p>
                    </div>

                    {/* Date Range Filter Bar */}
                    <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
                        <Calendar className="h-4 w-4 text-muted-foreground ml-1" />
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-8 text-xs w-36"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-8 text-xs w-36"
                        />
                        <Button type="submit" size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1">
                            <Filter className="h-3.5 w-3.5" /> Filter
                        </Button>
                    </form>
                </div>

                {/* Summary Metrics Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-card shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Net Sales Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                Rs. {Number(summary.netSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Gross Sales minus discounts</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Cost of Goods Sold (COGS)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                Rs. {Number(summary.totalCOGS).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Buy cost of all sold items</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Store Overhead Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                Rs. {Number(summary.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Electricity, rent, staff tea, maintenance</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Net Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-black ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                Rs. {Number(summary.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] font-semibold text-emerald-700 mt-1">
                                Profit Margin: {summary.profitMargin}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products Table */}
                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                            Top Selling Products & Profitability
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Top Products Financial Report"
                            search=""
                            onSearchChange={() => {}}
                            columns={exportColumns}
                            data={topProducts}
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Product Name</th>
                                        <th className="p-3 text-center">Total Sold Qty</th>
                                        <th className="p-3 text-right">Revenue Generated</th>
                                        <th className="p-3 text-right">Gross Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {topProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                                No sales recorded for the selected period.
                                            </td>
                                        </tr>
                                    ) : (
                                        topProducts.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold">{p.item_name}</td>
                                                <td className="p-3 text-center font-bold">{Number(p.total_qty)}</td>
                                                <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                                                    Rs. {Number(p.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-right font-bold text-emerald-600">
                                                    Rs. {Number(p.total_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
