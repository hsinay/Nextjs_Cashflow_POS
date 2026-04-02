import { CategoryTree } from '@/components/categories/category-tree';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { getAllCategories } from '@/services/category.service';
import { Category } from '@/types/category.types';
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  
  // Verify user has permission
  const hasPermission = session?.user && 
    ((session.user as any).roles?.includes('ADMIN') || 
     (session.user as any).roles?.includes('INVENTORY_MANAGER'));

  let categories: Category[] = [];
  let error: string | null = null;

  if (hasPermission) {
    try {
      categories = await getAllCategories();
    } catch (err: any) {
      error = err.message;
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Categories
          </h1>
          <p className="text-slate-600 mt-2">
            Manage product categories and hierarchies
          </p>
        </div>
        <Link href="/dashboard/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Categories List or Empty State */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12">
          <div className="text-center">
            <p className="text-slate-600 mb-4">
              📋 No categories yet
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Start by creating your first product category to organize your inventory.
            </p>
            <Link href="/dashboard/categories/new">
              <Button>
                Create First Category
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <CategoryTree categories={categories} />
        </div>
      )}
    </div>
  );
}