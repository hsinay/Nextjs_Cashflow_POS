import { prisma } from '@/lib/prisma';
import { POSSessionStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface CreatePOSSessionInput {
  cashierId: string;
  terminalId?: string;
  openingCashAmount: number | Decimal;
  notes?: string;
}

export interface ClosePOSSessionInput {
  closingCashAmount: number | Decimal;
  notes?: string;
}

export interface POSSessionWithRelations {
  id: string;
  cashierId: string;
  terminalId?: string | null;
  dayBookId?: string | null;
  status: POSSessionStatus;
  openingCashAmount: Decimal;
  closingCashAmount?: Decimal | null;
  totalSalesAmount: Decimal;
  totalCashReceived: Decimal;
  totalCardReceived: Decimal;
  totalDigitalReceived: Decimal;
  totalTransactions: number;
  cashVariance: Decimal;
  openedAt: Date;
  closedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  cashier?: {
    id: string;
    username: string;
    email: string;
  };
  dayBook?: {
    id: string;
    date: Date;
    status: string;
  } | null;
}

/**
 * POS Session Service
 * Manages POS session lifecycle and day book integration
 */
export const posSessionService = {
  /**
   * Create a new POS session
   * Automatically creates or links to day book for current date
   */
  async createSession(input: CreatePOSSessionInput): Promise<POSSessionWithRelations> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find or create day book for today
    let dayBook = await prisma.dayBook.findUnique({
      where: { date: today },
    });

    if (!dayBook) {
      // Create new day book for today
      dayBook = await prisma.dayBook.create({
        data: {
          date: today,
          openingCashBalance: new Decimal(input.openingCashAmount),
          openingBankBalance: 0,
          status: 'OPEN',
          openedById: input.cashierId,
        },
      });
    }

    // Create POS session linked to day book
    const session = await prisma.pOSSession.create({
      data: {
        cashierId: input.cashierId,
        terminalId: input.terminalId,
        dayBookId: dayBook.id,
        status: 'OPEN',
        openingCashAmount: new Decimal(input.openingCashAmount),
        notes: input.notes,
      },
      include: {
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
    });

    return session as POSSessionWithRelations;
  },

  /**
   * Get active POS session for cashier
   */
  async getActiveSession(cashierId: string): Promise<POSSessionWithRelations | null> {
    const session = await prisma.pOSSession.findFirst({
      where: {
        cashierId,
        status: 'OPEN',
      },
      include: {
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    return session as POSSessionWithRelations | null;
  },

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<POSSessionWithRelations | null> {
    const session = await prisma.pOSSession.findUnique({
      where: { id: sessionId },
      include: {
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
    });

    return session as POSSessionWithRelations | null;
  },

  /**
   * List all sessions for cashier
   */
  async listSessions(
    cashierId: string,
    status?: POSSessionStatus,
    limit: number = 50
  ): Promise<POSSessionWithRelations[]> {
    const sessions = await prisma.pOSSession.findMany({
      where: {
        cashierId,
        ...(status && { status }),
      },
      include: {
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: {
        openedAt: 'desc',
      },
      take: limit,
    });

    return sessions as POSSessionWithRelations[];
  },

  /**
   * Close POS session
   * Creates closing entry in day book
   */
  async closeSession(
    sessionId: string,
    input: ClosePOSSessionInput
  ): Promise<POSSessionWithRelations> {
    const session = await prisma.pOSSession.findUniqueOrThrow({
      where: { id: sessionId },
    });

    if (session.status !== 'OPEN') {
      throw new Error(`Cannot close session with status ${session.status}`);
    }

    // Calculate variance
    const expectedCash = new Decimal(input.closingCashAmount);
    const variance = expectedCash.minus(session.openingCashAmount);

    // Update session
    const closedSession = await prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closingCashAmount: expectedCash,
        cashVariance: variance,
        closedAt: new Date(),
        notes: input.notes,
      },
      include: {
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
    });

    return closedSession as POSSessionWithRelations;
  },

  /**
   * Update session transaction totals
   * Called after each transaction
   */
  async updateSessionTotals(
    sessionId: string,
    paymentMethod: string,
    amount: Decimal | number
  ): Promise<void> {
    const decimalAmount = new Decimal(amount);

    const updateData: any = {
      totalSalesAmount: {
        increment: decimalAmount,
      },
      totalTransactions: {
        increment: 1,
      },
    };

    // Update specific payment method total
    if (paymentMethod === 'CASH') {
      updateData.totalCashReceived = {
        increment: decimalAmount,
      };
    } else if (paymentMethod === 'CARD') {
      updateData.totalCardReceived = {
        increment: decimalAmount,
      };
    } else if (['UPI', 'DIGITAL_WALLET', 'MOBILE_WALLET'].includes(paymentMethod)) {
      updateData.totalDigitalReceived = {
        increment: decimalAmount,
      };
    }

    await prisma.pOSSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  },

  /**
   * Get session summary for display
   */
  async getSessionSummary(sessionId: string) {
    const session = await prisma.pOSSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
            openingCashBalance: true,
            closingCashBalance: true,
            entries: {
              select: {
                id: true,
                amount: true,
                entryType: true,
              },
            },
          },
        },
      },
    });

    const totalPayments = session.totalCashReceived
      .plus(session.totalCardReceived)
      .plus(session.totalDigitalReceived);

    return {
      sessionId: session.id,
      cashierId: session.cashierId,
      terminalId: session.terminalId,
      dayBookId: session.dayBookId,
      status: session.status,
      openingCash: session.openingCashAmount,
      closingCash: session.closingCashAmount,
      totalSales: session.totalSalesAmount,
      totalTransactions: session.totalTransactions,
      paymentBreakdown: {
        cash: session.totalCashReceived,
        card: session.totalCardReceived,
        digital: session.totalDigitalReceived,
        total: totalPayments,
      },
      variance: session.cashVariance,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      dayBookStatus: session.dayBook?.status,
    };
  },

  /**
   * Suspend session (temporary close)
   */
  async suspendSession(sessionId: string, reason?: string): Promise<POSSessionWithRelations> {
    const session = await prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        status: 'SUSPENDED',
        notes: reason ? `Suspended: ${reason}` : undefined,
      },
      include: {
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
    });

    return session as POSSessionWithRelations;
  },

  /**
   * Resume suspended session
   */
  async resumeSession(sessionId: string): Promise<POSSessionWithRelations> {
    const session = await prisma.pOSSession.findUniqueOrThrow({
      where: { id: sessionId },
    });

    if (session.status !== 'SUSPENDED') {
      throw new Error(`Cannot resume session with status ${session.status}`);
    }

    const resumed = await prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        status: 'OPEN',
      },
      include: {
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        dayBook: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
    });

    return resumed as POSSessionWithRelations;
  },
};
