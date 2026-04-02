import { StockTable } from '@/components/inventory/stock-table';
import { authOptions } from '@/lib/auth';
import { getProductsForInventory, ProductInventory } from '@/services/inventory.service';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export default async function PhysicalInventoryPage() {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session?.user) {
    redirect('/login');
  }

  // Check permissions - only ADMIN and INVENTORY_MANAGER
  const roles = ((session.user as unknown) as { roles?: string[] }).roles || [];
  const hasPermission =
    roles.includes('ADMIN') || roles.includes('INVENTORY_MANAGER');

  if (!hasPermission) {
    redirect('/dashboard');
  }

  let products: ProductInventory[] = [];
  let error: string | null = null;

  try {
    products = await getProductsForInventory();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch products';
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Physical Inventory
        </h1>
        <p className="text-slate-600 mt-2">
          View and manage current stock quantities. Click on any stock quantity to edit.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stock Table */}
      {!error && <StockTable initialProducts={products} />}
    </div>
  );
}
