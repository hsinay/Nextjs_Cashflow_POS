'use client';

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    DRAFT: { label: 'Draft', variant: 'secondary' },
    CONFIRMED: { label: 'Confirmed', variant: 'outline' },
    DONE: { label: 'Complete', variant: 'default' },
    CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
