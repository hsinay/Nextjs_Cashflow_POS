'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { usePOSSession } from '@/hooks/use-pos-session';
import { formatCurrency } from '@/lib/utils';
import { POSSessionWithRelations } from '@/types/pos-session.types';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SessionCloserProps {
  session: POSSessionWithRelations;
  onSessionClosed?: () => void;
}

export function SessionCloser({ session, onSessionClosed }: SessionCloserProps) {
  const [closingCash, setClosingCash] = useState('0.00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeSession } = usePOSSession();
  const { toast } = useToast();

  const expectedCash = Number(session.openingCashAmount) + Number(session.totalCashReceived);
  const closingNum = parseFloat(closingCash);
  const variance = closingNum - expectedCash;

  const handleCloseSession = async () => {
    try {
      setIsSubmitting(true);

      if (isNaN(closingNum) || closingNum < 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid closing cash amount',
          variant: 'destructive',
        });
        return;
      }

      await closeSession(closingNum, notes || undefined);

      toast({
        title: 'Session Closed',
        description: `POS session closed successfully. Variance: ${formatCurrency(variance)}`,
      });

      // Reset form
      setClosingCash('0.00');
      setNotes('');
      onSessionClosed?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: error.message || 'Failed to close session',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Close Session</h3>

      {/* Summary Info */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <p className="text-xs text-gray-500">Opening Cash</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(Number(session.openingCashAmount))}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Cash Received</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(Number(session.totalCashReceived))}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Expected Cash</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(expectedCash)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-lg font-bold text-gray-900">{session.totalTransactions}</p>
        </div>
      </div>

      {/* Variance Alert */}
      {closingNum > 0 && (
        <Alert
          variant={Math.abs(variance) > 100 ? 'destructive' : variance > 0 ? 'default' : 'default'}
          className={
            Math.abs(variance) > 100
              ? 'bg-red-50 border-red-200'
              : variance > 0
                ? 'bg-green-50 border-green-200'
                : variance < 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
          }
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {variance === 0
              ? 'Perfect! No variance detected.'
              : variance > 0
                ? `Excess cash: ${formatCurrency(variance)}`
                : `Short cash: ${formatCurrency(Math.abs(variance))}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="closing-cash" className="text-sm font-medium text-gray-700">
            Actual Closing Cash
          </Label>
          <Input
            id="closing-cash"
            type="number"
            placeholder="0.00"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            disabled={isSubmitting}
            step="0.01"
            min="0"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any notes about this session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      <Button
        onClick={handleCloseSession}
        disabled={isSubmitting || closingNum <= 0}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Closing Session...
          </>
        ) : (
          'Close Session'
        )}
      </Button>
    </div>
  );
}
