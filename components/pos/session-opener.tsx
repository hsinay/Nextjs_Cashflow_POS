'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { usePOSSession } from '@/hooks/use-pos-session';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SessionOpenerProps {
  onSessionOpened?: () => void;
}

export function SessionOpener({ onSessionOpened }: SessionOpenerProps) {
  const [openingCash, setOpeningCash] = useState('0.00');
  const [terminalId, setTerminalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSession } = usePOSSession();
  const { toast } = useToast();

  const handleOpenSession = async () => {
    try {
      setIsSubmitting(true);
      const amount = parseFloat(openingCash);

      if (isNaN(amount) || amount < 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid opening cash amount',
          variant: 'destructive',
        });
        return;
      }

      await createSession(amount, terminalId || undefined);

      toast({
        title: 'Session Opened',
        description: `POS session opened with ${formatCurrency(amount)}`,
      });

      // Reset form
      setOpeningCash('0.00');
      setTerminalId('');
      onSessionOpened?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: error.message || 'Failed to open session',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Open New Session</h3>

      <div className="space-y-3">
        <div>
          <Label htmlFor="opening-cash" className="text-sm font-medium text-gray-700">
            Opening Cash Balance
          </Label>
          <Input
            id="opening-cash"
            type="number"
            placeholder="0.00"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            disabled={isSubmitting}
            step="0.01"
            min="0"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="terminal-id" className="text-sm font-medium text-gray-700">
            Terminal ID (Optional)
          </Label>
          <Input
            id="terminal-id"
            type="text"
            placeholder="e.g., POS-01"
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            disabled={isSubmitting}
            className="mt-1"
          />
        </div>
      </div>

      <Button
        onClick={handleOpenSession}
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Opening Session...
          </>
        ) : (
          'Open Session'
        )}
      </Button>
    </div>
  );
}
