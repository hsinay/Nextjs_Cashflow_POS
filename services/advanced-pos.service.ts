import { prisma } from '@/lib/prisma';
import { ReceiptInput, RefundRequestInput, ShiftInput, TerminalInput } from '@/lib/validations/advanced-pos.schema';
import {
    PeakHour,
    Receipt,
    Refund,
    RefundStatus,
    Shift,
    Terminal,
    TerminalDashboard,
    TerminalPerformanceMetrics,
    TopProduct,
} from '@/types/advanced-pos.types';

export class AdvancedPOSService {
  /**
   * Generate receipt
   */
  async generateReceipt(data: ReceiptInput): Promise<Receipt> {
    // Validate transaction exists
    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: data.transactionId },
    });

    const receiptNumber = `REC-${Date.now()}`;

    // In a real system, this would save to database
    return {
      id: `receipt-${Date.now()}`,
      transactionId: data.transactionId,
      receiptNumber,
      format: data.format,
      generatedAt: new Date(),
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      discount: data.discount,
      total: data.subtotal + data.tax - data.discount,
      paymentMethod: transaction.paymentMethod,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      storeInfo: data.storeInfo,
    };
  }

  /**
   * Create refund request
   */
  async createRefundRequest(
    data: RefundRequestInput,
    _userId: string
  ): Promise<Refund> {
    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: data.transactionId },
    });

    // Validate refund amount doesn't exceed transaction amount
    if (data.refundAmount > transaction.totalAmount.toNumber()) {
      throw new Error('Refund amount cannot exceed transaction amount');
    }

    // In a real system, this would be saved to database
    return {
      id: `refund-${Date.now()}`,
      transactionId: data.transactionId,
      originalAmount: transaction.totalAmount.toNumber(),
      refundAmount: data.refundAmount,
      reason: data.reason,
      status: 'PENDING' as RefundStatus,
      requestedAt: new Date(),
      notes: data.notes,
      paymentMethod: transaction.paymentMethod as any,
    };
  }

  /**
   * Approve/reject refund
   */
  async updateRefundStatus(
    refundId: string,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string,
    notes?: string
  ): Promise<Refund> {
    // In a real system, this would update the database
    return {
      id: refundId,
      transactionId: '',
      originalAmount: 0,
      refundAmount: 0,
      reason: 'CUSTOMER_REQUEST',
      status: status as RefundStatus,
      requestedAt: new Date(),
      approvedAt: new Date(),
      approvedBy,
      notes,
      paymentMethod: 'CASH',
    };
  }

  /**
   * Register terminal
   * Note: Terminal registration requires POSTerminal model in Prisma schema
   */
  async registerTerminal(data: TerminalInput): Promise<Terminal> {
    // Stub implementation - POSTerminal model not defined in schema
    // TODO: Add POSTerminal model to prisma/schema.prisma
    return {
      id: `terminal-${Date.now()}`,
      terminalId: data.terminalId,
      name: data.name,
      location: data.location,
      status: 'ACTIVE',
      lastActivityAt: new Date(),
      ipAddress: data.ipAddress,
      deviceModel: data.deviceModel,
      serialNumber: data.serialNumber,
    };
  }

  /**
   * Get all terminals
   * Note: Terminal retrieval requires POSTerminal model in Prisma schema
   */
  async getAllTerminals(): Promise<Terminal[]> {
    // Stub implementation - POSTerminal model not defined in schema
    // TODO: Add POSTerminal model to prisma/schema.prisma
    return [];
  }

  /**
   * Get terminal dashboard
   */
  async getTerminalDashboard(): Promise<TerminalDashboard> {
    const terminals = await this.getAllTerminals();
    const sessions = await prisma.pOSSession.findMany({
      where: { status: 'OPEN' },
      include: { dayBook: true },
    });

    const onlineTerminals = terminals.filter(t => t.status === 'ACTIVE').length;
    const totalSalesAllTerminals = sessions.reduce((sum: number, s: any) => sum + s.totalSalesAmount.toNumber(), 0);
    const totalTransactionsAllTerminals = sessions.reduce((sum, s) => sum + s.totalTransactions, 0);

    return {
      terminals,
      activeSessions: sessions.map(s => ({
        terminalId: s.terminalId || 'DEFAULT',
        sessionId: s.id,
        openedAt: s.openedAt,
        closedAt: s.closedAt || undefined,
        totalSales: s.totalSalesAmount.toNumber(),
        transactionCount: s.totalTransactions,
        status: s.status as 'ACTIVE' | 'CLOSED',
      })),
      totalActiveSessions: sessions.length,
      totalTerminals: terminals.length,
      onlineTerminals,
      totalSalesAllTerminals,
      totalTransactionsAllTerminals,
    };
  }

  /**
   * Open shift
   * Note: Shift management requires Shift model in Prisma schema
   */
  async openShift(data: ShiftInput, _cashierId: string): Promise<Shift> {
    // Stub implementation - Shift model not defined in schema
    // TODO: Add Shift model to prisma/schema.prisma
    const now = new Date();
    return {
      id: `shift-${Date.now()}`,
      terminalId: data.terminalId,
      cashierId: data.cashierId,
      type: data.type as any,
      startTime: now,
      endTime: undefined,
      status: 'OPEN' as any,
      openingBalance: data.openingBalance,
      closingBalance: undefined,
      totalSales: 0,
      variance: undefined,
      notes: data.notes,
    };
  }

  /**
   * Close shift
   * Note: Shift management requires Shift model in Prisma schema
   */
  async closeShift(shiftId: string, closingBalance: number, notes?: string): Promise<Shift> {
    // Stub implementation - Shift model not defined in schema
    // TODO: Add Shift model to prisma/schema.prisma
    const now = new Date();
    return {
      id: shiftId,
      terminalId: '',
      cashierId: '',
      type: 'REGULAR' as any,
      startTime: now,
      endTime: now,
      status: 'CLOSED' as any,
      openingBalance: 0,
      closingBalance: closingBalance,
      totalSales: 0,
      variance: 0,
      notes: notes,
    };
  }

  /**
   * Get terminal performance metrics
   */
  async getTerminalPerformanceMetrics(terminalId: string, period: string): Promise<TerminalPerformanceMetrics> {
    const [startDate, endDate] = this.parsePeriod(period);

    const sessions = await prisma.pOSSession.findMany({
      where: {
        terminalId: terminalId,
        openedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
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

    const transactionCount = sessions.reduce((sum, s) => sum + s.totalTransactions, 0);
    const totalSalesAmount = sessions.reduce((sum, s) => sum + s.totalSalesAmount.toNumber(), 0);
    const averageTransactionValue = transactionCount > 0 ? totalSalesAmount / transactionCount : 0;

    // Payment breakdown
    const paymentMethodBreakdown: Record<string, number> = {
      'CASH': sessions.reduce((sum, s) => sum + s.totalCashReceived.toNumber(), 0),
      'CARD': sessions.reduce((sum, s) => sum + s.totalCardReceived.toNumber(), 0),
      'DIGITAL': sessions.reduce((sum, s) => sum + s.totalDigitalReceived.toNumber(), 0),
    };

    // Top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    sessions.forEach(session => {
      session.transactions.forEach(txn => {
        txn.items.forEach(item => {
          const key = item.productId;
          const existing = productMap.get(key) || {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice.toNumber();
          productMap.set(key, existing);
        });
      });
    });

    const topSellingProducts: TopProduct[] = Array.from(productMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
        percentOfTotal: totalSalesAmount > 0 ? (data.revenue / totalSalesAmount) * 100 : 0,
      }));

    // Peak hours (dummy - would need more detailed timestamp tracking)
    const peakHours: PeakHour[] = [];

    return {
      terminalId: terminalId,
      terminalName: `Terminal ${terminalId}`,
      period,
      transactionCount,
      totalSalesAmount,
      averageTransactionValue,
      paymentMethodBreakdown,
      topSellingProducts,
      peakHours,
      averageTransactionTime: 45, // seconds
      paymentSuccessRate: 99.5,
    };
  }

  /**
   * Helper: Parse period string
   */
  private parsePeriod(period: string): [Date, Date] {
    const end = new Date();
    let start = new Date();

    if (period === 'TODAY') {
      start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    } else if (period === 'THIS_WEEK') {
      start.setDate(start.getDate() - start.getDay());
    } else if (period === 'THIS_MONTH') {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    } else if (period === 'THIS_YEAR') {
      start = new Date(start.getFullYear(), 0, 1);
    } else if (period === 'LAST_7_DAYS') {
      start.setDate(start.getDate() - 7);
    } else if (period === 'LAST_30_DAYS') {
      start.setDate(start.getDate() - 30);
    }

    return [start, end];
  }
}

export const advancedPOSService = new AdvancedPOSService();
