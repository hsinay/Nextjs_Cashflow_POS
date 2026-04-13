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
  searchParams: {
    search?: string;
    payerType?: string;
    payerId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const filters = {
    search: searchParams.search,
    payerType: searchParams.payerType as PayerType | undefined,
    payerId: searchParams.payerId,
    paymentMethod: searchParams.paymentMethod as ConcretePaymentMethod | undefined,
    startDate: searchParams.startDate ? new Date(searchParams.startDate) : undefined,
    endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
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
        initialSearch={searchParams.search || ''}
        initialPayerType={searchParams.payerType || ''}
        initialPayerId={searchParams.payerId || ''}
        initialPaymentMethod={searchParams.paymentMethod || ''}
        initialStartDate={searchParams.startDate || ''}
        initialEndDate={searchParams.endDate || ''}
        customers={customers as any}
        suppliers={suppliers as any}
        payments={payments}
        pagination={pagination}
      />
    </div>
  );
}
