'use client';

import { formatDate, formatDateTimeLocale } from '@/lib/utils';

interface DateRendererProps {
  date: string | Date | null | undefined;
  format?: 'date' | 'datetime';
  fallback?: string;
}

/**
 * Client-side date renderer to prevent hydration mismatches
 * Ensures dates are formatted only on the client side where timezone is consistent
 */
export function DateRenderer({
  date,
  format = 'date',
  fallback = '',
}: DateRendererProps) {
  if (!date) return <>{fallback}</>;

  return (
    <>
      {format === 'datetime'
        ? formatDateTimeLocale(date)
        : formatDate(date)}
    </>
  );
}
