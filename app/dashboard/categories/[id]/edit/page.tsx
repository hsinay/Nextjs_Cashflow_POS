// app/(dashboard)/categories/[id]/edit/page.tsx

'use client';

import { CategoryForm } from '@/components/categories/category-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Category } from '@/types/category.types';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Edit category page
 * Client component that loads category data and provides edit form
 */
export default function EditCategoryPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryId = typeof params.id === 'string' ? params.id : '';

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (status === 'loading') return; // Don't redirect while loading

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      const userRoles = (session?.user as any)?.roles;
      if (!userRoles || !userRoles.some((role: string) => ['ADMIN', 'INVENTORY_MANAGER'].includes(role))) {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  // Fetch category data
  useEffect(() => {
    if (!categoryId) return;

    const fetchCategory = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/categories/${categoryId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch category');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch category');
        }

        setCategory(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load category';
        setError(errorMessage);
        console.error('Error fetching category:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Edit Category
          </h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Edit Category
          </h1>
        </div>
        <Alert>
          <AlertDescription>Category not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Edit Category
        </h1>
        <p className="text-gray-600 mt-1">
          Update category details and hierarchy
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CategoryForm
          defaultValues={category}
          isEditing={true}
          redirectTo="/dashboard/categories"
        />
      </div>
    </div>
  );
}
