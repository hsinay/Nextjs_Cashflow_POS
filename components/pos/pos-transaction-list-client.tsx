// components/pos/pos-transaction-list-client.tsx

'use client';

import { POSTransactionTable } from '@/components/pos/pos-transaction-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Transaction, TRANSACTION_PAYMENT_METHODS, TRANSACTION_STATUSES } from '@/types/pos.types';
import { Customer, User } from '@prisma/client';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

interface POSTransactionListClientProps {
  initialSearch: string;
  initialCustomerId: string;
  initialCashierId: string;

  initialStatus: string;
  initialPaymentMethod: string;
  initialStartDate: string;
  initialEndDate: string;
  customers: Customer[];
  cashiers: User[];
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function POSTransactionListClient({
  initialSearch,
  initialCustomerId,
  initialCashierId,
  initialStatus,
  initialPaymentMethod,
  initialStartDate,
  initialEndDate,
  customers,
  cashiers,
  transactions,
  pagination,
}: POSTransactionListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [cashierId, setCashierId] = useState(initialCashierId);
  const [status, setStatus] = useState(initialStatus);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
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
        router.push(`/dashboard/pos/history?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setCustomerId('');
    setCashierId('');
    setStatus('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    startTransition(() => {
      router.push('/dashboard/pos/history');
    });
  }, [router]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by Transaction # or Customer Name..."
              value={search}
              onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange('search', e.target.value);
              }}
              disabled={isPending}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value);
                handleFilterChange('customerId', value);
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-[200px]" placeholder="All Customers" />
              <SelectContent>
                <SelectItem value="">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                {cashiers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.username}
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
                    {TRANSACTION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                            {s.replace('_', ' ')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value);
                handleFilterChange('paymentMethod', value);
              }}
              disabled={isPending}
            >
                <SelectTrigger className="w-[200px]" placeholder="All Methods" />
                <SelectContent>
                    <SelectItem value="">All Methods</SelectItem>
                    {TRANSACTION_PAYMENT_METHODS.map((pm) => (
                        <SelectItem key={pm} value={pm}>
                            {pm.replace('_', ' ')}
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

            {(search || customerId || cashierId || status || paymentMethod || startDate || endDate) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isPending}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {pagination.total === 0 ? 'No transactions found'
              : `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} transactions`
            }
          </div>
        </div>
      </Card>

      <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
        <POSTransactionTable transactions={transactions} />
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
