import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReportsPageClient } from './reports-client';

export const metadata = {
  title: 'Reports & Analytics',
  description: 'View detailed reports and analytics',
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <ReportsPageClient />;
}
