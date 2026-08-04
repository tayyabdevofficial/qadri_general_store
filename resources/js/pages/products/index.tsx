import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { Barcode, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
    id: number;
    name: string;
    barcode: string;
    product_type: 'simple' | 'variant';
    buy_price: number;
    sell_price: number;
    quantity: number;
    min_stock_alert: number;
    status: string;
    image_url?: string;
    category?: { name: string };
    unit?: { short_name: string };
    variants?: any[];
}

interface ProductsProps {
    products: PaginatedData<Product>;
    categories: any[];
    units: any[];
    filters: {
        search?: string;
        category_id?: string;
        status?: string;
    };
}

export default function ProductsIndex({ products, categories, units, filters }: ProductsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/products', { search: val, status: statusFilter }, { preserveState: true, replace: true });
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        router.get('/products', { search, status: newStatus }, { preserveState: true, replace: true });
    };

    const handleToggleStatus = (product: Product) => {
        const nextStatus = product.status === 'active' ? 'inactive' : 'active';
        router.patch(
            `/products/${product.id}/status`,
            { status: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextStatus === 'active'
                            ? `"${product.name}" enabled & visible on POS!`
                            : `"${product.name}" disabled & hidden from POS!`
                    );
                },
            }
        );
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/products/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Product deleted successfully!');
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Product Name', key: 'name' },
        { header: 'Barcode', key: 'barcode' },
        { header: 'Category', key: 'category', formatter: (val: any) => val?.name || 'N/A' },
        { header: 'Type', key: 'product_type' },
        { header: 'Buy Price (Rs.)', key: 'buy_price', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Sell Price (Rs.)', key: 'sell_price', formatter: (val: any) => Number(val).toFixed(2) },
        { header: 'Stock Qty', key: 'quantity', formatter: (val: any, row: any) => `${Number(val)} ${row.unit?.short_name || ''}` },
        { header: 'Status', key: 'status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }]}>
            <Head title="Products - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Products Management</h1>
                        <p className="text-xs text-muted-foreground">Manage store inventory, prices, simple/variant items, status & barcodes.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/products/barcodes">
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <Barcode className="h-4 w-4" /> Barcode Stickers
                            </Button>
                        </Link>
                        <Link href="/products/create">
                            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="h-4 w-4" /> Add Product
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex-1">
                                <DataTableToolbar
                                    title="Products Inventory Report"
                                    search={search}
                                    onSearchChange={handleSearchChange}
                                    columns={exportColumns}
                                    data={products.data}
                                    placeholder="Search products by name or barcode..."
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                                    className="h-8 text-xs rounded-md border border-input bg-background px-2.5 shadow-xs font-medium"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Disabled Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Product</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Barcode</th>
                                        <th className="p-3 text-right">Buy Price</th>
                                        <th className="p-3 text-right">Sell Price</th>
                                        <th className="p-3 text-center">Stock</th>
                                        <th className="p-3 text-center">POS Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {products.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                                No products found.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.data.map((product) => (
                                            <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover border" />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                                IMG
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="block font-medium">{product.name}</span>
                                                            <span className="text-[10px] text-muted-foreground capitalize">
                                                                Type: {product.product_type} {product.variants?.length ? `(${product.variants.length} variants)` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{product.category?.name || 'General'}</td>
                                                <td className="p-3 font-mono text-[11px]">{product.barcode || 'N/A'}</td>
                                                <td className="p-3 text-right font-medium">
                                                    {product.product_type === 'simple' ? `Rs. ${Number(product.buy_price).toFixed(2)}` : 'Variant'}
                                                </td>
                                                <td className="p-3 text-right font-bold text-emerald-600">
                                                    {product.product_type === 'simple' ? `Rs. ${Number(product.sell_price).toFixed(2)}` : 'Variant'}
                                                </td>
                                                <td className="p-3 text-center font-bold">
                                                    {product.product_type === 'simple' ? (
                                                        <Badge variant={Number(product.quantity) <= Number(product.min_stock_alert) ? 'destructive' : 'outline'}>
                                                            {Number(product.quantity)} {product.unit?.short_name}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Variants</Badge>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(product)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                            product.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${product.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                        {product.status === 'active' ? 'Active' : 'Disabled (Hidden)'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    <Link href={`/products/${product.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTargetId(product.id)}
                                                        className="h-7 w-7 text-red-500 hover:text-red-700"
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

                        <Pagination data={products} />
                    </CardContent>
                </Card>
            </div>

            {/* Custom UI Delete Confirmation Modal */}
            <ConfirmDeleteDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Delete Product"
                description="Are you sure you want to delete this product? All stock records and barcode details associated with it will be removed."
            />
        </AppLayout>
    );
}
