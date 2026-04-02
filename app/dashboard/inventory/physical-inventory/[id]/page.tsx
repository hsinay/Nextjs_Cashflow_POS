import { CompleteDialog } from '@/components/physical-inventory/complete-dialog';
import { ConfirmDialog } from '@/components/physical-inventory/confirm-dialog';
import { CountLineForm } from '@/components/physical-inventory/count-line-form';
import { CountLineTable } from '@/components/physical-inventory/count-line-table';
import { StatusBadge } from '@/components/physical-inventory/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import {
    getCountLines,
    getPhysicalInventory,
} from '@/services/physical-inventory.service';
import { Check, ChevronLeft, Clock, FileText } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type PageProps = {
  params: { id: string };
};

export default async function PhysicalInventoryDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session?.user) {
    redirect('/login');
  }

  // Check permissions
  const hasPermission =
    (session.user as any).roles?.includes('ADMIN') ||
    (session.user as any).roles?.includes('INVENTORY_MANAGER');

  if (!hasPermission) {
    redirect('/dashboard');
  }

  let pi = null;
  let lines: any[] = [];
  let error: string | null = null;

  try {
    pi = await getPhysicalInventory(params.id);
    if (!pi) {
      redirect('/dashboard/inventory/physical-inventory');
    }

    const result = await getCountLines(params.id, {
      physicalInventoryId: params.id,
      page: 1,
      limit: 100,
    });
    lines = result.lines;
  } catch (err: any) {
    error = err.message;
  }

  if (!pi) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Physical inventory session not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard/inventory/physical-inventory">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              {pi.referenceNumber}
            </h1>
            <p className="text-slate-600 mt-2">
              {pi.location?.name} • {new Date(pi.countDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            {pi.status === 'DRAFT' && (
              <ConfirmDialog piId={pi.id} />
            )}
            {pi.status === 'CONFIRMED' && (
              <CompleteDialog piId={pi.id} />
            )}
            {pi.status === 'DONE' && (
              <Link href={`/dashboard/inventory/physical-inventory/${pi.id}/report`}>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Status & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={pi.status} />
          </CardContent>
        </Card>

        {/* Count Method Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Count Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{pi.countMethod}</p>
          </CardContent>
        </Card>

        {/* Items Counted Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Items Counted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{lines.length}</p>
          </CardContent>
        </Card>

        {/* Variance Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-lg font-bold ${
                pi.totalVariance === 0
                  ? 'text-green-600'
                  : pi.totalVariance > 0
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {pi.totalVariance > 0 ? '+' : ''}{pi.totalVariance || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Count Lines Table */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Count Lines</h2>
            <CountLineTable
              lines={lines}
              piId={pi.id}
              piStatus={pi.status}
            />
          </div>
        </div>

        {/* Right: Add Count Form (only in DRAFT) */}
        {pi.status === 'DRAFT' && (
          <div className="lg:col-span-1">
            <CountLineForm
              piId={pi.id}
            />
          </div>
        )}

        {/* Right: Status Info (not in DRAFT) */}
        {pi.status !== 'DRAFT' && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Created</p>
                    <p className="font-medium">
                      {new Date(pi.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {pi.status !== 'DRAFT' && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Check className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-600">Confirmed</p>
                      <p className="font-medium">
                        {pi.confirmedAt ? new Date(pi.confirmedAt).toLocaleString() : 'In progress'}
                      </p>
                    </div>
                  </div>
                )}

                {pi.status === 'DONE' && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600">Completed</p>
                      <p className="font-medium">
                        {pi.updatedAt ? new Date(pi.updatedAt).toLocaleString() : 'Done'}
                      </p>
                    </div>
                  </div>
                )}

                {pi.notes && (
                  <div className="mt-4 p-3 bg-slate-50 rounded">
                    <p className="text-sm text-slate-600 mb-1">Notes</p>
                    <p className="text-sm">{pi.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
