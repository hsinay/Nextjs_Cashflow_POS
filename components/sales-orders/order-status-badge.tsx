// components/sales-orders/order-status-badge.tsx

import { Badge } from '@/components/ui/badge';
import { SalesOrder } from '@/types/sales-order.types';

interface OrderStatusBadgeProps {
  status: SalesOrder['status'];
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusStyles: Record<SalesOrder['status'], string> = {
    DRAFT: 'bg-gray-200 text-gray-800 hover:bg-gray-200',
    CONFIRMED: 'bg-blue-200 text-blue-800 hover:bg-blue-200',
    PARTIALLY_PAID: 'bg-yellow-200 text-yellow-800 hover:bg-yellow-200',
    PAID: 'bg-green-200 text-green-800 hover:bg-green-200',
    CANCELLED: 'bg-red-200 text-red-800 hover:bg-red-200',
  };

  return <Badge className={statusStyles[status]}>{status.replace('_', ' ')}</Badge>;
}
