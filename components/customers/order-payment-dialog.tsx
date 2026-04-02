// components/customers/order-payment-dialog.tsx

'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { DollarSign } from 'lucide-react';
import { useState } from 'react';
import { OrderPaymentForm } from './order-payment-form';

interface OrderPaymentDialogProps {
  orderId: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  onPaymentSuccess?: () => void;
  disabled?: boolean;
}

export function OrderPaymentDialog({
  orderId,
  customerId,
  totalAmount,
  paidAmount,
  balanceAmount,
  paymentStatus,
  onPaymentSuccess,
  disabled = false,
}: OrderPaymentDialogProps) {
  const [open, setOpen] = useState(false);

  const isFullyPaid = paymentStatus === 'PAID';

  const handleSuccess = () => {
    setOpen(false);
    onPaymentSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isFullyPaid || disabled}
          variant={isFullyPaid ? 'outline' : 'default'}
          size="sm"
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {isFullyPaid ? 'Paid' : 'Record Payment'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for this order
          </DialogDescription>
        </DialogHeader>
        <OrderPaymentForm
          orderId={orderId}
          customerId={customerId}
          totalAmount={totalAmount}
          paidAmount={paidAmount}
          balanceAmount={balanceAmount}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
