import { prisma } from '@/lib/prisma';
import { DailyCashflowReport, PaymentMethodBreakdown, SessionSummaryReport, TrendAnalysis, VarianceAnalysis } from '@/types/report.types';

export class ReportService {
  /**
   * Generate daily cashflow report
   */
  async generateDailyCashflowReport(
    startDate: Date,
    endDate: Date
  ): Promise<DailyCashflowReport[]> {
    const daybooks = await prisma.dayBook.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        entries: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return daybooks.map((daybook: any) => {
      const salesEntries = daybook.entries.filter((e: any) => e.entryType === 'SALE');
      const expenseEntries = daybook.entries.filter((e: any) => e.entryType === 'EXPENSE');
      const depositEntries = daybook.entries.filter((e: any) => e.entryType === 'BANK_DEPOSIT');
      const withdrawalEntries = daybook.entries.filter((e: any) => e.entryType === 'BANK_WITHDRAWAL');

      const salesAmount = salesEntries.reduce((sum: number, e: any) => sum + e.amount.toNumber(), 0);
      const expenses = expenseEntries.reduce((sum: number, e: any) => sum + e.amount.toNumber(), 0);
      const deposits = depositEntries.reduce((sum: number, e: any) => sum + e.amount.toNumber(), 0);
      const withdrawals = withdrawalEntries.reduce((sum: number, e: any) => sum + e.amount.toNumber(), 0);

      const closingBalance = daybook.closingCashAmount?.toNumber() || 0;
      const openingBalance = daybook.openingCashBalance.toNumber();
      const variance = closingBalance - (openingBalance + salesAmount - expenses);
      const variancePercentage = openingBalance > 0 ? (variance / openingBalance) * 100 : 0;

      return {
        date: daybook.date.toISOString(),
        openingBalance,
        salesAmount,
        expenses,
        deposits,
        withdrawals,
        closingBalance,
        variance,
        variancePercentage,
        paymentMethodBreakdown: this.getPaymentMethodBreakdown(daybook.entries),
        status: daybook.status as 'OPEN' | 'CLOSED' | 'RECONCILED',
        reconciliationNotes: daybook.notes,
      };
    });
  }

  /**
   * Generate session summary report
   */
  async generateSessionSummaryReport(
    sessionId: string
  ): Promise<SessionSummaryReport> {
    const session = await prisma.pOSSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        cashier: true,
        transactions: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    const duration = session.closedAt
      ? Math.round((session.closedAt.getTime() - session.openedAt.getTime()) / 60000)
      : Math.round((new Date().getTime() - session.openedAt.getTime()) / 60000);

    // Group transactions by product
    const productMap = new Map<string, { name: string; quantity: number; total: number }>();
    session.transactions.forEach((txn) => {
      txn.items.forEach((item) => {
        const key = item.productId;
        const existing = productMap.get(key) || {
          name: item.product.name,
          quantity: 0,
          total: 0,
        };
        existing.quantity += item.quantity;
        existing.total += item.totalPrice.toNumber();
        productMap.set(key, existing);
      });
    });

    const topProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        quantity: data.quantity,
        totalAmount: data.total,
      }));

    return {
      sessionId: session.id,
      cashierId: session.cashierId,
      cashierName: session.cashier.username,
      terminalId: session.terminalId || undefined,
      openedAt: session.openedAt,
      closedAt: session.closedAt || undefined,
      duration,
      openingBalance: session.openingCashAmount.toNumber(),
      closingBalance: session.closingCashAmount?.toNumber(),
      totalSales: session.totalSalesAmount.toNumber(),
      totalTransactions: session.totalTransactions,
      variance: session.cashVariance?.toNumber(),
      variancePercentage: session.openingCashAmount.toNumber() > 0
        ? (session.cashVariance?.toNumber() || 0) / session.openingCashAmount.toNumber() * 100
        : 0,
      paymentBreakdown: {
        cash: session.totalCashReceived.toNumber(),
        card: session.totalCardReceived.toNumber(),
        upi: 0,
        digitalWallet: session.totalDigitalReceived.toNumber(),
        credit: 0,
        other: 0,
      },
      topProducts,
      status: session.status as 'OPEN' | 'CLOSED' | 'SUSPENDED',
    };
  }

  /**
   * Generate variance analysis report
   */
  async generateVarianceAnalysis(
    startDate: Date,
    endDate: Date
  ): Promise<VarianceAnalysis> {
    const sessions = await prisma.pOSSession.findMany({
      where: {
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        closedAt: 'asc',
      },
    });

    const varianceSessions = sessions.map((s: any) => {
      const variance = s.cashVariance?.toNumber() || 0;
      const expectedAmount = s.openingCashAmount.toNumber() + s.totalSalesAmount.toNumber();
      const variancePercentage = expectedAmount > 0 ? (variance / expectedAmount) * 100 : 0;

      return {
        sessionId: s.id,
        date: s.closedAt?.toISOString() || new Date().toISOString(),
        variance,
        variancePercentage,
        status: variance === 0 ? 'RECONCILED' as const : 'UNRECONCILED' as const,
      };
    });

    const totalExpected = sessions.reduce((sum, s) => {
      return sum + s.openingCashAmount.toNumber() + s.totalSalesAmount.toNumber();
    }, 0);

    const totalActual = sessions.reduce((sum, s) => {
      return sum + (s.closingCashAmount?.toNumber() || 0);
    }, 0);

    const totalVariance = totalActual - totalExpected;
    const variancePercentage = totalExpected > 0 ? (totalVariance / totalExpected) * 100 : 0;

    // Determine trend
    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (varianceSessions.length > 1) {
      const recentVariances = varianceSessions.slice(-3).map(v => Math.abs(v.variance));
      const olderVariances = varianceSessions.slice(0, Math.min(3, varianceSessions.length - 3)).map(v => Math.abs(v.variance));
      
      if (olderVariances.length > 0) {
        const recentAvg = recentVariances.reduce((a, b) => a + b, 0) / recentVariances.length;
        const olderAvg = olderVariances.reduce((a, b) => a + b, 0) / olderVariances.length;
        if (recentAvg < olderAvg) trend = 'IMPROVING';
        else if (recentAvg > olderAvg) trend = 'DECLINING';
      }
    }

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalExpectedAmount: totalExpected,
      actualAmount: totalActual,
      variance: totalVariance,
      variancePercentage,
      variance_type: totalVariance >= 0 ? 'OVERAGE' : 'SHORTAGE',
      sessions: varianceSessions,
      trend,
    };
  }

  /**
   * Generate trend analysis report
   */
  async generateTrendAnalysis(
    startDate: Date,
    endDate: Date,
    granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'
  ): Promise<TrendAnalysis> {
    const daybooks = await prisma.dayBook.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        entries: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by granularity
    const dataMap = new Map<string, number>();
    daybooks.forEach(db => {
      const sales = db.entries
        .filter(e => e.entryType === 'SALE')
        .reduce((sum, e) => sum + e.amount.toNumber(), 0);

      const key = this.getGranularityKey(db.date, granularity);
      const existing = dataMap.get(key) || 0;
      dataMap.set(key, existing + sales);
    });

    const dataPoints = Array.from(dataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({
        date,
        value,
        label: this.formatGranularityLabel(date, granularity),
      }));

    const values = dataPoints.map(p => p.value);
    const averageValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Calculate growth rate
    let growthRate = 0;
    if (dataPoints.length > 1) {
      const first = dataPoints[0].value;
      const last = dataPoints[dataPoints.length - 1].value;
      growthRate = first > 0 ? ((last - first) / first) * 100 : 0;
    }

    // Determine trend
    let trend: 'UPWARD' | 'DOWNWARD' | 'STABLE' = 'STABLE';
    if (growthRate > 5) trend = 'UPWARD';
    else if (growthRate < -5) trend = 'DOWNWARD';

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      dataPoints,
      averageValue,
      minValue,
      maxValue,
      trend,
      growthRate,
    };
  }

  /**
   * Helper: Get payment method breakdown from entries
   */
  private getPaymentMethodBreakdown(entries: any[]): PaymentMethodBreakdown {
    const breakdown = {
      cash: 0,
      card: 0,
      upi: 0,
      digitalWallet: 0,
      credit: 0,
      other: 0,
    };

    entries.forEach(entry => {
      if (entry.paymentMethod === 'CASH') breakdown.cash += entry.amount.toNumber();
      else if (entry.paymentMethod === 'CARD') breakdown.card += entry.amount.toNumber();
      else if (entry.paymentMethod === 'UPI') breakdown.upi += entry.amount.toNumber();
      else if (entry.paymentMethod === 'DIGITAL_WALLET') breakdown.digitalWallet += entry.amount.toNumber();
      else if (entry.paymentMethod === 'CREDIT') breakdown.credit += entry.amount.toNumber();
      else breakdown.other += entry.amount.toNumber();
    });

    return breakdown;
  }

  /**
   * Helper: Get granularity key
   */
  private getGranularityKey(date: Date, granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY'): string {
    const d = new Date(date);
    if (granularity === 'DAILY') {
      return d.toISOString().split('T')[0];
    } else if (granularity === 'WEEKLY') {
      const week = Math.floor((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay() - 1) / 7);
      return `${d.getFullYear()}-W${week + 1}`;
    } else {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  /**
   * Helper: Format granularity label
   */
  private formatGranularityLabel(key: string, granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY'): string {
    if (granularity === 'DAILY') {
      const date = new Date(key);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } else if (granularity === 'WEEKLY') {
      return key;
    } else {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
  }
}

export const reportService = new ReportService();
