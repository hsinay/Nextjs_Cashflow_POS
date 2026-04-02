// components/accounting/ledger-entry-list-client.tsx

'use client';

import { LedgerEntryTable } from '@/components/accounting/ledger-entry-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { LedgerEntry } from '@/types/ledger.types';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

interface LedgerEntryListClientProps {
  initialStartDate: string;
  initialEndDate: string;
  initialAccount: string;
  initialReferenceId: string;
  accounts: string[]; // List of distinct accounts for filter
  entries: LedgerEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function LedgerEntryListClient({
  initialStartDate,
  initialEndDate,
  initialAccount,
  initialReferenceId,
  accounts,
  entries,
  pagination,
}: LedgerEntryListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [account, setAccount] = useState(initialAccount);
  const [referenceId, setReferenceId] = useState(initialReferenceId);
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
        router.push(`/dashboard/accounting/ledger?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleClearFilters = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setAccount('');
    setReferenceId('');
    startTransition(() => {
      router.push('/dashboard/accounting/ledger');
    });
  }, [router]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select
              value={account}
              onValueChange={(value) => {
                setAccount(value);
                handleFilterChange('account', value);
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-[200px]" placeholder="All Accounts" />
              <SelectContent>
                <SelectItem value="">All Accounts</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc} value={acc}>
                    {acc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
                placeholder="Search by Reference ID..."
                value={referenceId}
                onChange={(e) => {
                    setReferenceId(e.target.value);
                    handleFilterChange('referenceId', e.target.value);
                }}
                disabled={isPending}
                className="w-[200px]"
            />

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

            {(startDate || endDate || account || referenceId) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isPending}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {pagination.total === 0 ? 'No ledger entries found'
              : `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} entries`
            }
          </div>
        </div>
      </Card>

      <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
        <LedgerEntryTable entries={entries} />
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
