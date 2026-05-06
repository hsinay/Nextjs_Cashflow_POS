// app/(dashboard)/purchase-orders/page.tsx

import { PurchaseOrderListClient } from '@/components/purchase-orders/purchase-order-list-client';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllPurchaseOrders } from '@/services/purchase-order.service';
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PurchaseOrdersPageProps {
  searchParams: Promise<{
    search?: string;
    supplier?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function PurchaseOrdersPage({ searchParams }: PurchaseOrdersPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;
  const filters = {
    search: resolvedSearchParams.search,
    supplierId: resolvedSearchParams.supplier,
    status: resolvedSearchParams.status,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 10,
  }

  const { orders, pagination } = await getAllPurchaseOrders(filters);

  // Fetch suppliers and strictly convert to plain objects with only id and name
  const supplierRows = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  const suppliers: Array<{ id: string; name: string }> = supplierRows.map(s => ({
    id: String(s.id),
    name: String(s.name)
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-600">
            Manage your supplier orders
          </p>
        </div>
        <Link href="/dashboard/purchase-orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase Order
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <PurchaseOrderListClient
        initialSearch={resolvedSearchParams.search || ''}
        initialSupplier={resolvedSearchParams.supplier || ''}
        initialStatus={resolvedSearchParams.status || ''}
        suppliers={suppliers}
        orders={orders}
        pagination={pagination}
      />
    </div>
  );
}
