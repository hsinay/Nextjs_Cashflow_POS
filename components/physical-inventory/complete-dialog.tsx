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
import { CheckCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface CompleteDialogProps {
  piId: string;
}

export function CompleteDialog({ piId }: CompleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/physical-inventory/${piId}/complete`,
        {
          method: 'PATCH',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete physical inventory');
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
        <Button className="bg-green-600 hover:bg-green-700">
          <CheckCheck className="h-4 w-4 mr-2" />
          Complete Count
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Physical Count</DialogTitle>
          <DialogDescription>
            This will finalize the physical count and generate the variance
            report. The count cannot be modified after completion.
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
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLoading ? 'Completing...' : 'Complete Count'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
