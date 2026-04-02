"use client";

import { H3, Small, StatusBadge } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { Colors, Typography } from "@/lib/design-tokens";
import { DayBookStatus } from "@prisma/client";

interface DayBook {
  id: string;
  date: Date | string;
  status: DayBookStatus;
  openingCashBalance: number | { toNumber: () => number };
  openingBankBalance: number | { toNumber: () => number };
  closingCashBalance?: number | { toNumber: () => number } | null;
  closingBankBalance?: number | { toNumber: () => number } | null;
  expectedCashBalance?: number | { toNumber: () => number } | null;
  actualCashBalance?: number | { toNumber: () => number } | null;
  cashVariance?: number | { toNumber: () => number } | null;
  isReconciled: boolean;
  _count?: { entries: number };
  openedBy?: { username: string };
  closedBy?: { username: string };
}

interface DayBookSummaryProps {
  daybook: DayBook;
}

function getValue(value: any): number {
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") return value.toNumber();
  return 0;
}

function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusMap: Record<DayBookStatus, string> = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  CLOSED: "CLOSED",
  APPROVED: "APPROVED",
};

export function DayBookSummary({ daybook }: DayBookSummaryProps) {
  const openingCash = getValue(daybook.openingCashBalance);
  const openingBank = getValue(daybook.openingBankBalance);
  const closingCash = getValue(daybook.closingCashBalance);
  const closingBank = getValue(daybook.closingBankBalance);
  const expectedCash = getValue(daybook.expectedCashBalance);
  const actualCash = getValue(daybook.actualCashBalance);
  const variance = getValue(daybook.cashVariance);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ borderBottom: `1px solid ${Colors.gray[200]}`, paddingBottom: '16px' }}>
          <div>
            <H3>{formatDate(daybook.date)}</H3>
            <Small color={Colors.text.secondary}>
              Opened by {daybook.openedBy?.username}
            </Small>
          </div>
          <StatusBadge status={statusMap[daybook.status] as any} />
        </div>

        {/* Opening Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div style={{ padding: Typography.spacing.md, backgroundColor: Colors.gray[50], borderRadius: Typography.borderRadius.md }}>
            <Small color={Colors.text.secondary} className="block mb-1">Opening Cash</Small>
            <p className="text-lg font-semibold" style={{ color: Colors.text.primary }}>
              {formatCurrency(openingCash)}
            </p>
          </div>
          <div style={{ padding: Typography.spacing.md, backgroundColor: Colors.gray[50], borderRadius: Typography.borderRadius.md }}>
            <Small color={Colors.text.secondary} className="block mb-1">Opening Bank</Small>
            <p className="text-lg font-semibold" style={{ color: Colors.text.primary }}>
              {formatCurrency(openingBank)}
            </p>
          </div>
        </div>

        {/* Closing Balances - Only show if closed */}
        {daybook.status !== "OPEN" && (
          <div className="grid grid-cols-2 gap-4">
            <div style={{ padding: Typography.spacing.md, backgroundColor: Colors.primary.light, borderRadius: Typography.borderRadius.md, border: `1px solid ${Colors.primary.lighter}` }}>
              <Small color={Colors.primary.start} className="block mb-1">Closing Cash</Small>
              <p className="text-lg font-semibold" style={{ color: Colors.primary.main }}>
                {formatCurrency(closingCash)}
              </p>
            </div>
            <div style={{ padding: Typography.spacing.md, backgroundColor: Colors.primary.light, borderRadius: Typography.borderRadius.md, border: `1px solid ${Colors.primary.lighter}` }}>
              <Small color={Colors.primary.start} className="block mb-1">Closing Bank</Small>
              <p className="text-lg font-semibold" style={{ color: Colors.primary.main }}>
                {formatCurrency(closingBank)}
              </p>
            </div>
          </div>
        )}

        {/* Reconciliation - Show if reconciliation data available */}
        {daybook.status !== "OPEN" && expectedCash !== undefined && (
          <div style={{ borderTop: `1px solid ${Colors.gray[200]}`, paddingTop: '16px', display: "flex", flexDirection: "column", gap: '12px' }}>
            <Small className="font-semibold" style={{ color: Colors.text.primary }}>Reconciliation</Small>
            <div className="grid grid-cols-2 gap-3">
              <div style={{ padding: Typography.spacing.sm, backgroundColor: Colors.gray[50], borderRadius: Typography.borderRadius.md }}>
                <Small color={Colors.text.secondary} className="block mb-1">Expected Cash</Small>
                <p className="font-semibold" style={{ color: Colors.text.primary }}>
                  {formatCurrency(expectedCash)}
                </p>
              </div>
              <div style={{ padding: Typography.spacing.sm, backgroundColor: Colors.gray[50], borderRadius: Typography.borderRadius.md }}>
                <Small color={Colors.text.secondary} className="block mb-1">Actual Cash</Small>
                <p className="font-semibold" style={{ color: Colors.text.primary }}>
                  {formatCurrency(actualCash)}
                </p>
              </div>
            </div>

            {/* Variance Display */}
            <div
              style={{
                padding: Typography.spacing.md,
                backgroundColor: daybook.isReconciled ? Colors.status.paid.light : Colors.status.rejected.light,
                border: `1px solid ${daybook.isReconciled ? Colors.status.paid.lighter : Colors.status.rejected.lighter}`,
                borderRadius: Typography.borderRadius.md
              }}
            >
              <Small color={Colors.text.secondary} className="block mb-1">Variance</Small>
              <p
                className="text-lg font-semibold"
                style={{
                  color: daybook.isReconciled ? Colors.status.paid.main : Colors.status.rejected.main
                }}
              >
                {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
              </p>
              {daybook.isReconciled && (
                <Small color={Colors.status.paid.main} className="mt-2 block">✓ Reconciled</Small>
              )}
            </div>
          </div>
        )}

        {/* Entry count */}
        {daybook._count && (
          <div style={{ borderTop: `1px solid ${Colors.gray[200]}`, paddingTop: Typography.spacing.lg }}>
            <Small color={Colors.text.secondary}>
              <span className="font-semibold" style={{ color: Colors.text.primary }}>{daybook._count.entries}</span>{" "}
              transaction{daybook._count.entries !== 1 ? "s" : ""}
            </Small>
          </div>
        )}
      </div>
    </Card>
  );
}
