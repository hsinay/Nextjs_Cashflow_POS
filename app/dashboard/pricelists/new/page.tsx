import { PricelistForm } from '@/components/pricelists/pricelist-form';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NewPricelistPage() {
  const session = await getServerSession(authOptions);
  
  // Verify user has permission
  const hasPermission = session?.user && 
    ((session.user as any).roles?.includes('ADMIN') || 
     (session.user as any).roles?.includes('INVENTORY_MANAGER'));

  if (!hasPermission) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/pricelists" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Pricelists
        </Link>
        <h1 className="text-4xl font-bold text-slate-900">
          Create New Pricelist
        </h1>
        <p className="text-slate-600 mt-2">
          Define pricing rules and discounts for your products
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <PricelistForm />
      </div>
    </div>
  );
}
