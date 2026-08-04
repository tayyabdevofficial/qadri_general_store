import { Head, Link } from '@inertiajs/react';

export default function Register() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <Head title="Registration" />
            <h1 className="text-xl font-bold">Public Registration Disabled</h1>
            <p className="text-sm text-muted-foreground mt-2">
                Public registration is disabled for Qadri General Store POS.
            </p>
            <Link href="/login" className="mt-4 text-xs font-semibold text-emerald-600 underline">
                Return to Login
            </Link>
        </div>
    );
}
