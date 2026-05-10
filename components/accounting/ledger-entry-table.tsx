'use client';

import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { useUrlSort } from '@/lib/use-url-sort';
import { LedgerEntry } from '@/types/ledger.types';

interface LedgerEntryTableProps {
  entries: LedgerEntry[];
}

export function LedgerEntryTable({ entries }: LedgerEntryTableProps) {
  const { sortField, sortDir, handleSort } = useUrlSort();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead field="entryDate" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Date</SortableTableHead>
          <SortableTableHead field="description" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Description</SortableTableHead>
          <SortableTableHead field="debitAccount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Debit Account</SortableTableHead>
          <SortableTableHead field="creditAccount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Credit Account</SortableTableHead>
          <SortableTableHead field="amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right">Amount</SortableTableHead>
          <TableHead>Reference ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
            <TableCell>{entry.description}</TableCell>
            <TableCell>{entry.debitAccount}</TableCell>
            <TableCell>{entry.creditAccount}</TableCell>
            <TableCell className="text-right">{formatCurrency(entry.amount)}</TableCell>
            <TableCell>{entry.referenceId || 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
