// app/dashboard/inventory/transactions/page.tsx

import { InventoryTransactionListClient } from '@/components/inventory/inventory-transaction-list-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllInventoryTransactions } from '@/services/inventory.service';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface InventoryTransactionsPageProps {
  searchParams: Promise<{
    productId?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  }>;
}

function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

export default async function InventoryTransactionsPage({ searchParams }: InventoryTransactionsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;
  const filters = {
    productId: resolvedSearchParams.productId,
    transactionType: resolvedSearchParams.transactionType,
    startDate: resolvedSearchParams.startDate ? new Date(resolvedSearchParams.startDate) : undefined,
    endDate: resolvedSearchParams.endDate ? new Date(resolvedSearchParams.endDate) : undefined,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 20,
  }

  const { transactions, pagination } = await getAllInventoryTransactions(filters);
  const rawProducts = await prisma.product.findMany({ orderBy: { name: 'asc' }});
  const products = rawProducts.map(p => ({
    ...p,
    price: convertToNumber(p.price) as any,
    costPrice: convertToNumber(p.costPrice) as any,
    taxRate: convertToNumber(p.taxRate) as any,
    predictedDemandImpact: convertToNumber(p.predictedDemandImpact) as any,
  })) as any[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Transactions</h1>
          <p className="text-gray-600 mt-1">
            View all inventory movements
          </p>
        </div>
      </div>

      <InventoryTransactionListClient
        initialProductId={resolvedSearchParams.productId || ''}
        initialTransactionType={resolvedSearchParams.transactionType || ''}
        initialStartDate={resolvedSearchParams.startDate || ''}
        initialEndDate={resolvedSearchParams.endDate || ''}
        products={products}
        transactions={transactions}
        pagination={pagination}
      />
    </div>
  );
}
