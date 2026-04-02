'use client';

import { SessionDisplay } from '@/components/pos/session-display';
import { SessionOpener } from '@/components/pos/session-opener';
import { SessionStatusBadge } from '@/components/pos/session-status-badge';
import { H1, H2, H3, Small } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePOSSession } from '@/hooks/use-pos-session';
import { BorderRadius, Colors, Spacing } from '@/lib/design-tokens';
import { formatCurrency } from '@/lib/utils';
import { Clock, ShoppingCart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function POSDashboardPage() {
  const { session, summary, loading } = usePOSSession();

  const handleSessionOpened = () => {
    // Refresh the page or update session state after opening
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <H1>POS Dashboard</H1>
        </div>
        <p style={{ color: Colors.text.secondary }}>Loading session information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H1>POS Dashboard</H1>
          <Small color={Colors.text.secondary} className="mt-2">Manage your point of sale sessions</Small>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/pos/history">
            <Button variant="outline">Session History</Button>
          </Link>
          <Link href="/dashboard/pos">
            <Button style={{ backgroundColor: Colors.primary.start, color: '#ffffff' }} className="hover:opacity-90">
              Open POS Terminal
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Session */}
        <div className="lg:col-span-2 space-y-6">
          {session ? (
            <>
              {/* Active Session Display */}
              <SessionDisplay session={session} />

              {/* Quick Actions */}
              <Card className="p-6">
                <H3>Quick Actions</H3>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link href="/dashboard/pos">
                    <Button style={{ backgroundColor: Colors.success, color: '#ffffff' }} className="hover:opacity-90">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Process Payment
                    </Button>
                  </Link>
                  <Link href={`/dashboard/pos/sessions/${session.id}`}>
                    <Button variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Session Metrics */}
              {summary && (
                <Card className="p-6 space-y-4">
                  <H3>Session Summary</H3>
                  <div className="grid grid-cols-2 gap-4">
                    <div style={{ backgroundColor: Colors.status.paid.light, padding: Spacing.md, borderRadius: BorderRadius.lg, border: `1px solid ${Colors.status.paid.light}` }}>
                      <Small color={Colors.status.paid.dark} className="font-semibold block mb-1">Total Sales</Small>
                      <p className="text-2xl font-bold" style={{ color: Colors.status.paid.dark }}>
                        {formatCurrency(Number(summary.totalSales))}
                      </p>
                    </div>
                    <div style={{ backgroundColor: Colors.primary.light, padding: Spacing.md, borderRadius: BorderRadius.lg, border: `1px solid ${Colors.primary.lighter}` }}>
                      <Small color={Colors.primary.start} className="font-semibold block mb-1">Transactions</Small>
                      <p className="text-2xl font-bold" style={{ color: Colors.primary.start }}>
                        {summary.totalTransactions}
                      </p>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div style={{ backgroundColor: Colors.gray[50], padding: Spacing.md, borderRadius: BorderRadius.lg, border: `1px solid ${Colors.gray[200]}` }}>
                    <Small color={Colors.text.secondary} className="font-semibold block mb-3">Payment Methods</Small>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: Colors.text.primary }}>Cash</span>
                        <span className="font-semibold" style={{ color: Colors.text.primary }}>
                          {formatCurrency(Number(summary.paymentBreakdown.cash))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: Colors.text.primary }}>Card</span>
                        <span className="font-semibold" style={{ color: Colors.text.primary }}>
                          {formatCurrency(Number(summary.paymentBreakdown.card))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: Colors.text.primary }}>Digital</span>
                        <span className="font-semibold" style={{ color: Colors.text.primary }}>
                          {formatCurrency(Number(summary.paymentBreakdown.digital))}
                        </span>
                      </div>
                      <div style={{ borderTop: `1px solid ${Colors.gray[200]}`, paddingTop: Spacing.sm, marginTop: Spacing.sm }} className="flex justify-between text-sm font-bold">
                        <span style={{ color: Colors.text.primary }}>Total</span>
                        <span style={{ color: Colors.success }}>
                          {formatCurrency(Number(summary.paymentBreakdown.total))}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6">
              <div className="text-center py-12">
                <Clock className="w-12 h-12" style={{ color: Colors.gray[400] }} />
                <H3 className="mt-4">No Active Session</H3>
                <Small color={Colors.text.secondary} className="mt-2">
                  Open a new session to start processing payments
                </Small>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Session Opener */}
        <div>
          {!session ? (
            <SessionOpener onSessionOpened={handleSessionOpened} />
          ) : (
            <Card className="p-6" style={{ backgroundColor: Colors.primary.light, borderColor: Colors.primary.lighter }}>
              <div className="flex items-center justify-between mb-4">
                <H3>Session Status</H3>
                <SessionStatusBadge status={session.status} />
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <Small color={Colors.text.secondary}>Opened</Small>
                  <p className="font-semibold" style={{ color: Colors.text.primary }}>
                    {new Date(session.openedAt).toLocaleTimeString()}
                  </p>
                </div>

                {session.terminalId && (
                  <div>
                    <Small color={Colors.text.secondary}>Terminal</Small>
                    <p className="font-semibold" style={{ color: Colors.text.primary }}>{session.terminalId}</p>
                  </div>
                )}

                {session.dayBook && (
                  <div style={{ backgroundColor: Colors.gray[50], borderRadius: BorderRadius.md, padding: Spacing.md, border: `1px solid ${Colors.gray[200]}` }}>
                    <Small color={Colors.text.secondary} className="block">Day Book</Small>
                    <p className="font-semibold" style={{ color: Colors.text.primary }}>
                      {new Date(session.dayBook.date).toLocaleDateString()}
                    </p>
                    <Small color={Colors.text.secondary} className="mt-1 block">Status: {session.dayBook.status}</Small>
                  </div>
                )}
              </div>

              <Link href={`/dashboard/pos/sessions/${session.id}`}>
                <Button variant="outline" className="w-full mt-4">
                  Full Details
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <H2>Recent Sessions</H2>
        <Link href="/dashboard/pos/history" className="mt-4 block">
          <Button variant="outline">View Full History →</Button>
        </Link>
      </div>
    </div>
  );
}
