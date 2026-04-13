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
  searchParams: {
    search?: string;
    supplier?: string;
    status?: string;
    page?: string;
    limit?: string;
  };
}

export default async function PurchaseOrdersPage({ searchParams }: PurchaseOrdersPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const filters = {
    search: searchParams.search,
    supplierId: searchParams.supplier,
    status: searchParams.status,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 10,
  }

  const { orders, pagination } = await getAllPurchaseOrders(filters);
  
  // Fetch only dropdown data (id and name) - no balance calculations needed
  const suppliers = await prisma.supplier.findMany({ 
    where: { isActive: true }, 
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

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
        initialSearch={searchParams.search || ''}
        initialSupplier={searchParams.supplier || ''}
        initialStatus={searchParams.status || ''}
        suppliers={suppliers as any}
        orders={orders}
        pagination={pagination}
      />
    </div>
  );
}
