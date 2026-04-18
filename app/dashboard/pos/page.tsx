import { POSClient } from '@/components/pos/pos-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLatestOpenPOSSessionByCashierId } from '@/services/pos.service';
import { Product } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function POSPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const cashierId = session.user.id;
  const initialSession = await getLatestOpenPOSSessionByCashierId(cashierId);

  const [productsRaw, customers] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  const categoryMap = new Map();
  productsRaw.forEach((product) => {
    if (product.category && !categoryMap.has(product.category.id)) {
      categoryMap.set(product.category.id, product.category);
    }
  });
  const categories = Array.from(categoryMap.values());

  const serializedProducts = productsRaw.map((p) => ({
    ...p,
    price: p.price.toNumber(),
    costPrice: p.costPrice?.toNumber() || null,
    taxRate: p.taxRate?.toNumber() || null,
  })) as (Product & { price: number; costPrice: number | null; taxRate: number | null })[];

  return (
    <div className="h-full">
      <POSClient
        initialSession={initialSession}
        products={serializedProducts}
        categories={categories}
        customers={customers}
        cashierId={cashierId}
      />
    </div>
  );
}
