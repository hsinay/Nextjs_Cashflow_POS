// app/dashboard/inventory/transactions/page.tsx

import { InventoryTransactionListClient } from '@/components/inventory/inventory-transaction-list-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllInventoryTransactions } from '@/services/inventory.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface InventoryTransactionsPageProps {
  searchParams: {
    productId?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };
}

export default async function InventoryTransactionsPage({ searchParams }: InventoryTransactionsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const filters = {
    productId: searchParams.productId,
    transactionType: searchParams.transactionType,
    startDate: searchParams.startDate ? new Date(searchParams.startDate) : undefined,
    endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
  }

  const { transactions, pagination } = await getAllInventoryTransactions(filters);
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' }});

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
        initialProductId={searchParams.productId || ''}
        initialTransactionType={searchParams.transactionType || ''}
        initialStartDate={searchParams.startDate || ''}
        initialEndDate={searchParams.endDate || ''}
        products={products}
        transactions={transactions}
        pagination={pagination}
      />
    </div>
  );
}
