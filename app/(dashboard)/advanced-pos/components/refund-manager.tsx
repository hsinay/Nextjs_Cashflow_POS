'use client';

import { EnhancedButton, H2, Small } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';
import { Colors } from '@/lib/design-tokens';
import { formatCurrency } from '@/lib/utils';
import { Refund } from '@/types/advanced-pos.types';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

interface RefundManagerProps {
  refund: Refund;
  onApprove?: (refundId: string, notes?: string) => Promise<void>;
  onReject?: (refundId: string, notes?: string) => Promise<void>;
  isAdmin?: boolean;
}

export function RefundManager({
  refund,
  onApprove,
  onReject,
  isAdmin = false,
}: RefundManagerProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const getStatusBgColor = (status: string) => {
    if (status === 'APPROVED') return 'rgba(16, 185, 129, 0.1)';
    if (status === 'REJECTED') return 'rgba(239, 68, 68, 0.1)';
    if (status === 'PROCESSED') return 'rgba(102, 126, 234, 0.1)';
    return 'rgba(245, 158, 11, 0.1)';
  };

  const getStatusTextColor = (status: string) => {
    if (status === 'APPROVED') return Colors.success;
    if (status === 'REJECTED') return Colors.danger;
    if (status === 'PROCESSED') return Colors.primary.start;
    return Colors.warning;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'REJECTED') return <XCircle className="w-4 h-4" />;
    if (status === 'PROCESSED') return <CheckCircle2 className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (onApprove) {
        await onApprove(refund.id, notes);
        toast({
          title: 'Success',
          description: 'Refund approved',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (onReject) {
        await onReject(refund.id, notes);
        toast({
          title: 'Success',
          description: 'Refund rejected',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject refund';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="border rounded-lg p-6 max-w-2xl"
      style={{
        backgroundColor: 'white',
        borderColor: Colors.gray[200],
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <H2>Refund Request</H2>
          <Small className="mt-1 block">ID: {refund.id}</Small>
        </div>
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: getStatusBgColor(refund.status),
            color: getStatusTextColor(refund.status),
          }}
        >
          {getStatusIcon(refund.status)}
          {refund.status}
        </div>
      </div>

      {/* Details Grid */}
      <div
        className="grid grid-cols-2 gap-4 mb-6 pb-6"
        style={{
          borderBottom: `1px solid ${Colors.gray[200]}`,
        }}
      >
        <div>
          <Small style={{ color: Colors.text.secondary }}>Transaction ID</Small>
          <p
            className="font-semibold mt-1"
            style={{ color: Colors.text.primary }}
          >
            {refund.transactionId}
          </p>
        </div>
        <div>
          <Small style={{ color: Colors.text.secondary }}>Refund Reason</Small>
          <p
            className="font-semibold mt-1"
            style={{ color: Colors.text.primary }}
          >
            {refund.reason.replace(/_/g, ' ')}
          </p>
        </div>
        <div>
          <Small style={{ color: Colors.text.secondary }}>Original Amount</Small>
          <p
            className="font-semibold mt-1"
            style={{ color: Colors.text.primary }}
          >
            {formatCurrency(refund.originalAmount)}
          </p>
        </div>
        <div>
          <Small style={{ color: Colors.text.secondary }}>Refund Amount</Small>
          <p
            className="font-bold mt-1"
            style={{ color: Colors.danger }}
          >
            {formatCurrency(refund.refundAmount)}
          </p>
        </div>
        <div>
          <Small style={{ color: Colors.text.secondary }}>Requested At</Small>
          <p
            className="font-semibold mt-1"
            style={{ color: Colors.text.primary }}
          >
            {new Date(refund.requestedAt).toLocaleString()}
          </p>
        </div>
        <div>
          <Small style={{ color: Colors.text.secondary }}>Payment Method</Small>
          <p
            className="font-semibold mt-1"
            style={{ color: Colors.text.primary }}
          >
            {refund.paymentMethod}
          </p>
        </div>
      </div>

      {/* Notes */}
      {refund.notes && (
        <div
          className="mb-6 pb-6"
          style={{
            borderBottom: `1px solid ${Colors.gray[200]}`,
          }}
        >
          <Small style={{ color: Colors.text.secondary }}>Customer Notes</Small>
          <p
            className="mt-2 p-3 rounded border"
            style={{
              backgroundColor: Colors.gray[50],
              borderColor: Colors.gray[200],
              color: Colors.text.primary,
            }}
          >
            {refund.notes}
          </p>
        </div>
      )}

      {/* Approval Timeline */}
      {refund.approvedAt && (
        <div
          className="mb-6 pb-6"
          style={{
            borderBottom: `1px solid ${Colors.gray[200]}`,
          }}
        >
          <Small className="font-semibold block">Approval Timeline</Small>
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span style={{ color: Colors.text.secondary }}>Requested:</span>
              <span className="ml-2" style={{ color: Colors.text.primary }}>
                {new Date(refund.requestedAt).toLocaleString()}
              </span>
            </div>
            {refund.approvedAt && (
              <div>
                <span style={{ color: Colors.text.secondary }}>Approved:</span>
                <span className="ml-2" style={{ color: Colors.text.primary }}>
                  {new Date(refund.approvedAt).toLocaleString()}
                </span>
                {refund.approvedBy && (
                  <span className="ml-2" style={{ color: Colors.text.secondary }}>
                    by {refund.approvedBy}
                  </span>
                )}
              </div>
            )}
            {refund.processedAt && (
              <div>
                <span style={{ color: Colors.text.secondary }}>Processed:</span>
                <span className="ml-2" style={{ color: Colors.text.primary }}>
                  {new Date(refund.processedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Section */}
      {isAdmin && refund.status === 'PENDING' && (
        <div className="space-y-4">
          <div>
            <label
              className="block font-semibold mb-2"
              style={{
                fontSize: '12px',
                color: Colors.text.primary,
              }}
            >
              Admin Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this refund decision..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
              style={{
                border: `1px solid ${Colors.gray[300]}`,
                color: Colors.text.primary,
                outline: `2px solid ${Colors.primary.start}`,
              }}
            />
          </div>
          <div className="flex gap-3">
            <EnhancedButton
              onClick={handleApprove}
              disabled={loading}
              isLoading={loading}
              variant="primary"
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Refund
            </EnhancedButton>
            <EnhancedButton
              onClick={handleReject}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Refund
            </EnhancedButton>
          </div>
        </div>
      )}

      {/* Status Info */}
      {refund.status !== 'PENDING' && (
        <div
          className="p-4 rounded-lg flex gap-3"
          style={{
            backgroundColor: getStatusBgColor(refund.status),
            color: getStatusTextColor(refund.status),
          }}
        >
          {getStatusIcon(refund.status)}
          <div>
            <p className="font-semibold">
              {refund.status === 'APPROVED'
                ? 'Refund Approved'
                : refund.status === 'REJECTED'
                  ? 'Refund Rejected'
                  : 'Refund Processed'}
            </p>
            {refund.approvedAt && (
              <p className="text-sm mt-1">
                {new Date(refund.approvedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
