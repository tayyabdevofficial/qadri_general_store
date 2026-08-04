import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Barcode,
    CreditCard,
    DollarSign,
    FolderTree,
    Gift,
    LayoutGrid,
    Package,
    Receipt,
    RotateCcw,
    Scale,
    Settings,
    ShoppingBag,
    ShoppingCart,
    Truck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'POS Terminal',
        href: '/pos',
        icon: ShoppingCart,
    },
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Package,
    },
    {
        title: 'Barcode Stickers',
        href: '/products/barcodes',
        icon: Barcode,
    },
    {
        title: 'Packages & Bundles',
        href: '/packages',
        icon: Gift,
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: FolderTree,
    },
    {
        title: 'Units',
        href: '/units',
        icon: Scale,
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: Users,
    },
    {
        title: 'Suppliers',
        href: '/suppliers',
        icon: Truck,
    },
    {
        title: 'Purchases (Stock-In)',
        href: '/purchases',
        icon: ShoppingBag,
    },
    {
        title: 'Orders & Receipts',
        href: '/orders',
        icon: Receipt,
    },
    {
        title: 'Sales Returns',
        href: '/returns',
        icon: RotateCcw,
    },
    {
        title: 'Expenses',
        href: '/expenses',
        icon: DollarSign,
    },
    {
        title: 'Payment Methods',
        href: '/payment-methods',
        icon: CreditCard,
    },
    {
        title: 'Financial Reports',
        href: '/reports',
        icon: BarChart3,
    },
    {
        title: 'Store Settings',
        href: '/settings/store',
        icon: Settings,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
