// components/inventory/inventory-transaction-list-client.tsx

'use client';

import { InventoryTransactionTable } from '@/components/inventory/inventory-transaction-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { InventoryTransaction, INVENTORY_TRANSACTION_TYPES } from '@/types/inventory.types';
import { Product } from '@prisma/client';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

interface InventoryTransactionListClientProps {
  initialProductId: string;
  initialTransactionType: string;
  initialStartDate: string;
  initialEndDate: string;
  products: Product[];
  transactions: InventoryTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function InventoryTransactionListClient({
  initialProductId,
  initialTransactionType,
  initialStartDate,
  initialEndDate,
  products,
  transactions,
  pagination,
}: InventoryTransactionListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [productId, setProductId] = useState(initialProductId);
  const [transactionType, setTransactionType] = useState(initialTransactionType);
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
        router.push(`/dashboard/inventory/transactions?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleClearFilters = useCallback(() => {
    setProductId('');
    setTransactionType('');
    setStartDate('');
    setEndDate('');
    startTransition(() => {
      router.push('/dashboard/inventory/transactions');
    });
  }, [router]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select
              value={productId}
              onValueChange={(value) => {
                setProductId(value);
                handleFilterChange('productId', value);
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-[200px]" placeholder="All Products" />
              <SelectContent>
                <SelectItem value="">All Products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={transactionType}
              onValueChange={(value) => {
                setTransactionType(value);
                handleFilterChange('transactionType', value);
              }}
              disabled={isPending}
            >
                <SelectTrigger className="w-[200px]" placeholder="All Types" />
                <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {INVENTORY_TRANSACTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                            {type.replace('_', ' ')}
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

            {(productId || transactionType || startDate || endDate) && (
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
        <InventoryTransactionTable transactions={transactions} />
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
