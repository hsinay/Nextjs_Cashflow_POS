// app/(dashboard)/customers/page.tsx

import { CustomerListClient } from '@/components/customers/customer-list-client';
import { CustomerSearchFilters } from '@/components/customers/customer-search-filters';
import { Button } from '@/components/ui/button';
import { CustomerService } from '@/services/customer.service';
import { CustomerSegment } from '@/types/customer.types';
import Link from 'next/link';

export default async function CustomersPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const resolvedParams: Record<string, string> = searchParams ? await searchParams : {};
  const page = Number(resolvedParams?.page || 1);
  const limit = Number(resolvedParams?.limit || 20);
  const search = resolvedParams?.search || '';
  const segment = resolvedParams?.segment as CustomerSegment | undefined;
  const highRisk = resolvedParams?.highRisk === 'true';
  const creditIssues = resolvedParams?.creditIssues === 'true';

  const { customers, pagination } = await CustomerService.getAllCustomers({
    search,
    segment,
    highRisk,
    creditIssues,
    page,
    limit,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Customers</h1>
        <p className="text-slate-600 mt-2">Manage and monitor your customer relationships and credit status.</p>
      </div>
      <div className="flex items-center justify-end">
        <Link href="/dashboard/customers/new">
          <Button>
            + Add Customer
          </Button>
        </Link>
      </div>
      <CustomerSearchFilters />
      <CustomerListClient customers={customers} pagination={pagination} />
    </div>
  );
}
