// app/dashboard/payments/page.tsx

import { PaymentListClient } from '@/components/payments/payment-list-client';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllPayments } from '@/services/payment.service';
import { ConcretePaymentMethod, PayerType } from '@/types/payment.types';
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PaymentsPageProps {
  searchParams: Promise<{
    search?: string;
    payerType?: string;
    payerId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
    sortField?: string;
    sortDir?: string;
  }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;
  const filters = {
    search: resolvedSearchParams.search,
    payerType: resolvedSearchParams.payerType as PayerType | undefined,
    payerId: resolvedSearchParams.payerId,
    paymentMethod: resolvedSearchParams.paymentMethod as ConcretePaymentMethod | undefined,
    startDate: resolvedSearchParams.startDate ? new Date(resolvedSearchParams.startDate) : undefined,
    endDate: resolvedSearchParams.endDate ? new Date(resolvedSearchParams.endDate) : undefined,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 20,
    sortField: resolvedSearchParams.sortField,
    sortDir: resolvedSearchParams.sortDir as 'asc' | 'desc' | undefined,
  }

  const { payments, pagination } = await getAllPayments(filters);
  
  // Fetch only dropdown data (id and name) - no balance calculations needed
  const [customers, suppliers] = await Promise.all([
    prisma.customer.findMany({ 
      where: { isActive: true }, 
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.supplier.findMany({ 
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
  ]);


  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600 mt-2">
            Manage all incoming and outgoing payments.
          </p>
        </div>
        <Link href="/dashboard/payments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </div>

      <PaymentListClient
        initialSearch={resolvedSearchParams.search || ''}
        initialPayerType={resolvedSearchParams.payerType || ''}
        initialPayerId={resolvedSearchParams.payerId || ''}
        initialPaymentMethod={resolvedSearchParams.paymentMethod || ''}
        initialStartDate={resolvedSearchParams.startDate || ''}
        initialEndDate={resolvedSearchParams.endDate || ''}
        customers={customers as any}
        suppliers={suppliers as any}
        payments={payments}
        pagination={pagination}
      />
    </div>
  );
}
