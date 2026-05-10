// app/dashboard/accounting/ledger/page.tsx

import { LedgerEntryListClient } from '@/components/accounting/ledger-entry-list-client';
import { authOptions } from '@/lib/auth';
import { getAllLedgerEntries } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface LedgerSearchParams {
  startDate?: string;
  endDate?: string;
  account?: string;
  referenceId?: string;
  page?: string;
  limit?: string;
  sortField?: string;
  sortDir?: string;
}

interface LedgerPageProps {
  searchParams: Promise<LedgerSearchParams>;
}

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const sp = await searchParams;
  const filters = {
    startDate: sp.startDate ? new Date(sp.startDate) : undefined,
    endDate: sp.endDate ? new Date(sp.endDate) : undefined,
    account: sp.account,
    referenceId: sp.referenceId,
    page: sp.page ? parseInt(sp.page) : 1,
    limit: sp.limit ? parseInt(sp.limit) : 20,
    sortField: sp.sortField,
    sortDir: sp.sortDir as 'asc' | 'desc' | undefined,
  };

  const { entries, pagination } = await getAllLedgerEntries(filters);

  const accounts: string[] = ["Cash", "Bank", "Accounts Receivable", "Accounts Payable", "Sales Revenue", "Sales Tax Payable", "Sales Discount", "Inventory", "Purchase Clearing"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">General Ledger</h1>
          <p className="text-gray-600 mt-1">
            View all detailed financial transactions.
          </p>
        </div>
      </div>

      <LedgerEntryListClient
        initialStartDate={sp.startDate || ''}
        initialEndDate={sp.endDate || ''}
        initialAccount={sp.account || ''}
        initialReferenceId={sp.referenceId || ''}
        accounts={accounts}
        entries={entries}
        pagination={pagination}
      />
    </div>
  );
}
