/**
 * Payment Repository
 * Handles all data access for Payment entity
 */

import { BaseRepository } from '@/lib/architecture/repository';
import { prisma } from '@/lib/prisma';
import { Payment, PaymentFilters } from '@/types/payment.types';
import { Prisma } from '@prisma/client';

export class PaymentRepository extends BaseRepository<Payment> {
  protected modelName = 'payment' as const;
  protected select: Record<string, any> = {
    id: true,
    referenceNumber: true,
    paymentDate: true,
    amount: true,
    paymentMethod: true,
    payerType: true,
    payerId: true,
    description: true,
    notes: true,
  };

  /**
   * Find payments with advanced filtering
   */
  async findByFilters(
    filters: PaymentFilters,
    skip: number = 0,
    take: number = 20
  ): Promise<{ items: Payment[]; total: number }> {
    const where = this.buildPaymentWhere(filters);

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { paymentDate: 'desc' },
        include: this.getInclude(filters),
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items: items.map(p => this.convertPaymentToNumber(p)),
      total,
    };
  }

  /**
   * Find payment by reference number
   */
  async findByReferenceNumber(refNum: string): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: { referenceNumber: refNum },
      include: {
        customer: true,
        supplier: true,
      },
    });

    return payment ? this.convertPaymentToNumber(payment) : null;
  }

  /**
   * Find payments by payer ID and type
   */
  async findByPayer(payerType: string, payerId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: {
        payerType: payerType as any,
        payerId,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(p => this.convertPaymentToNumber(p));
  }

  /**
   * Calculate total payments for a payer within date range
   */
  async calculatePayerTotal(
    payerType: string,
    payerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        payerType: payerType as any,
        payerId,
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    return this.convertToNumber(result._sum.amount) || 0;
  }

  /**
   * Build WHERE clause from filters
   */
  private buildPaymentWhere(filters: PaymentFilters): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};

    if (filters.search) {
      where.OR = [
        { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.payerType) {
      where.payerType = filters.payerType as any;
    }

    if (filters.payerId) {
      where.payerId = filters.payerId;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod as any;
    }

    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    return where;
  }

  /**
   * Get include clause based on filters
   */
  private getInclude(filters: PaymentFilters) {
    const include: any = {};

    if (filters.payerType === 'CUSTOMER') {
      include.customer = true;
    } else if (filters.payerType === 'SUPPLIER') {
      include.supplier = true;
    } else {
      // Include both if no specific type is filtered
      include.customer = true;
      include.supplier = true;
    }

    return include;
  }

  /**
   * Convert Prisma payment to number type (Decimal → number)
   */
  private convertPaymentToNumber(payment: any): Payment {
    return {
      ...payment,
      amount: this.convertToNumber(payment.amount),
      transactionFee: this.convertToNumber(payment.transactionFee),
      netAmount: this.convertToNumber(payment.netAmount),
    } as Payment;
  }
}
