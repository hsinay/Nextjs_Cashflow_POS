import { POSClient, type POSCatalogProduct } from '@/components/pos/pos-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getLatestOpenPOSSessionByCashierId } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

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
      omit: { visionEmbedding: true },
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

  const serializedProducts: POSCatalogProduct[] = productsRaw.map((p) => ({
    ...p,
    price: p.price.toNumber(),
    costPrice: p.costPrice?.toNumber() ?? null,
    taxRate: p.taxRate?.toNumber() ?? null,
  }));

  const serializedCustomers = customers.map(c => ({
    ...c,
    creditLimit: convertToNumber(c.creditLimit),
    outstandingBalance: convertToNumber(c.outstandingBalance),
    loyaltyPoints: convertToNumber(c.loyaltyPoints),
    churnRiskScore: convertToNumber(c.churnRiskScore),
  })) as any[];

  return (
    <div className="h-full">
      <POSClient
        initialSession={initialSession}
        products={serializedProducts}
        categories={categories}
        customers={serializedCustomers}
        cashierId={cashierId}
      />
    </div>
  );
}
