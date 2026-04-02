// app/(dashboard)/suppliers/page.tsx

import { SupplierListClient } from '@/components/suppliers/supplier-list-client';
import { SupplierSearchFilters } from '@/components/suppliers/supplier-search-filters';
import { Button } from '@/components/ui/button';
import { SupplierService } from '@/services/supplier.service';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function SuppliersPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const page = Number(searchParams?.page || 1);
  const limit = Number(searchParams?.limit || 20);
  const search = searchParams?.search || '';
  const creditIssues = searchParams?.creditIssues === 'true';

  const { suppliers, pagination } = await SupplierService.getAllSuppliers({
    search,
    creditIssues,
    page,
    limit,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Suppliers</h1>
        <p className="text-slate-600 mt-2">Manage supplier information and credit accounts.</p>
      </div>
      <div className="flex items-center justify-end">
        <Link href="/dashboard/suppliers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </Link>
      </div>
      
      <SupplierSearchFilters />
      
      <SupplierListClient suppliers={suppliers} pagination={pagination} />
    </div>
  );
}
