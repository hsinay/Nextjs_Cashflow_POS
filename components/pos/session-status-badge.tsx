'use client';

import { Badge } from '@/components/ui/badge';
import { POSSessionStatus } from '@prisma/client';

interface SessionStatusBadgeProps {
  status: POSSessionStatus;
}

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const getStatusColor = (status: POSSessionStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border`}>
      {status}
    </Badge>
  );
}
