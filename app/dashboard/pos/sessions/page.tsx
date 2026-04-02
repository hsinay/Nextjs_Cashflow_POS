// app/dashboard/pos/sessions/page.tsx

import { POSSessionListClient } from '@/components/pos/pos-session-list-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllPOSSessions } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface POSSessionsPageProps {
  searchParams: {
    cashierId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };
}

export default async function POSSessionsPage({ searchParams }: POSSessionsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const filters = {
    cashierId: searchParams.cashierId,
    status: searchParams.status,
    startDate: searchParams.startDate ? new Date(searchParams.startDate) : undefined,
    endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
  }

  const { sessions, pagination } = await getAllPOSSessions(filters);
  const users = await prisma.user.findMany({ orderBy: { username: 'asc' }}); // Assuming all users can be cashiers

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">POS Sessions</h1>
          <p className="text-gray-600 mt-1">
            View and manage Point of Sale sessions.
          </p>
        </div>
      </div>

      <POSSessionListClient
        initialCashierId={searchParams.cashierId || ''}
        initialStatus={searchParams.status || ''}
        initialStartDate={searchParams.startDate || ''}
        initialEndDate={searchParams.endDate || ''}
        users={users}
        sessions={sessions}
        pagination={pagination}
      />
    </div>
  );
}
