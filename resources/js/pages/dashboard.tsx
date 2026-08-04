import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    DollarSign,
    Package,
    Receipt,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';

interface MetricData {
    todaySales: number;
    todayProfit: number;
    todayOrdersCount: number;
    totalCustomerOutstanding: number;
}

interface ProductItem {
    id: number;
    name: string;
    quantity: number;
    min_stock_alert: number;
    unit?: { short_name: string };
    category?: { name: string };
}

interface OrderItem {
    id: number;
    order_number: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
    customer?: { name: string };
    payment_method?: { name: string };
}

interface DashboardProps {
    metrics: MetricData;
    lowStockProducts: ProductItem[];
    recentOrders: OrderItem[];
}

export default function Dashboard({ metrics, lowStockProducts, recentOrders }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Dashboard - Qadri General Store" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Hero POS Header Banner */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-xl text-white shadow-md">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Qadri General Store POS</h1>
                        <p className="text-sm text-slate-300 mt-1">
                            Real-time sales, inventory alerts, and store ledger metrics.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/pos">
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-lg hover:shadow-emerald-500/20">
                                <ShoppingCart className="h-5 w-5" />
                                Launch POS Terminal
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Key Financial Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rs. {Number(metrics.todaySales).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">{metrics.todayOrdersCount} orders processed today</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Profit</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">Rs. {Number(metrics.todayProfit).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Net profit after item cost</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Orders</CardTitle>
                            <Receipt className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.todayOrdersCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total completed transactions</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Customer Dues</CardTitle>
                            <Users className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">Rs. {Number(metrics.totalCustomerOutstanding).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total pending customer balances</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Dashboard Tables Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Low Stock Warning Card */}
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Low Stock Inventory Alerts
                            </CardTitle>
                            <Link href="/products">
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                    View All Products <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {lowStockProducts.length === 0 ? (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                    All inventory stock levels are healthy.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {lowStockProducts.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="font-medium text-sm">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.category?.name || 'General'}</p>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="destructive" className="font-semibold">
                                                    {Number(p.quantity)} {p.unit?.short_name || 'pc'}
                                                </Badge>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">Min Alert: {Number(p.min_stock_alert)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Orders Card */}
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Receipt className="h-5 w-5 text-indigo-500" />
                                Recent Transactions
                            </CardTitle>
                            <Link href="/orders">
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                    View Orders <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                    No sales transactions recorded yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {recentOrders.map((o) => (
                                        <div key={o.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{o.order_number}</span>
                                                    <Badge variant={o.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                                                        {o.payment_status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {o.customer?.name || 'Walk-in'} • {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-sm">Rs. {Number(o.total_amount).toLocaleString()}</span>
                                                <p className="text-[10px] text-muted-foreground">{o.payment_method?.name || 'Cash'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
