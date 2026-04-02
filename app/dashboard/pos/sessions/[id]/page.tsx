'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { SessionStatusBadge } from '@/components/pos/session-status-badge';
import { SessionCloser } from '@/components/pos/session-closer';
import { POSSessionWithRelations } from '@/types/pos-session.types';
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<POSSessionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/pos-sessions/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch session');

        const data = await res.json();
        setSession(data.data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load session',
          variant: 'destructive',
        });
        router.push('/dashboard/pos/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/pos/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/pos/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Session not found</p>
        </Card>
      </div>
    );
  }

  const handleSessionClosed = () => {
    toast({
      title: 'Session Closed',
      description: 'Session has been successfully closed.',
    });
    router.push('/dashboard/pos/history');
  };

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
          <h1 className="text-3xl font-bold">Session Details</h1>
          <p className="text-gray-600 mt-1">ID: {session.id}</p>
        </div>
        <SessionStatusBadge status={session.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Overview */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Session Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cashier</p>
                <p className="font-semibold text-gray-900">{session.cashier?.username}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Terminal</p>
                <p className="font-semibold text-gray-900">{session.terminalId || 'Default'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Opened</p>
                <p className="font-semibold text-gray-900">
                  {new Date(session.openedAt).toLocaleString()}
                </p>
              </div>

              {session.closedAt && (
                <div>
                  <p className="text-sm text-gray-600">Closed</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(session.closedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {session.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-gray-900 mt-1">{session.notes}</p>
              </div>
            )}
          </Card>

          {/* Financial Summary */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Financial Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-700">Opening Cash</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(Number(session.openingCashAmount))}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                <span className="text-blue-700">Total Sales</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(Number(session.totalSalesAmount))}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                <span className="text-green-700">Cash Received</span>
                <span className="font-bold text-green-900">
                  {formatCurrency(Number(session.totalCashReceived))}
                </span>
              </div>

              {session.closingCashAmount && (
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-200">
                  <span className="text-purple-700">Closing Cash</span>
                  <span className="font-bold text-purple-900">
                    {formatCurrency(Number(session.closingCashAmount))}
                  </span>
                </div>
              )}

              {session.cashVariance && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded border border-orange-200">
                  <span className="text-orange-700">Variance</span>
                  <span className="font-bold text-orange-900">
                    {formatCurrency(Number(session.cashVariance))}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Payment Methods</h2>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Cash</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(Number(session.totalCashReceived))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Card</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(Number(session.totalCardReceived))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Digital Wallet</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(Number(session.totalDigitalReceived))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200 font-bold">
                <span className="text-green-700">Total</span>
                <span className="text-green-900">
                  {formatCurrency(
                    Number(session.totalCashReceived) +
                      Number(session.totalCardReceived) +
                      Number(session.totalDigitalReceived)
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Transactions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Transactions</h2>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="font-bold text-lg text-blue-900">{session.totalTransactions}</p>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Sidebar: Day Book & Close Session */}
        <div className="space-y-6">
          {/* Day Book Info */}
          {session.dayBook && (
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Day Book</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(session.dayBook.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">{session.dayBook.status}</p>
                </div>
              </div>
              <Link href={`/dashboard/daybook/${session.dayBookId}`}>
                <Button variant="outline" className="w-full">
                  View Day Book
                </Button>
              </Link>
            </Card>
          )}

          {/* Close Session */}
          {session.status === 'OPEN' && (
            <SessionCloser session={session} onSessionClosed={handleSessionClosed} />
          )}

          {/* Closed Info */}
          {session.status === 'CLOSED' && (
            <Card className="p-6 space-y-4 bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-green-900">Session Closed</h3>
              <p className="text-sm text-green-700">
                This session is closed and cannot accept new payments.
              </p>
              <Link href="/dashboard/pos/history">
                <Button variant="outline" className="w-full">
                  View History
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Add missing import
import { ShoppingCart } from 'lucide-react';
