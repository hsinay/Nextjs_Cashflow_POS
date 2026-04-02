// app/dashboard/accounting/ledger/page.tsx

import { LedgerEntryListClient } from '@/components/accounting/ledger-entry-list-client';
import { authOptions } from '@/lib/auth';
import { getAllLedgerEntries } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface LedgerPageProps {
  searchParams: {
    startDate?: string;
    endDate?: string;
    account?: string;
    referenceId?: string;
    page?: string;
    limit?: string;
  };
}

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const filters = {
    startDate: searchParams.startDate ? new Date(searchParams.startDate) : undefined,
    endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
    account: searchParams.account,
    referenceId: searchParams.referenceId,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
  }

  const { entries, pagination } = await getAllLedgerEntries(filters);

  // TODO: Fetch distinct accounts for filtering dropdown
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
        initialStartDate={searchParams.startDate || ''}
        initialEndDate={searchParams.endDate || ''}
        initialAccount={searchParams.account || ''}
        initialReferenceId={searchParams.referenceId || ''}
        accounts={accounts}
        entries={entries}
        pagination={pagination}
      />
    </div>
  );
}
