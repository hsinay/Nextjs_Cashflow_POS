// components/customers/order-payment-history.tsx

'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

interface OrderPaymentHistoryProps {
  orderId: string;
  payments?: Payment[];
  onPaymentDeleted?: () => void;
  canDelete?: boolean;
}

export function OrderPaymentHistory({
  orderId,
  payments = [],
  onPaymentDeleted,
  canDelete = false,
}: OrderPaymentHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    setDeletingId(paymentId);
    try {
      const response = await fetch(`/api/orders/${orderId}/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }

      onPaymentDeleted?.();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };



  const formatPaymentMethod = (method: string) => {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        No payments recorded yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Payment Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Notes</TableHead>
            {canDelete && <TableHead>Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-slate-50">
              <TableCell className="font-medium">
                {formatDate(payment.paymentDate)}
              </TableCell>
              <TableCell className="font-semibold text-green-600">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {formatPaymentMethod(payment.paymentMethod)}
                </span>
              </TableCell>
              <TableCell className="text-slate-600 text-sm">
                {payment.referenceNumber || '-'}
              </TableCell>
              <TableCell className="text-slate-600 text-sm max-w-xs truncate">
                {payment.notes || '-'}
              </TableCell>
              {canDelete && (
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(payment.id)}
                    disabled={deletingId === payment.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
