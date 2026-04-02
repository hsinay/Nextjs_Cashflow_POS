// app/dashboard/payments/new/page.tsx

import { PaymentForm } from '@/components/payments/payment-form';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Create Payment',
  description: 'Create a new payment record',
};

export default async function CreatePaymentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to create payments
  const hasPermission =
    session.user.roles?.includes('ADMIN') ||
    session.user.roles?.includes('ACCOUNTANT');

  if (!hasPermission) {
    redirect('/dashboard/payments');
  }

  // Fetch customers and suppliers
  const [customers, suppliers] = await Promise.all([
    prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Create Payment</h1>
            <p className="mt-1 text-sm text-gray-600">
              Record a new payment from a customer or supplier
            </p>
          </div>

          <div className="p-6">
            <PaymentForm customers={customers} suppliers={suppliers} />
          </div>
        </div>
      </div>
    </div>
  );
}
