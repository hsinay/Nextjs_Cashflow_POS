// app/(dashboard)/categories/new/page.tsx

'use client';

import { CategoryForm } from '@/components/categories/category-form';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Create new category page
 * Client component with form for creating new categories
 */
export default function NewCategoryPage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();

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

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Create New Category
        </h1>
        <p className="text-gray-600 mt-1">
          Add a new product category to your system
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CategoryForm isEditing={false} redirectTo="/dashboard/categories" />
      </div>
    </div>
  );
}
