'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Payment } from '@prisma/client';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PaymentHistoryProps {
  payments: Payment[];
  purchaseOrderId: string;
  onPaymentRemoved?: (paymentId: string) => void;
  isLoading?: boolean;
}

export function PaymentHistory({
  payments,
  purchaseOrderId,
  onPaymentRemoved,
  isLoading = false,
}: PaymentHistoryProps) {
  const [removing, setRemoving] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemovePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to unlink this payment?')) {
      return;
    }

    setRemoving(paymentId);
    try {
      const response = await fetch(
        `/api/purchase-orders/${purchaseOrderId}/payments`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unlink payment');
      }

      toast({
        title: 'Success',
        description: 'Payment unlinked successfully',
      });

      onPaymentRemoved?.(paymentId);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to unlink payment',
        variant: 'destructive',
      });
    } finally {
      setRemoving(null);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading payments...</div>;
  }

  if (payments.length === 0) {
    return <div className="text-center text-gray-500">No payments linked yet</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Payment ID</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-sm">
                {payment.id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {payment.paymentMethod}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(Number(payment.amount))}
              </TableCell>
              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
              <TableCell>
                <Badge 
                  variant={payment.status === 'COMPLETED' ? 'default' : 'outline'}
                >
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePayment(payment.id)}
                  disabled={removing === payment.id}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
