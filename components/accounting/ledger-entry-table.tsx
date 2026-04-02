// components/accounting/ledger-entry-table.tsx

'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { LedgerEntry } from '@/types/ledger.types';

interface LedgerEntryTableProps {
  entries: LedgerEntry[];
}

export function LedgerEntryTable({ entries }: LedgerEntryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Debit Account</TableHead>
          <TableHead>Credit Account</TableHead>
          <TableHead className="text-right">Amount</TableHead>
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
