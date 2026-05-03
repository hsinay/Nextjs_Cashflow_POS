import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { daybookService } from '@/services/daybook.service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { DayBookSummary } from '@/components/daybook/daybook-summary';
import { EntriesList } from '@/components/daybook/entries-list';

interface DayBookPageProps {
  params: { id: string };
}

export default async function DayBookPage({ params }: DayBookPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const daybook = await daybookService.getDayBook(params.id);

  if (!daybook) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/pos/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="p-6 text-center">
          <p className="text-gray-600">Day book not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/pos/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Day Book</h1>
          <p className="text-gray-600 mt-1">Cash reconciliation and entries for the selected date</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Entries list (client) */}
          <EntriesList entries={daybook.entries || []} isOpen={daybook.status === 'OPEN'} />
        </div>

        <div>
          {/* Summary card (client) */}
          <DayBookSummary daybook={daybook} />
        </div>
      </div>
    </div>
  );
}
