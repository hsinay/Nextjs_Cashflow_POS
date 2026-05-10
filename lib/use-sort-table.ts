import { useMemo, useState } from 'react';
import type { SortDirection } from '@/components/ui/sortable-table-head';

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc !== null && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function compareValues(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  let result = 0;
  if (typeof a === 'string' && typeof b === 'string') {
    result = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  } else if (a instanceof Date && b instanceof Date) {
    result = a.getTime() - b.getTime();
  } else if (typeof a === 'number' && typeof b === 'number') {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b));
  }
  return dir === 'asc' ? result : -result;
}

export function useSortTable<T>(data: T[]) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortField(null);
        setSortDir(null);
      }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortField || !sortDir) return data;
    return [...data].sort((a, b) =>
      compareValues(getNestedValue(a, sortField), getNestedValue(b, sortField), sortDir)
    );
  }, [data, sortField, sortDir]);

  return { sorted, sortField, sortDir, handleSort };
}
