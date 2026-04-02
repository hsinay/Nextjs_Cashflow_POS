'use client';

import { ProductTable } from '@/components/products/product-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Category, Product } from '@/types/product.types';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

interface ProductListClientProps {
  initialSearch: string;
  initialCategory: string;
  categories: Category[];
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function ProductListClient({
  initialSearch,
  initialCategory,
  categories,
  products,
  pagination,
}: ProductListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        if (value) {
          params.set('search', value);
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        router.push(`/dashboard/products?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategory(value);
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        if (value) {
          params.set('category', value);
        } else {
          params.delete('category');
        }
        params.set('page', '1');
        router.push(`/dashboard/products?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setCategory('');
    startTransition(() => {
      router.push('/dashboard/products');
    });
  }, [router]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this product? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      // Refresh the page
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={isPending}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            <Select value={category} onValueChange={handleCategoryChange} disabled={isPending}>
              <SelectTrigger className="w-[200px]" placeholder="All Categories" />
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || category) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Info */}
          <div className="text-sm text-gray-600">
            {pagination.total === 0 ? (
              'No products found'
            ) : (
              <>
                Showing{' '}
                <strong>
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </strong>{' '}
                of <strong>{pagination.total}</strong> products
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
        <ProductTable products={products} onDelete={handleDelete} />
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(pagination.page - 1));
              router.push(`/dashboard/products?${params.toString()}`);
            }}
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
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page));
                  router.push(`/dashboard/products?${params.toString()}`);
                }}
                disabled={isPending}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(pagination.page + 1));
              router.push(`/dashboard/products?${params.toString()}`);
            }}
            disabled={pagination.page === pagination.pages || isPending}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
