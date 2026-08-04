import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-2.5">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg overflow-hidden border border-emerald-600/30 bg-white p-0.5 shadow-xs">
                <AppLogoIcon className="size-full object-contain" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-slate-900 dark:text-white">
                    {name || 'Qadri General Store'}
                </span>
                <span className="truncate text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    POS System
                </span>
            </div>
        </div>
    );
}
