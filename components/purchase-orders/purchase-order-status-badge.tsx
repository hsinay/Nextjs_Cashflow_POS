// components/purchase-orders/purchase-order-status-badge.tsx

import { Badge } from '@/components/ui/badge';
import { PurchaseOrder } from '@/types/purchase-order.types';

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrder['status'];
}

export function PurchaseOrderStatusBadge({ status }: PurchaseOrderStatusBadgeProps) {
  const statusStyles: Record<PurchaseOrder['status'], string> = {
    DRAFT: 'bg-gray-200 text-gray-800 hover:bg-gray-200',
    CONFIRMED: 'bg-blue-200 text-blue-800 hover:bg-blue-200',
    PARTIALLY_RECEIVED: 'bg-yellow-200 text-yellow-800 hover:bg-yellow-200',
    RECEIVED: 'bg-green-200 text-green-800 hover:bg-green-200',
    CANCELLED: 'bg-red-200 text-red-800 hover:bg-red-200',
  };

  return <Badge className={statusStyles[status]}>{status.replace('_', ' ')}</Badge>;
}
