// app/dashboard/pos/history/page.tsx

import { POSSessionHistoryClient } from '@/components/pos/pos-session-history-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface POSHistoryPageProps {
  searchParams: {
    status?: string;
    cashierId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };
}

export default async function POSHistoryPage({ searchParams }: POSHistoryPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch sessions with filters
  const whereClause: any = {};

  if (searchParams.status) {
    whereClause.status = searchParams.status;
  }

  if (searchParams.cashierId) {
    whereClause.cashierId = searchParams.cashierId;
  }

  if (searchParams.startDate || searchParams.endDate) {
    whereClause.openedAt = {};
    if (searchParams.startDate) {
      whereClause.openedAt.gte = new Date(searchParams.startDate);
    }
    if (searchParams.endDate) {
      whereClause.openedAt.lte = new Date(searchParams.endDate);
    }
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const skip = (page - 1) * limit;

  const [sessions, total, cashiers] = await Promise.all([
    prisma.pOSSession.findMany({
      where: whereClause,
      include: {
        cashier: { select: { id: true, username: true, email: true } },
        dayBook: { select: { id: true, date: true, status: true } },
      },
      orderBy: { openedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pOSSession.count({ where: whereClause }),
    prisma.user.findMany({ orderBy: { username: 'asc' } }),
  ]);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/pos/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">POS Session History</h1>
        <p className="text-gray-600 mt-1">View and manage all POS sessions</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No sessions found</p>
          <Link href="/dashboard/pos/dashboard">
            <Button>Open New Session</Button>
          </Link>
        </Card>
      ) : (
        <POSSessionHistoryClient
          sessions={sessions}
          cashiers={cashiers}
          pagination={pagination}
          initialStatus={searchParams.status}
          initialCashierId={searchParams.cashierId}
          initialStartDate={searchParams.startDate}
          initialEndDate={searchParams.endDate}
        />
      )}
    </div>
  );
}
