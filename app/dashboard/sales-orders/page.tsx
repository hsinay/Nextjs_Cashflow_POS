// app/(dashboard)/sales-orders/page.tsx

import { SalesOrderListClient } from '@/components/sales-orders/sales-order-list-client';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CustomerService } from '@/services/customer.service'; // Add this line
import { getAllSalesOrders } from '@/services/sales-order.service';
import { CustomerSegment } from '@/types/customer.types'; // Add this line
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface SalesOrdersPageProps {
  searchParams: {
    search?: string;
    customer?: string;
    status?: string;
    page?: string;
    limit?: string;
  };
}

export default async function SalesOrdersPage({ searchParams }: SalesOrdersPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const filters = {
    search: searchParams.search,
    customerId: searchParams.customer,
    status: searchParams.status,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 10,
  }

  const { orders, pagination } = await getAllSalesOrders(filters);
  const customers = await prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }});

  // Add outstandingBalance and convert creditLimit, aiSegment, churnRiskScore to each customer
  const customersWithBalance = await Promise.all(
    customers.map(async (customer) => ({
      ...customer,
      outstandingBalance: await CustomerService.calculateOutstandingBalance(customer.id),
      creditLimit: customer.creditLimit.toNumber(),
      aiSegment: customer.aiSegment as CustomerSegment,
      churnRiskScore: customer.churnRiskScore !== null ? customer.churnRiskScore.toNumber() : null,
    }))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Sales Orders</h1>
          <p className="text-slate-600 mt-2">
            Manage your customer orders
          </p>
        </div>
        <Link href="/dashboard/sales-orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Sales Order
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <SalesOrderListClient
        initialSearch={searchParams.search || ''}
        initialCustomer={searchParams.customer || ''}
        initialStatus={searchParams.status || ''}
        customers={customersWithBalance}
        orders={orders}
        pagination={pagination}
      />
    </div>
  );
}
