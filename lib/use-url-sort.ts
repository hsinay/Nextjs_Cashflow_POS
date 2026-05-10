'use client';

import type { SortDirection } from '@/components/ui/sortable-table-head';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useUrlSort() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortField = searchParams.get('sortField') || null;
  const sortDir = (searchParams.get('sortDir') as SortDirection) || null;

  const handleSort = useCallback(
    (field: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (sortField === field) {
        if (sortDir === 'asc') {
          params.set('sortDir', 'desc');
        } else {
          params.delete('sortField');
          params.delete('sortDir');
        }
      } else {
        params.set('sortField', field);
        params.set('sortDir', 'asc');
      }

      // Reset to first page whenever sort changes
      params.set('page', '1');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, sortField, sortDir]
  );

  return { sortField, sortDir, handleSort };
}
