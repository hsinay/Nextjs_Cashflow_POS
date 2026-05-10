'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { TableHead } from './table';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeadProps {
  field: string;
  sortField: string | null;
  sortDir: SortDirection;
  onSort: (field: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function SortableTableHead({
  field,
  sortField,
  sortDir,
  onSort,
  className,
  children,
}: SortableTableHeadProps) {
  const isActive = sortField === field;
  const Icon = isActive ? (sortDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;

  return (
    <TableHead
      className={cn('cursor-pointer select-none whitespace-nowrap', className)}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'opacity-100' : 'opacity-40')} />
      </span>
    </TableHead>
  );
}
