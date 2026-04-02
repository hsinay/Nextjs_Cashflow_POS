// components/pos/pos-session-list-client.tsx

'use client';

import { POSSessionTable } from '@/components/pos/pos-session-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { POSSession, POS_SESSION_STATUSES } from '@/types/pos.types';
import { User } from '@prisma/client';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

interface POSSessionListClientProps {
  initialCashierId: string;
  initialStatus: string;
  initialStartDate: string;
  initialEndDate: string;
  users: User[];
  sessions: POSSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function POSSessionListClient({
  initialCashierId,
  initialStatus,
  initialStartDate,
  initialEndDate,
  users,
  sessions,
  pagination,
}: POSSessionListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cashierId, setCashierId] = useState(initialCashierId);
  const [status, setStatus] = useState(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = useCallback((key: string, value: string) => {
    startTransition(() => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1');
        router.push(`/dashboard/pos/sessions?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleClearFilters = useCallback(() => {
    setCashierId('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    startTransition(() => {
      router.push('/dashboard/pos/sessions');
    });
  }, [router]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select
              value={cashierId}
              onValueChange={(value) => {
                setCashierId(value);
                handleFilterChange('cashierId', value);
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-[200px]" placeholder="All Cashiers" />
              <SelectContent>
                <SelectItem value="">All Cashiers</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                handleFilterChange('status', value);
              }}
              disabled={isPending}
            >
                <SelectTrigger className="w-[200px]" placeholder="All Statuses" />
                <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {POS_SESSION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                            {s.replace('_', ' ')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                    setStartDate(e.target.value);
                    handleFilterChange('startDate', e.target.value);
                }}
                disabled={isPending}
                className="w-[180px]"
                title="Start Date"
            />
            <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                    setEndDate(e.target.value);
                    handleFilterChange('endDate', e.target.value);
                }}
                disabled={isPending}
                className="w-[180px]"
                title="End Date"
            />

            {(cashierId || status || startDate || endDate) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isPending}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {pagination.total === 0 ? 'No sessions found'
              : `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} sessions`
            }
          </div>
        </div>
      </Card>

      <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
        <POSSessionTable sessions={sessions} />
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
            <Button
                variant="outline"
                onClick={() => handleFilterChange('page', String(pagination.page - 1))}
                disabled={pagination.page === 1 || isPending}
            >
                Previous
            </Button>
            <div className="flex gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <Button
                        key={page}
                        variant={page === pagination.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('page', String(page))}
                        disabled={isPending}
                    >
                        {page}
                    </Button>
                ))}
            </div>
            <Button
                variant="outline"
                onClick={() => handleFilterChange('page', String(pagination.page + 1))}
                disabled={pagination.page === pagination.pages || isPending}
            >
                Next
            </Button>
        </div>
      )}
    </div>
  );
}
