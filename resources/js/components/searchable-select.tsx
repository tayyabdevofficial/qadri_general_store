import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number;
    onChange: (val: string | number) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    searchPlaceholder = 'Search options...',
    className,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between text-xs font-normal h-9 bg-background px-3 border border-input shadow-xs"
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
                    <div className="flex items-center border-b px-2 py-1.5 bg-muted/50">
                        <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-7 border-none bg-transparent text-xs focus-visible:ring-0 shadow-none"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 text-xs">
                        {filteredOptions.length === 0 ? (
                            <p className="p-2 text-center text-muted-foreground text-xs">No matching options found.</p>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={cn(
                                            'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground',
                                            isSelected && 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-3.5 w-3.5 text-emerald-600',
                                                isSelected ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {opt.label}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
