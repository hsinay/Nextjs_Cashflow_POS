'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { Eye, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SessionStatusBadge } from './session-status-badge';

interface User {
  id: string;
  username: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface POSSessionHistoryClientProps {
  sessions: POSSessionWithRelations[];
  cashiers: User[];
  pagination: Pagination;
  initialStatus?: string;
  initialCashierId?: string;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function POSSessionHistoryClient({
  sessions,
  cashiers,
  pagination,
  initialStatus = '',
  initialCashierId = '',
  initialStartDate = '',
  initialEndDate = '',
}: POSSessionHistoryClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [cashierId, setCashierId] = useState(initialCashierId);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (cashierId) params.append('cashierId', cashierId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    router.push(`/dashboard/pos/history?${params.toString()}`);
  };

  const handleReset = () => {
    setStatus('');
    setCashierId('');
    setStartDate('');
    setEndDate('');
    router.push('/dashboard/pos/history');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-2">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Cashier</label>
            <Select value={cashierId} onValueChange={setCashierId}>
              <option value="">All Cashiers</option>
              {cashiers.map((cashier) => (
                <option key={cashier.id} value={cashier.id}>
                  {cashier.username}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleFilter}>Apply Filters</Button>
          <Button variant="outline" onClick={handleReset}>
            Clear
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">
            Showing <span className="font-bold">{sessions.length}</span> of{' '}
            <span className="font-bold">{pagination.total}</span> sessions
          </p>
        </div>
        {pagination.pages > 1 && (
          <div className="flex gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === pagination.page ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.append('page', p.toString());
                  if (status) params.append('status', status);
                  if (cashierId) params.append('cashierId', cashierId);
                  if (startDate) params.append('startDate', startDate);
                  if (endDate) params.append('endDate', endDate);
                  router.push(`/dashboard/pos/history?${params.toString()}`);
                }}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Sessions Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Date & Time</TableHead>
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
            {sessions.map((session) => (
              <TableRow key={session.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-sm">
                  {new Date(session.openedAt).toLocaleDateString()}{' '}
                  {new Date(session.openedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell className="text-sm">{session.cashier?.username || 'Unknown'}</TableCell>
                <TableCell>
                  <SessionStatusBadge status={session.status} />
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {formatCurrency(Number(session.totalSalesAmount))}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(Number(session.totalCashReceived))}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(Number(session.totalCardReceived))}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(Number(session.totalDigitalReceived))}
                </TableCell>
                <TableCell className="text-center text-sm font-semibold">
                  {session.totalTransactions}
                </TableCell>
                <TableCell className="text-sm">
                  {session.cashVariance && Number(session.cashVariance) !== 0 ? (
                    <span
                      className={`font-semibold ${
                        Number(session.cashVariance) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {Number(session.cashVariance) > 0 ? '+' : ''}
                      {formatCurrency(Number(session.cashVariance))}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
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
    </div>
  );
}
