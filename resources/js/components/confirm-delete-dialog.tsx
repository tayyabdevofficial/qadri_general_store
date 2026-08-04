import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    loading?: boolean;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    title = 'Confirm Deletion',
    description = 'Are you sure you want to delete this record? This action cannot be undone.',
    loading = false,
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-6">
                <DialogHeader className="flex flex-col items-center sm:items-start gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-bold">{title}</DialogTitle>
                        <DialogDescription className="text-xs mt-1 text-muted-foreground">
                            {description}
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        disabled={loading}
                        className="text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
