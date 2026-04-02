/**
 * Credit Management Service
 * Handles all business logic for customer credit system
 * Extends BaseRepository for CRUD operations with Decimal handling
 */

import { prisma } from '@/lib/prisma';
import { BaseRepository } from '@/lib/architecture/repository';
import { Prisma } from '@prisma/client';
import { termsConfigService } from './terms-config.service';
import type {
  CustomerCredit,
  CreditTransaction,
  CreditPayment,
  CreditRefund,
  CreditAccountSummary,
  CreditHealthMetrics,
  CreateCustomerCreditInput,
  CreateCreditTransactionInput,
  CreateCreditPaymentInput,
  CreateCreditRefundInput,
  PaymentAllocationInput,
} from '@/types/credit.types.ts';

class CreditService extends BaseRepository<CustomerCredit> {
  protected modelName = 'customerCredit' as const;
  protected select = undefined;

  /**
   * Create or get credit account for customer
   */
  async initializeCredit(input: CreateCustomerCreditInput): Promise<CustomerCredit> {
    const existing = await prisma.customerCredit.findUnique({
      where: { customerId: input.customerId },
    });

    if (existing) return this.convertDecimalToNumber(existing);

    const created = await prisma.customerCredit.create({
      data: {
        customerId: input.customerId,
        totalLimit: new Prisma.Decimal(input.totalLimit),
        totalUtilized: new Prisma.Decimal(0),
        outstandingAmount: new Prisma.Decimal(0),
      },
    });

    return this.convertDecimalToNumber(created);
  }

  /**
   * Get comprehensive credit account summary
   */
  async getAccountSummary(customerId: string): Promise<CreditAccountSummary | null> {
    const account = await prisma.customerCredit.findUnique({
      where: { customerId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            contactNumber: true,
          },
        },
        transactions: {
          where: { isFullyPaid: false },
          take: 10,
          orderBy: { dueDate: 'asc' },
        },
        payments: {
          take: 5,
          orderBy: { paymentDate: 'desc' },
        },
        interestEntries: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    if (!account) return null;

    const converted = this.convertDecimalToNumber(account);
    const interestDue = converted.interestEntries.reduce((sum: number, i: any) => sum + i.amount, 0);
    const pending = converted.transactions.filter((t: any) => !t.isFullyPaid);
    const overdue = pending.filter((t: any) => new Date(t.dueDate) < new Date());

    return {
      ...converted,
      pending,
      overdue,
      recentPayments: converted.payments,
      interestDue,
    } as CreditAccountSummary;
  }

  /**
   * Create credit transaction (credit sale)
   */
  async createTransaction(
    input: CreateCreditTransactionInput,
    userId: string
  ): Promise<CreditTransaction> {
    // Get or create customer credit account
    const account = await prisma.customerCredit.findUnique({
      where: { customerId: input.customerId },
    });

    if (!account) {
      throw new Error(`Credit account not initialized for customer ${input.customerId}`);
    }

    // Calculate due date based on payment terms
    const dueDate = input.dueDate || this.calculateDueDate(input.paymentTerms);

    const transaction = await prisma.creditTransaction.create({
      data: {
        customerId: input.customerId,
        customerCreditId: account.id,
        createdByUserId: userId,
        transactionType: 'CREDIT_SALE',
        description: input.description,
        amount: new Prisma.Decimal(input.amount),
        balanceAmount: new Prisma.Decimal(input.amount),
        dueDate,
        paymentTerms: (input.paymentTerms || 'NET_30') as any,
        reference: input.reference,
        notes: input.notes,
      },
    });

    // Update account totals
    await this.updateAccountTotals(account.id);

    return this.convertDecimalToNumber(transaction);
  }

  /**
   * Record payment against credit account
   */
  async recordPayment(
    input: CreateCreditPaymentInput,
    userId: string
  ): Promise<CreditPayment> {
    const account = await prisma.customerCredit.findUnique({
      where: { customerId: input.customerId },
    });

    if (!account) {
      throw new Error(`Credit account not found for customer ${input.customerId}`);
    }

    // Create payment
    const payment = await prisma.creditPayment.create({
      data: {
        customerId: input.customerId,
        customerCreditId: account.id,
        recordedByUserId: userId,
        paymentMethod: input.paymentMethod,
        amount: new Prisma.Decimal(input.amount),
        reference: input.reference,
        notes: input.notes,
        status: 'PENDING',
      },
    });

    // Allocate payment to transactions if provided
    if (input.allocations && input.allocations.length > 0) {
      await this.allocatePayment(payment.id, input.allocations);
    }

    // Update account totals
    await this.updateAccountTotals(account.id);

    return this.convertDecimalToNumber(payment);
  }

  /**
   * Allocate payment to specific credit transactions
   */
  async allocatePayment(
    paymentId: string,
    allocations: PaymentAllocationInput[]
  ): Promise<void> {
    for (const allocation of allocations) {
      // Validate transaction exists and balance
      const transaction = await prisma.creditTransaction.findUnique({
        where: { id: allocation.creditTransactionId },
      });

      if (!transaction) {
        throw new Error(`Credit transaction ${allocation.creditTransactionId} not found`);
      }

      if (new Prisma.Decimal(allocation.allocatedAmount).gt(transaction.balanceAmount)) {
        throw new Error(
          `Allocation amount exceeds outstanding balance for transaction ${allocation.creditTransactionId}`
        );
      }

      // Create or update allocation
      await prisma.paymentAllocation.upsert({
        where: {
          creditPaymentId_creditTransactionId: {
            creditPaymentId: paymentId,
            creditTransactionId: allocation.creditTransactionId,
          },
        },
        update: {
          allocatedAmount: new Prisma.Decimal(allocation.allocatedAmount),
        },
        create: {
          creditPaymentId: paymentId,
          creditTransactionId: allocation.creditTransactionId,
          allocatedAmount: new Prisma.Decimal(allocation.allocatedAmount),
        },
      });

      // Update transaction balance
      const newBalance = transaction.balanceAmount.sub(allocation.allocatedAmount);
      await prisma.creditTransaction.update({
        where: { id: allocation.creditTransactionId },
        data: {
          paidAmount: transaction.paidAmount.add(allocation.allocatedAmount),
          balanceAmount: newBalance,
          isFullyPaid: newBalance.lte(0),
        },
      });
    }
  }

  /**
   * Calculate interest on overdue amounts
   */
  async calculateAndApplyInterest(customerId: string, userId: string): Promise<void> {
    const account = await prisma.customerCredit.findUnique({
      where: { customerId },
      include: { transactions: true },
    });

    if (!account) return;

    const now = new Date();
    const interestRate = 0.02; // 2% per month (configurable)

    for (const transaction of account.transactions) {
      if (transaction.isFullyPaid) continue;

      const daysPastDue = Math.max(0, Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      if (daysPastDue > 0) {
        // Interest calculation: (balance * rate * days) / 365
        const dailyRate = new Prisma.Decimal(interestRate).div(365);
        const interestAmount = transaction.balanceAmount.mul(dailyRate).mul(daysPastDue);

        // Create interest entry
        await prisma.interestEntry.create({
          data: {
            customerId,
            customerCreditId: account.id,
            createdByUserId: userId,
            creditTransactionId: transaction.id,
            amount: interestAmount,
            rate: new Prisma.Decimal(interestRate * 100),
            applicableRate: new Prisma.Decimal(interestRate * 100),
            period: daysPastDue,
            description: `Late fee for ${daysPastDue} days overdue`,
          },
        });
      }
    }

    // Update account totals
    await this.updateAccountTotals(account.id);
  }

  /**
   * Create refund for payment or transaction
   */
  async createRefund(
    input: CreateCreditRefundInput,
    userId: string
  ): Promise<CreditRefund> {
    const account = await prisma.customerCredit.findUnique({
      where: { customerId: input.customerId },
    });

    if (!account) {
      throw new Error(`Credit account not found for customer ${input.customerId}`);
    }

    const refund = await prisma.creditRefund.create({
      data: {
        customerId: input.customerId,
        approvedByUserId: userId,
        customerCreditId: account.id,
        creditPaymentId: input.creditPaymentId,
        amount: new Prisma.Decimal(input.amount),
        reason: input.reason,
        reference: input.reference,
        notes: input.notes,
      },
    });

    // Update account totals (reduce payments)
    await this.updateAccountTotals(account.id);

    return this.convertDecimalToNumber(refund);
  }

  /**
   * Calculate and get credit health metrics
   */
  async getHealthMetrics(customerId: string): Promise<CreditHealthMetrics> {
    const account = await prisma.customerCredit.findUnique({
      where: { customerId },
      include: {
        transactions: true,
        payments: true,
      },
    });

    if (!account) {
      throw new Error(`Credit account not found for ${customerId}`);
    }

    const utilizationRatio =
      account.totalLimit.toNumber() > 0
        ? account.outstandingAmount.toNumber() / account.totalLimit.toNumber()
        : 0;

    const overdueTransactions = account.transactions.filter(
      t => !t.isFullyPaid && new Date(t.dueDate) < new Date()
    );
    const totalOverdueAmount = overdueTransactions.reduce(
      (sum, t) => sum + t.balanceAmount.toNumber(),
      0
    );

    // Calculate average payment delay
    const completedTransactions = account.transactions.filter(t => t.isFullyPaid);
    const avgDelay =
      completedTransactions.length > 0
        ? completedTransactions.reduce((sum, t) => {
            const delayDays = Math.max(0, 
              Math.floor((new Date().getTime() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24))
            );
            return sum + delayDays;
          }, 0) / completedTransactions.length
        : 0;

    // Risk score calculation (0-100)
    const riskScore = Math.min(
      100,
      utilizationRatio * 40 +
        (account.overdueDays || 0) * 0.5 +
        (overdueTransactions.length > 0 ? 20 : 0)
    );

    let recommendedAction: 'ACTIVE' | 'MONITOR' | 'REVIEW' | 'SUSPEND' = 'ACTIVE';
    if (riskScore >= 80 || utilizationRatio > 0.9) recommendedAction = 'SUSPEND';
    else if (riskScore >= 60 || utilizationRatio > 0.7) recommendedAction = 'REVIEW';
    else if (riskScore >= 40) recommendedAction = 'MONITOR';

    return {
      customerId,
      utilizationRatio: Math.round(utilizationRatio * 100) / 100,
      overdueDays: account.overdueDays || 0,
      totalOverdueAmount,
      averagePaymentDelay: Math.round(avgDelay),
      defaultRiskScore: Math.round(riskScore),
      recommendedAction,
    };
  }

  /**
   * Recalculate and update account totals
   */
  private async updateAccountTotals(creditId: string): Promise<void> {
    const account = await prisma.customerCredit.findUnique({
      where: { id: creditId },
      include: {
        transactions: true,
        payments: true,
        interestEntries: true,
        refunds: true,
      },
    });

    if (!account) return;

    const totalUtilized = account.transactions.reduce((sum: number, t: any) => sum + t.balanceAmount.toNumber(), 0);
    const totalPayments = account.payments.reduce((sum: number, p: any) => sum + p.amount.toNumber(), 0);
    const totalInterest = account.interestEntries.reduce((sum: number, i: any) => sum + i.amount.toNumber(), 0);
    const totalRefunds = account.refunds.reduce((sum: number, r: any) => sum + r.amount.toNumber(), 0);
    const outstandingAmount = totalUtilized - totalPayments + totalInterest;

    // Determine if any transactions are overdue
    const now = new Date();
    const overdueDays = account.transactions
      .filter(t => !t.isFullyPaid && new Date(t.dueDate) < now)
      .map(t => Math.floor((now.getTime() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      .sort((a, b) => b - a)[0] || 0;

    // Update status based on outstanding balance
    let status = 'ACTIVE';
    if (outstandingAmount === 0) status = 'SETTLED';
    else if (overdueDays > 0) status = 'OVERDUE';
    else if (totalUtilized > 0 && totalPayments > 0 && outstandingAmount > 0) status = 'PARTIAL';

    await prisma.customerCredit.update({
      where: { id: creditId },
      data: {
        totalUtilized: new Prisma.Decimal(totalUtilized),
        totalPayments: new Prisma.Decimal(totalPayments),
        totalInterest: new Prisma.Decimal(totalInterest),
        totalRefunds: new Prisma.Decimal(totalRefunds),
        outstandingAmount: new Prisma.Decimal(Math.max(0, outstandingAmount)),
        overdueDays: Math.max(0, overdueDays),
        status: status as any,
        nextDueDate:
          account.transactions.filter(t => !t.isFullyPaid).length > 0
            ? account.transactions.filter(t => !t.isFullyPaid).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate
            : null,
      },
    });
  }

  /**
   * Calculate due date based on payment terms
   */
  private calculateDueDate(terms: string | undefined | null): Date {
    const today = new Date();
    const daysMap: Record<string, number> = {
      IMMEDIATE: 0,
      NET_7: 7,
      NET_15: 15,
      NET_30: 30,
      NET_60: 60,
      END_OF_MONTH: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate(),
      CUSTOM: 30,
    };

    const days = daysMap[terms || 'NET_30'] || 30;
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  /**
   * Convert Prisma Decimal objects to numbers recursively
   */
  private convertDecimalToNumber(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Prisma.Decimal) return obj.toNumber();
    if (Array.isArray(obj)) return obj.map(item => this.convertDecimalToNumber(item));
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = this.convertDecimalToNumber(obj[key]);
      }
      return converted;
    }
    return obj;
  }

  /**
   * Apply late fees to overdue transactions
   */
  async applyLateFees(customerId: string, userId: string): Promise<number> {
    const account = await prisma.customerCredit.findUnique({
      where: { customerId },
      include: { transactions: true },
    });

    if (!account) throw new Error(`Credit account not found for ${customerId}`);

    let totalFeesApplied = 0;
    const now = new Date();

    for (const transaction of account.transactions) {
      if (transaction.isFullyPaid) continue;

      const daysPastDue = Math.floor(
        (now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPastDue <= 0) continue;

      // Check if fee already applied today
      const existingFeeToday = await prisma.interestEntry.findFirst({
        where: {
          creditTransactionId: transaction.id,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      });

      if (existingFeeToday) continue;

      // Calculate late fee
      const feeDetails = termsConfigService.calculateLateFee(
        transaction.balanceAmount.toNumber(),
        daysPastDue
      );

      if (feeDetails.totalFee > 0) {
        // Apply as interest entry
        await prisma.interestEntry.create({
          data: {
            customerId,
            customerCreditId: account.id,
            createdByUserId: userId,
            creditTransactionId: transaction.id,
            amount: new Prisma.Decimal(feeDetails.totalFee),
            rate: new Prisma.Decimal(feeDetails.effectiveRate),
            applicableRate: new Prisma.Decimal(feeDetails.effectiveRate),
            period: daysPastDue,
            description: `Late fee: ${daysPastDue} days overdue (${feeDetails.fixedFee.toFixed(2)} fixed + ${feeDetails.percentageFee.toFixed(2)} percentage)`,
          },
        });

        totalFeesApplied += feeDetails.totalFee;
      }
    }

    // Update account totals
    await this.updateAccountTotals(account.id);

    return totalFeesApplied;
  }

  /**
   * Get payment schedule for a transaction
   */
  async getPaymentSchedule(
    transactionId: string,
    numberOfInstallments: number = 1
  ): Promise<
    Array<{
      paymentNumber: number;
      dueDate: Date;
      amount: number;
      description: string;
      daysToDue: number;
      status: 'PENDING' | 'PARTIAL' | 'PAID';
    }>
  > {
    const transaction = await prisma.creditTransaction.findUnique({
      where: { id: transactionId },
      include: {
        paymentAllocations: {
          include: { creditPayment: true },
        },
      },
    });

    if (!transaction) throw new Error(`Transaction ${transactionId} not found`);

    const schedule = termsConfigService.generatePaymentSchedule(
      transaction.amount.toNumber(),
      transaction.dueDate,
      numberOfInstallments
    );

    const now = new Date();

    return schedule.map((installment, index) => {
      const daysToDue = Math.ceil(
        (installment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if installment is paid/partial
      const allocations = transaction.paymentAllocations || [];
      const allocatedToThisPayment = allocations
        .filter((_, i) => i === index)
        .reduce((sum, alloc) => sum + alloc.allocatedAmount.toNumber(), 0);

      let status: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING';
      if (allocatedToThisPayment >= installment.amount) status = 'PAID';
      else if (allocatedToThisPayment > 0) status = 'PARTIAL';

      return {
        ...installment,
        daysToDue,
        status,
      };
    });
  }

  /**
   * Calculate interest schedule for period
   */
  async calculateInterestSchedule(
    customerId: string
  ): Promise<{
    transactions: Array<{
      transactionId: string;
      amount: number;
      daysOverdue: number;
      interestAmount: number;
      totalDue: number;
    }>;
    totalInterest: number;
    appliedCount: number;
  }> {
    const account = await prisma.customerCredit.findUnique({
      where: { customerId },
      include: { transactions: true },
    });

    if (!account) throw new Error(`Credit account not found for ${customerId}`);

    const now = new Date();
    const transactions = [];
    let totalInterest = 0;

    for (const transaction of account.transactions) {
      if (transaction.isFullyPaid) continue;

      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      if (daysOverdue <= 0) continue;

      const interest = termsConfigService.calculateInterest(
        transaction.balanceAmount.toNumber(),
        daysOverdue
      );

      totalInterest += interest.amount;
      transactions.push({
        transactionId: transaction.id,
        amount: transaction.balanceAmount.toNumber(),
        daysOverdue,
        interestAmount: interest.amount,
        totalDue: transaction.balanceAmount.toNumber() + interest.amount,
      });
    }

    return {
      transactions,
      totalInterest,
      appliedCount: transactions.length,
    };
  }

  /**
   * Get credit terms configuration
   */
  getTermsConfig() {
    return termsConfigService.getConfig();
  }

  /**
   * Get payment term details
   */
  getPaymentTerm(term: string) {
    return termsConfigService.getPaymentTerm(term);
  }
}

export const creditService = new CreditService();
