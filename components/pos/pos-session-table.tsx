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
import { formatCurrency } from '@/lib/utils';
import { useUrlSort } from '@/lib/use-url-sort';
import { POSSession } from '@/types/pos.types';
import { Badge } from '@/components/ui/badge';

interface POSSessionTableProps {
  sessions: POSSession[];
}

export function POSSessionTable({ sessions }: POSSessionTableProps) {
  const { sortField, sortDir, handleSort } = useUrlSort();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session ID</TableHead>
          <SortableTableHead field="cashier.username" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Cashier</SortableTableHead>
          <SortableTableHead field="terminalId" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Terminal</SortableTableHead>
          <SortableTableHead field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortableTableHead>
          <SortableTableHead field="openedAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Opened At</SortableTableHead>
          <SortableTableHead field="closedAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Closed At</SortableTableHead>
          <SortableTableHead field="totalSalesAmount" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right">Total Sales</SortableTableHead>
          <SortableTableHead field="cashVariance" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right">Cash Variance</SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-medium">{session.id.substring(0, 8)}</TableCell>
            <TableCell>{session.cashier?.username || 'N/A'}</TableCell>
            <TableCell>{session.terminalId || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={session.status === 'CLOSED' ? 'outline' : 'default'}>
                {session.status}
              </Badge>
            </TableCell>
            <TableCell>{new Date(session.openedAt).toLocaleString()}</TableCell>
            <TableCell>{session.closedAt ? new Date(session.closedAt).toLocaleString() : 'N/A'}</TableCell>
            <TableCell className="text-right">{formatCurrency(session.totalSalesAmount)}</TableCell>
            <TableCell className="text-right">{formatCurrency(session.cashVariance)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
