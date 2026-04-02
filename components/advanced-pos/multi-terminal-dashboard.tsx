'use client';

import { H2, KPICard, Small, StatusBadge } from '@/components/ui';
import { Colors, Typography } from '@/lib/design-tokens';
import { formatCurrency } from '@/lib/utils';
import { Terminal, TerminalDashboard } from '@/types/advanced-pos.types';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MultiTerminalDashboardProps {
  data: TerminalDashboard;
}

export function MultiTerminalDashboard({ data }: MultiTerminalDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Terminals"
          value={data.totalTerminals.toString()}
          subtext={`${data.onlineTerminals} online`}
        />
        <KPICard
          title="Active Sessions"
          value={data.totalActiveSessions.toString()}
          subtext="Currently open"
        />
        <KPICard
          title="Total Sales"
          value={formatCurrency(data.totalSalesAllTerminals)}
          subtext={`${data.totalTransactionsAllTerminals} transactions`}
        />
        <KPICard
          title="Online Rate"
          value={`${((data.onlineTerminals / data.totalTerminals) * 100).toFixed(0)}%`}
          subtext="Terminals active"
        />
      </div>

      {/* Terminals Grid */}
      <div style={{ backgroundColor: Colors.background, borderRadius: Typography.borderRadius.lg, border: `1px solid ${Colors.gray[200]}`, padding: Typography.spacing.lg }}>
        <H2>Terminals Status</H2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {data.terminals.map(terminal => (
            <TerminalCard key={terminal.id} terminal={terminal} />
          ))}
        </div>
      </div>

      {/* Active Sessions */}
      {data.activeSessions.length > 0 && (
        <div style={{ backgroundColor: Colors.background, borderRadius: Typography.borderRadius.lg, border: `1px solid ${Colors.gray[200]}`, padding: Typography.spacing.lg }}>
          <H2>Active Sessions</H2>
          <div className="space-y-3 mt-4">
            {data.activeSessions.map(session => (
              <div
                key={session.sessionId}
                style={{
                  padding: Typography.spacing.md,
                  backgroundColor: Colors.primary.light,
                  border: `1px solid ${Colors.primary.lighter}`,
                  borderRadius: Typography.borderRadius.md
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: Colors.text.primary }}>
                      Terminal: {session.terminalId}
                    </p>
                    <Small color={Colors.text.secondary} className="mt-1">
                      {session.transactionCount} transactions
                    </Small>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: Colors.primary.main }}>
                      {formatCurrency(session.totalSales)}
                    </p>
                    <Small color={Colors.text.secondary} className="mt-1">
                      {new Date(session.openedAt).toLocaleTimeString()}
                    </Small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TerminalCardProps {
  terminal: Terminal;
}

function TerminalCard({ terminal }: TerminalCardProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') return 'APPROVED';
    if (status === 'OFFLINE') return 'REJECTED';
    return 'PENDING';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ACTIVE') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'OFFLINE') return <AlertCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div style={{ border: `1px solid ${Colors.gray[200]}`, borderRadius: Typography.borderRadius.md, padding: Typography.spacing.md }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold" style={{ color: Colors.text.primary }}>{terminal.name}</p>
          <Small color={Colors.text.secondary} className="mt-1">{terminal.terminalId}</Small>
        </div>
        <StatusBadge status={getStatusBadge(terminal.status) as any} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <Small color={Colors.text.secondary}>Location:</Small>
          <span className="font-medium" style={{ color: Colors.text.primary }}>{terminal.location}</span>
        </div>
        {terminal.ipAddress && (
          <div className="flex justify-between">
            <Small color={Colors.text.secondary}>IP:</Small>
            <span className="text-mono text-xs" style={{ color: Colors.text.primary }}>{terminal.ipAddress}</span>
          </div>
        )}
        <div style={{ paddingTop: Typography.spacing.sm, borderTop: `1px solid ${Colors.gray[200]}`, marginTop: Typography.spacing.sm }}>
          <div className="flex justify-between">
            <Small color={Colors.text.secondary}>Last Activity:</Small>
            <Small color={Colors.text.secondary}>
              {new Date(terminal.lastActivityAt).toLocaleTimeString()}
            </Small>
          </div>
        </div>
      </div>
    </div>
  );
}

