// app/(dashboard)/customers/page.tsx

import { CustomerListClient } from '@/components/customers/customer-list-client';
import { CustomerSearchFilters } from '@/components/customers/customer-search-filters';
import { Button } from '@/components/ui/button';
import { CustomerService } from '@/services/customer.service';
import { CustomerSegment } from '@/types/customer.types';
import Link from 'next/link';

export default async function CustomersPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const page = Number(searchParams?.page || 1);
  const limit = Number(searchParams?.limit || 20);
  const search = searchParams?.search || '';
  const segment = searchParams?.segment as CustomerSegment | undefined;
  const highRisk = searchParams?.highRisk === 'true';
  const creditIssues = searchParams?.creditIssues === 'true';

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
