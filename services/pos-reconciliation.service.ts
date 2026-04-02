// services/pos-reconciliation.service.ts

import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';

export interface ReconciliationData {
  sessionId: string;
  expectedCash: Decimal;
  actualCash: Decimal;
  variance: Decimal;
  variancePercentage: number;
  status: 'BALANCED' | 'OVERAGE' | 'SHORTAGE';
  reconciled: boolean;
  reconciledAt?: Date;
  reconciledBy?: string;
  notes?: string;
}

export interface ReconciliationSummary {
  totalSessions: number;
  balancedSessions: number;
  overage: Decimal;
  shortage: Decimal;
  totalVariance: Decimal;
  reconciliationRate: number;
}

class POSReconciliationService {
  /**
   * Calculate reconciliation data for a session
   */
  async calculateReconciliation(sessionId: string): Promise<ReconciliationData> {
    const session = await prisma.pOSSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'CLOSED') {
      throw new Error('Can only reconcile closed sessions');
    }

    // Expected cash = opening cash + total cash received
    const expectedCash = new Decimal(session.openingCashAmount).plus(
      new Decimal(session.totalCashReceived)
    );

    const actualCash = new Decimal(session.closingCashAmount || 0);
    const variance = actualCash.minus(expectedCash);
    const variancePercentage = expectedCash.toNumber() > 0
      ? (variance.toNumber() / expectedCash.toNumber()) * 100
      : 0;

    return {
      sessionId,
      expectedCash,
      actualCash,
      variance,
      variancePercentage,
      status: variance.toNumber() > 0 ? 'OVERAGE' : variance.toNumber() < 0 ? 'SHORTAGE' : 'BALANCED',
      reconciled: false,
    };
  }

  /**
   * Mark session as reconciled
   */
  async markReconciled(
    sessionId: string,
    _userId: string,
    notes?: string
  ) {
    return await prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        notes: notes,
      },
      include: {
        cashier: { select: { id: true, username: true } },
        dayBook: { select: { id: true, date: true, status: true } },
      },
    });
  }

  /**
   * Get reconciliation summary for date range
   */
  async getReconciliationSummary(startDate: Date, endDate: Date) {
    const sessions = await prisma.pOSSession.findMany({
      where: {
        status: 'CLOSED',
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalOverage = new Decimal(0);
    let totalShortage = new Decimal(0);

    const reconciliationPromises = sessions.map((session) =>
      this.calculateReconciliation(session.id)
    );
    const reconciliations = await Promise.all(reconciliationPromises);

    reconciliations.forEach((recon) => {
      if (recon.variance.toNumber() > 0) {
        totalOverage = totalOverage.plus(recon.variance);
      } else if (recon.variance.toNumber() < 0) {
        totalShortage = totalShortage.plus(recon.variance.abs());
      }
    });

    const balancedCount = reconciliations.filter((r) => r.status === 'BALANCED').length;
    const totalVariance = totalOverage.minus(totalShortage);
    const reconciliationRate = sessions.length > 0 ? (balancedCount / sessions.length) * 100 : 0;

    return {
      totalSessions: sessions.length,
      balancedSessions: balancedCount,
      overage: totalOverage,
      shortage: totalShortage,
      totalVariance,
      reconciliationRate,
    } as ReconciliationSummary;
  }

  /**
   * Get all unreconciled sessions
   */
  async getUnreconciledSessions(limit = 50) {
    return await prisma.pOSSession.findMany({
      where: {
        status: 'CLOSED',
      },
      include: {
        cashier: { select: { id: true, username: true } },
        dayBook: { select: { id: true, date: true, status: true } },
      },
      orderBy: { closedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Flag session for investigation
   */
  async flagForInvestigation(
    sessionId: string,
    reason: string,
    _userId: string
  ) {
    return await prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        notes: `Investigation flagged: ${reason}`,
      },
    });
  }

  /**
   * Resolve investigation flag
   */
  async resolveInvestigation(
    sessionId: string,
    resolution: string,
    _userId: string
  ) {
    return await prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        notes: `Investigation resolved: ${resolution}`,
      },
    });
  }
}

export const posReconciliationService = new POSReconciliationService();
