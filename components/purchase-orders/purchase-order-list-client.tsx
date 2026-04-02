'use client';

import { PurchaseOrderTable } from '@/components/purchase-orders/purchase-order-table';
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
import { PurchaseOrder } from '@/types/purchase-order.types';
import { Supplier } from '@/types/supplier.types';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

interface PurchaseOrderListClientProps {
  initialSearch: string;
  initialSupplier: string;
  initialStatus: string;
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function PurchaseOrderListClient({
  initialSearch,
  initialSupplier,
  initialStatus,
  suppliers,
  orders,
  pagination,
}: PurchaseOrderListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [supplier, setSupplier] = useState(initialSupplier);
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
        router.push(`/dashboard/purchase-orders?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setSupplier('');
    setStatus('');
    startTransition(() => {
      router.push('/dashboard/purchase-orders');
    });
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete purchase order');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to delete purchase order');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-sm p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Order ID or Supplier..."
              value={search}
              onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange('search', e.target.value);
              }}
              disabled={isPending}
              className="pl-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="flex gap-2">
            <Select value={supplier} onValueChange={(value) => {
                setSupplier(value);
                handleFilterChange('supplier', value);
            }} disabled={isPending}>
              <SelectTrigger className="w-[200px] focus:border-purple-500 focus:ring-2 focus:ring-purple-100">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => {
                setStatus(value);
                handleFilterChange('status', value);
            }} disabled={isPending}>
                <SelectTrigger className="w-[200px] focus:border-purple-500 focus:ring-2 focus:ring-purple-100">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
            </Select>

            {(search || supplier || status) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isPending} className="border-slate-300">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {pagination.total === 0 ? 'No purchase orders found'
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
        <PurchaseOrderTable orders={orders} onDelete={handleDelete} />
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
