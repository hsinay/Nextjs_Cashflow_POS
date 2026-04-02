'use client';

import { SalesOrderTable } from '@/components/sales-orders/sales-order-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Customer } from '@/types/customer.types';
import { SalesOrder } from '@/types/sales-order.types';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

interface SalesOrderListClientProps {
  initialSearch: string;
  initialCustomer: string;
  initialStatus: string;
  customers: Customer[];
  orders: SalesOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function SalesOrderListClient({
  initialSearch,
  initialCustomer,
  initialStatus,
  customers,
  orders,
  pagination,
}: SalesOrderListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [customer, setCustomer] = useState(initialCustomer);
  const [status, setStatus] = useState(initialStatus);
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
        router.push(`/dashboard/sales-orders?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setCustomer('');
    setStatus('');
    startTransition(() => {
      router.push('/dashboard/sales-orders');
    });
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sales-orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sales order');
      }

      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete sales order';
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by Order ID or Customer..."
              value={search}
              onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange('search', e.target.value);
              }}
              disabled={isPending}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={customer} onValueChange={(value) => {
                setCustomer(value);
                handleFilterChange('customer', value);
            }} disabled={isPending}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => {
                setStatus(value);
                handleFilterChange('status', value);
            }} disabled={isPending}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
            </Select>

            {(search || customer || status) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isPending}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {pagination.total === 0 ? 'No sales orders found'
              : `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} orders`
            }
          </div>
        </div>
      </Card>

      <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
        <SalesOrderTable orders={orders} onDelete={handleDelete} />
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
