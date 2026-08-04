import { Head, Link } from '@inertiajs/react';

export default function ForgotPassword() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <Head title="Forgot Password" />
            <h1 className="text-xl font-bold">Password Reset Disabled</h1>
            <p className="text-sm text-muted-foreground mt-2">
                Password reset feature has been disabled. Please contact your store administrator.
            </p>
            <Link href="/login" className="mt-4 text-xs font-semibold text-emerald-600 underline">
                Return to Login
            </Link>
        </div>
    );
}
