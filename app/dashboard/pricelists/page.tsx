import { PricelistList } from '@/components/pricelists/pricelist-list';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/auth-helpers';
import {
  getAllPricelistsSummary,
} from '@/services/pricelist.service';

type PricelistSummaryRow = Awaited<
  ReturnType<typeof getAllPricelistsSummary>
>[number];
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

export default async function PricelistsPage() {
  const session = await getServerSession(authOptions);
  
  // Verify user has permission using centralized helper
  const userPermitted = hasPermission(
    session?.user?.roles as string[] | undefined,
    'PRICELIST_VIEW'
  );

  let pricelists: PricelistSummaryRow[] = [];
  let error: string | null = null;

  if (!userPermitted) {
    error = 'Insufficient permissions to view pricelists';
  } else {
    try {
      pricelists = await getAllPricelistsSummary();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to fetch pricelists';
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Pricelists
          </h1>
          <p className="text-slate-600 mt-2">
            Manage product pricing rules and discounts
          </p>
        </div>
        <Link href="/dashboard/pricelists/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Pricelist
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Pricelists List or Empty State */}
      {pricelists.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">📋</span>}
          title="No pricelists yet"
          description="Start by creating your first pricelist to manage product pricing."
        >
          <Link href="/dashboard/pricelists/new">
            <Button>Create First Pricelist</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <PricelistList pricelists={pricelists} />
        </div>
      )}
    </div>
  );
}
