'use client';

import { Colors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  className?: string;
}

const statusConfig: Record<string, { light: string; dark: string; text: string }> = {
  PAID: {
    light: Colors.status.paid.light,
    dark: Colors.status.paid.dark,
    text: 'Paid',
  },
  PENDING: {
    light: Colors.status.pending.light,
    dark: Colors.status.pending.dark,
    text: 'Pending',
  },
  OVERDUE: {
    light: Colors.status.overdue.light,
    dark: Colors.status.overdue.dark,
    text: 'Overdue',
  },
  OPEN: {
    light: Colors.status.pending.light,
    dark: Colors.status.pending.dark,
    text: 'Open',
  },
  IN_PROGRESS: {
    light: Colors.status.pending.light,
    dark: Colors.status.pending.dark,
    text: 'In Progress',
  },
  CLOSED: {
    light: Colors.status.paid.light,
    dark: Colors.status.paid.dark,
    text: 'Closed',
  },
  APPROVED: {
    light: Colors.status.paid.light,
    dark: Colors.status.paid.dark,
    text: 'Approved',
  },
  REJECTED: {
    light: Colors.status.overdue.light,
    dark: Colors.status.overdue.dark,
    text: 'Rejected',
  },
  PROCESSED: {
    light: Colors.status.paid.light,
    dark: Colors.status.paid.dark,
    text: 'Processed',
  },
};

/**
 * StatusBadge Component
 * 
 * A reusable, semantic status indicator using the design system's status colors.
 * 
 * @example
 * <StatusBadge status="PAID" />
 * <StatusBadge status="PENDING" className="custom-class" />
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-small font-semibold uppercase transition-colors',
        className
      )}
      style={{
        backgroundColor: config.light,
        color: config.dark,
      }}
    >
      {config.text}
    </span>
  );
}

StatusBadge.displayName = 'StatusBadge';
