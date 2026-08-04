import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T = any> {
    data: T[];
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    per_page?: number;
    links?: PaginatedLink[];
}

interface PaginationProps {
    data?: PaginatedData | null;
    className?: string;
}

export function Pagination({ data, className = '' }: PaginationProps) {
    if (!data || !data.links || data.links.length <= 1) {
        return null;
    }

    const { current_page, last_page, from, to, total, links } = data;

    // Clean up label html entities e.g. &laquo; Previous -> Previous
    const formatLabel = (label: string) => {
        if (label.includes('Previous') || label.includes('laquo')) {
            return <ChevronLeft className="h-4 w-4" />;
        }
        if (label.includes('Next') || label.includes('raquo')) {
            return <ChevronRight className="h-4 w-4" />;
        }
        return label;
    };

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-1 text-xs ${className}`}>
            <div className="text-muted-foreground">
                Showing <span className="font-bold text-foreground">{from ?? 0}</span> to{' '}
                <span className="font-bold text-foreground">{to ?? 0}</span> of{' '}
                <span className="font-bold text-foreground">{total ?? 0}</span> results
            </div>

            {links.length > 3 && (
                <div className="flex items-center gap-1 flex-wrap justify-center">
                    {links.map((link, index) => {
                        const isNavButton = link.label.includes('Previous') || link.label.includes('Next') || link.label.includes('laquo') || link.label.includes('raquo');

                        if (!link.url) {
                            return (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="h-8 px-2.5 text-xs opacity-50 cursor-not-allowed"
                                >
                                    {formatLabel(link.label)}
                                </Button>
                            );
                        }

                        return (
                            <Button
                                key={index}
                                asChild
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                className={`h-8 text-xs font-semibold ${
                                    link.active
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : isNavButton
                                        ? 'px-2.5'
                                        : 'min-w-[32px] px-2'
                                }`}
                            >
                                <Link href={link.url} preserveScroll preserveState>
                                    {formatLabel(link.label)}
                                </Link>
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Pagination;
