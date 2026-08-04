import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Pagination, { PaginatedData } from '@/components/pagination';
import { Edit, FolderTree, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
    slug: string;
    status: string;
    products_count?: number;
}

interface CategoriesProps {
    categories: PaginatedData<Category>;
    filters?: {
        search?: string;
    };
}

export default function CategoriesIndex({ categories, filters }: CategoriesProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const categoryList = categories.data || [];

    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/categories', { search: val }, { preserveState: true, replace: true });
    };

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        status: 'active',
    });

    const filteredCategories = categoryList.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenCreate = () => {
        setEditingCat(null);
        reset();
        setIsOpen(true);
    };

    const handleOpenEdit = (cat: Category) => {
        setEditingCat(cat);
        setData({
            name: cat.name,
            status: cat.status,
        });
        setIsOpen(true);
    };

    const handleToggleStatus = (cat: Category) => {
        const nextStatus = cat.status === 'active' ? 'inactive' : 'active';
        router.put(
            `/categories/${cat.id}`,
            { name: cat.name, status: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextStatus === 'active'
                            ? `Category "${cat.name}" enabled (Visible on POS)`
                            : `Category "${cat.name}" disabled (Hidden from POS)`
                    );
                },
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCat) {
            put(`/categories/${editingCat.id}`, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Category updated successfully!');
                },
            });
        } else {
            post('/categories', {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Category created successfully!');
                },
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/categories/${deleteTargetId}`, {
            onSuccess: () => {
                toast.success('Category deleted successfully!');
                setDeleteTargetId(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Cannot delete category containing products.';
                toast.error(msg);
                setDeleteTargetId(null);
            },
        });
    };

    const exportColumns = [
        { header: 'Category Name', key: 'name' },
        { header: 'Slug', key: 'slug' },
        { header: 'Status', key: 'status' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
            <Head title="Categories - Qadri General Store" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Categories Management</h1>
                        <p className="text-xs text-muted-foreground">Manage product categories for POS item grouping & visibility.</p>
                    </div>
                    <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <Plus className="h-4 w-4" /> Add Category
                    </Button>
                </div>

                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <DataTableToolbar
                            title="Product Categories Report"
                            search={search}
                            onSearchChange={handleSearchChange}
                            columns={exportColumns}
                            data={categoryList}
                            placeholder="Search categories..."
                        />

                        <div className="relative overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-[10px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Category Name</th>
                                        <th className="p-3">Slug</th>
                                        <th className="p-3 text-center">POS Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {categoryList.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                                No categories found.
                                            </td>
                                        </tr>
                                    ) : (
                                        categoryList.map((cat) => (
                                            <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-semibold flex items-center gap-2">
                                                    <FolderTree className="h-4 w-4 text-emerald-600" />
                                                    {cat.name}
                                                </td>
                                                <td className="p-3 font-mono text-[11px] text-muted-foreground">{cat.slug}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(cat)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                            cat.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${cat.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                                        {cat.status === 'active' ? 'Active' : 'Disabled (Hidden)'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(cat)} className="h-7 w-7">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(cat.id)} className="h-7 w-7 text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination data={categories} />
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-sm p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">{editingCat ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Category Name *</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Groceries & Pulses"
                                className="text-xs"
                            />
                            {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">POS Status *</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-bold"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            >
                                <option value="active">Active (Visible on POS)</option>
                                <option value="inactive">Disabled (Hidden from POS)</option>
                            </select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Save Category
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Custom Confirm Delete Modal */}
            <ConfirmDeleteDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Delete Category"
                description="Are you sure you want to delete this category? Products assigned to it will remain intact."
            />
        </AppLayout>
    );
}
