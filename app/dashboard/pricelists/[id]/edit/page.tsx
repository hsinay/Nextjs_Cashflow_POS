import { PricelistForm } from '@/components/pricelists/pricelist-form';
import { authOptions } from '@/lib/auth';
import { getPricelistById } from '@/services/pricelist.service';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

interface EditPricelistPageProps {
  params: { id: string };
}

export default async function EditPricelistPage({ params }: EditPricelistPageProps) {
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
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/pricelists/${pricelist.id}`} className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to {pricelist.name}
        </Link>
        <h1 className="text-4xl font-bold text-slate-900">
          Edit Pricelist
        </h1>
        <p className="text-slate-600 mt-2">
          Update pricing rules and settings
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <PricelistForm initialData={pricelist} isEdit={true} />
      </div>
    </div>
  );
}
