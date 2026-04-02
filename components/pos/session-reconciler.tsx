'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ReconciliationData {
  sessionId: string;
  expectedCash: string;
  actualCash: string;
  variance: string;
  variancePercentage: number;
  status: 'BALANCED' | 'OVERAGE' | 'SHORTAGE';
  reconciled: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
  notes?: string;
}

interface SessionReconcilerProps {
  sessionId: string;
  sessionStatus: 'OPEN' | 'CLOSED';
}

export function SessionReconciler({ sessionId, sessionStatus }: SessionReconcilerProps) {
  const { toast } = useToast();
  const [reconciliation, setReconciliation] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchReconciliation = async () => {
      if (sessionStatus !== 'CLOSED') {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/pos-sessions/${sessionId}/reconcile`);
        if (!res.ok) throw new Error('Failed to fetch reconciliation');
        const data = await res.json();
        setReconciliation(data.data);
        if (data.data.notes) setNotes(data.data.notes);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reconciliation';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReconciliation();
  }, [sessionId, sessionStatus]);

  const handleReconcile = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/pos-sessions/${sessionId}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error('Failed to reconcile');

      toast({
        title: 'Success',
        description: 'Session has been reconciled.',
      });

      // Refresh reconciliation data
      const recon = await fetch(`/api/pos-sessions/${sessionId}/reconcile`);
      const data = await recon.json();
      setReconciliation(data.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reconcile';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionStatus !== 'CLOSED') {
    return (
      <Card className="p-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          Session must be closed before reconciliation. Close the session first.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </Card>
    );
  }

  if (!reconciliation) {
    return null;
  }

  const statusConfig = {
    BALANCED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Balanced',
    },
    OVERAGE: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      label: 'Overage',
    },
    SHORTAGE: {
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Shortage',
    },
  };

  const config = statusConfig[reconciliation.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      <Card className={`p-6 border ${config.border} ${config.bg}`}>
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <StatusIcon className={`w-5 h-5 ${config.color}`} />
              <h3 className="text-lg font-semibold">Reconciliation Status</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Expected Cash</p>
                <p className="text-xl font-bold">
                  {formatCurrency(Number(reconciliation.expectedCash))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Actual Cash</p>
                <p className="text-xl font-bold">
                  {formatCurrency(Number(reconciliation.actualCash))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Variance</p>
                <p className={`text-xl font-bold ${config.color}`}>
                  {Number(reconciliation.variance) > 0 ? '+' : ''}
                  {formatCurrency(Number(reconciliation.variance))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Variance %</p>
                <p className={`text-xl font-bold ${config.color}`}>
                  {reconciliation.variancePercentage.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-white border">
              <span className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {reconciliation.reconciled ? (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Reconciliation Completed</p>
              <p className="text-sm text-green-700 mt-1">
                Reconciled on{' '}
                {reconciliation.reconciledAt &&
                  new Date(reconciliation.reconciledAt).toLocaleString()}
              </p>
              {reconciliation.notes && (
                <p className="text-sm text-green-700 mt-2 italic">
                  Notes: {reconciliation.notes}
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Reconciliation Notes (Optional)
            </label>
            <Textarea
              placeholder="Add any notes about this reconciliation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
            />
          </div>
          <Button
            onClick={handleReconcile}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reconciling...
              </>
            ) : (
              'Mark as Reconciled'
            )}
          </Button>
        </Card>
      )}
    </div>
  );
}
