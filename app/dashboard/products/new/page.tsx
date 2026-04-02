// app/dashboard/products/new/page.tsx

import { ProductForm } from '@/components/products/product-form';
import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to create products
  const hasPermission =
    hasRole(session.user, 'ADMIN') || hasRole(session.user, 'INVENTORY_MANAGER');

  if (!hasPermission) {
    redirect('/dashboard');
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="text-gray-600 mt-1">
          Add a new product to your inventory
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
