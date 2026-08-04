import { Head, Link } from '@inertiajs/react';

export default function ResetPassword() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <Head title="Reset Password" />
            <h1 className="text-xl font-bold">Password Reset Disabled</h1>
            <p className="text-sm text-muted-foreground mt-2">
                Password reset feature is disabled for this system.
            </p>
            <Link href="/login" className="mt-4 text-xs font-semibold text-emerald-600 underline">
                Return to Login
            </Link>
        </div>
    );
}
