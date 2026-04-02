// components/pos/pos-session-table.tsx

'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { POSSession } from '@/types/pos.types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface POSSessionTableProps {
  sessions: POSSession[];
}

export function POSSessionTable({ sessions }: POSSessionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session ID</TableHead>
          <TableHead>Cashier</TableHead>
          <TableHead>Terminal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Opened At</TableHead>
          <TableHead>Closed At</TableHead>
          <TableHead className="text-right">Total Sales</TableHead>
          <TableHead className="text-right">Cash Variance</TableHead>
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
