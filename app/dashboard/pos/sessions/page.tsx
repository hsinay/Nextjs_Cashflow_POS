// app/dashboard/pos/sessions/page.tsx

import { POSSessionListClient } from '@/components/pos/pos-session-list-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllPOSSessions } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface POSSessionsPageProps {
  searchParams: Promise<{
    cashierId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
    sortField?: string;
    sortDir?: string;
  }>;
}

export default async function POSSessionsPage({ searchParams }: POSSessionsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const sp = await searchParams;
  const filters = {
    cashierId: sp.cashierId,
    status: sp.status,
    startDate: sp.startDate ? new Date(sp.startDate) : undefined,
    endDate: sp.endDate ? new Date(sp.endDate) : undefined,
    page: sp.page ? parseInt(sp.page) : 1,
    limit: sp.limit ? parseInt(sp.limit) : 20,
    sortField: sp.sortField,
    sortDir: sp.sortDir as 'asc' | 'desc' | undefined,
  };

  const { sessions, pagination } = await getAllPOSSessions(filters);
  const users = await prisma.user.findMany({ orderBy: { username: 'asc' } });

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
        initialCashierId={sp.cashierId || ''}
        initialStatus={sp.status || ''}
        initialStartDate={sp.startDate || ''}
        initialEndDate={sp.endDate || ''}
        users={users}
        sessions={sessions}
        pagination={pagination}
      />
    </div>
  );
}
