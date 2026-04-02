'use client';

import { QuickPaymentModal } from '@/components/sales-orders/quick-payment-modal';
import { useState } from 'react';

interface QuickPaymentButtonProps {
  order: any;
}

export function QuickPaymentButton({ order }: QuickPaymentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        Record Payment
      </button>
      <QuickPaymentModal open={open} onOpenChange={setOpen} salesOrder={order} customerId={order.customerId} />
    </>
  );
}
