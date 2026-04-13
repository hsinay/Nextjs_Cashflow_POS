import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { getPricelistById } from '@/services/pricelist.service';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

interface PricelistDetailPageProps {
  params: { id: string };
}

export default async function PricelistDetailPage({ params }: PricelistDetailPageProps) {
  const session = await getServerSession(authOptions);
  
  // Verify user has permission
  const hasPermission = session?.user && 
    ((session.user as any).roles?.includes('ADMIN') || 
     (session.user as any).roles?.includes('INVENTORY_MANAGER'));

  if (!hasPermission) {
    redirect('/dashboard');
  }

  let pricelist = null;
  let error = null;

  try {
    pricelist = await getPricelistById(params.id);
  } catch (err: any) {
    error = err.message;
  }

  if (error || !pricelist) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Page Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/pricelists" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to Pricelists
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">
            {pricelist.name}
          </h1>
          <p className="text-slate-600 mt-2">
            {pricelist.description || 'No description'}
          </p>
        </div>
        <Link href={`/dashboard/pricelists/${pricelist.id}/edit`}>
          <Button>
            Edit Pricelist
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Status</p>
          <p className="text-lg font-semibold text-slate-900">
            {pricelist.isActive ? '✓ Active' : '○ Inactive'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Priority</p>
          <p className="text-lg font-semibold text-slate-900">
            {pricelist.priority}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Rules Count</p>
          <p className="text-lg font-semibold text-slate-900">
            {pricelist.rules?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
