'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { POSSessionWithRelations } from '@/types/pos-session.types';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { SessionStatusBadge } from './session-status-badge';

interface SessionHistoryTableProps {
  sessions: POSSessionWithRelations[];
}

export function SessionHistoryTable({ sessions }: SessionHistoryTableProps) {
  // Sort by opened date descending
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Date</TableHead>
            <TableHead>Cashier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Sales</TableHead>
            <TableHead>Cash</TableHead>
            <TableHead>Card</TableHead>
            <TableHead>Digital</TableHead>
            <TableHead>Transactions</TableHead>
            <TableHead>Variance</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSessions.map((session) => (
            <TableRow key={session.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {new Date(session.openedAt).toLocaleDateString()}{' '}
                {new Date(session.openedAt).toLocaleTimeString()}
              </TableCell>
              <TableCell>{session.cashier?.username || 'Unknown'}</TableCell>
              <TableCell>
                <SessionStatusBadge status={session.status} />
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(Number(session.totalSalesAmount))}
              </TableCell>
              <TableCell>{formatCurrency(Number(session.totalCashReceived))}</TableCell>
              <TableCell>{formatCurrency(Number(session.totalCardReceived))}</TableCell>
              <TableCell>{formatCurrency(Number(session.totalDigitalReceived))}</TableCell>
              <TableCell className="text-center">{session.totalTransactions}</TableCell>
              <TableCell>
                {session.cashVariance && Number(session.cashVariance) !== 0 ? (
                  <span
                    className={`font-semibold ${
                      Number(session.cashVariance) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(Number(session.cashVariance))}
                  </span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/pos/sessions/${session.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
