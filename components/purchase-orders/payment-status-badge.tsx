'use client';

import { Badge } from '@/components/ui/badge';
import { POPaymentStatus } from '@prisma/client';

interface PaymentStatusBadgeProps {
  status: POPaymentStatus;
  className?: string;
}

const statusConfig: Record<POPaymentStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  PARTIALLY_PAID: { label: 'Partially Paid', color: 'bg-blue-100 text-blue-800' },
  FULLY_PAID: { label: 'Fully Paid', color: 'bg-green-100 text-green-800' },
  OVERPAID: { label: 'Overpaid', color: 'bg-purple-100 text-purple-800' },
};

export function PaymentStatusBadge({
  status,
  className = '',
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={`${config.color} ${className}`}>
      {config.label}
    </Badge>
  );
}
