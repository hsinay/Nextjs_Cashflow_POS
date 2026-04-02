'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ConfirmDialogProps {
  piId: string;
}

export function ConfirmDialog({ piId }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/physical-inventory/${piId}/confirm`,
        {
          method: 'PATCH',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to confirm physical inventory');
      }

      setOpen(false);
      // Refresh page to show updated status
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Confirm Count
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Physical Count</DialogTitle>
          <DialogDescription>
            Once confirmed, the count cannot be modified. This action is
            irreversible.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLoading ? 'Confirming...' : 'Confirm Count'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
