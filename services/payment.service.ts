import { prisma } from '@/lib/prisma';
import {
  CreatePaymentInput,
  CreateReconciliationInput,
  CreateRefundInput,
  PaginatedPayments,
  Payment,
  PaymentFilters,
  PaymentRefund,
  UpdatePaymentInput,
} from '@/types/payment.types';
import { Prisma } from '@prisma/client';
import { createLedgerEntry } from './ledger.service'; // Import ledger service

function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

function convertPaymentToNumber(payment: any): Payment {
  return {
    ...payment,
    amount: convertToNumber(payment.amount),
    transactionFee: convertToNumber(payment.transactionFee),
    netAmount: convertToNumber(payment.netAmount),
  } as Payment;
}

export async function getAllPayments(filters: PaymentFilters): Promise<PaginatedPayments> {
  const { search, payerType, payerId, paymentMethod, startDate, endDate, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {};

  if (search) {
      where.OR = [
          { referenceNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
      ];
  }
  if (payerType) {
      where.payerType = payerType;
  }
  if (payerId) {
      where.payerId = payerId;
  }
  if (paymentMethod) {
      where.paymentMethod = paymentMethod;
  }
  if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
          where.paymentDate.gte = startDate;
      }
      if (endDate) {
          where.paymentDate.lte = endDate;
      }
  }

  const payments = await prisma.payment.findMany({
    where,
    skip,
    take: limit,
    orderBy: { paymentDate: 'desc' },
    include: {
      customer: true,
      supplier: true,
    },
  });

  const total = await prisma.payment.count({ where });
  const pages = Math.ceil(total / limit);

  return {
    payments: payments.map(convertPaymentToNumber),
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      customer: true,
      supplier: true,
    },
  });

  if (!payment) return null;

  return convertPaymentToNumber(payment);
}

export async function createPayment(data: CreatePaymentInput): Promise<Payment> {
  return prisma.$transaction(async (tx) => {
    const { payerId, payerType, amount, paymentMethod, referenceOrderId, referenceNumber, notes, paymentDate, transactionFee = 0, status = 'COMPLETED' } = data;

    // Validate payer
    if (payerType === 'CUSTOMER') {
        const customer = await tx.customer.findUnique({ where: { id: payerId } });
        if (!customer) throw new Error('Customer not found');
    } else if (payerType === 'SUPPLIER') {
        const supplier = await tx.supplier.findUnique({ where: { id: payerId } });
        if (!supplier) throw new Error('Supplier not found');
    } else {
        throw new Error('Invalid payer type');
    }

    const netAmount = amount - (transactionFee || 0);
    const payment = await tx.payment.create({
      data: {
        payerId,
        payerType,
        customerId: payerType === 'CUSTOMER' ? payerId : null,
        supplierId: payerType === 'SUPPLIER' ? payerId : null,
        paymentDate: paymentDate || new Date(),
        amount: new Prisma.Decimal(amount),
        paymentMethod,
        referenceOrderId,
        referenceNumber,
        notes,
        status,
        transactionFee: new Prisma.Decimal(transactionFee || 0),
        netAmount: new Prisma.Decimal(netAmount),
      },
    });

    // Update SalesOrder/PurchaseOrder balanceAmount
    if (payerType === 'CUSTOMER') {
        if (referenceOrderId) {
            // Payment for specific Sales Order
            await tx.salesOrder.update({
                where: { id: referenceOrderId },
                data: {
                    balanceAmount: { decrement: new Prisma.Decimal(amount) },
                },
            });
        } else {
            // Apply payment to oldest unpaid sales orders
            const unpaidOrders = await tx.salesOrder.findMany({
                where: {
                    customerId: payerId,
                    status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
                },
                orderBy: { createdAt: 'asc' },
            });

            let remainingAmount = new Prisma.Decimal(amount);
            for (const order of unpaidOrders) {
                if (remainingAmount.lessThanOrEqualTo(0)) break;

                const orderBalance = order.balanceAmount;
                const paymentForOrder = remainingAmount.greaterThan(orderBalance) ? orderBalance : remainingAmount;
                const newBalance = orderBalance.minus(paymentForOrder);
                const newStatus = newBalance.lessThanOrEqualTo(0) ? 'PAID' : 'PARTIALLY_PAID';

                await tx.salesOrder.update({
                    where: { id: order.id },
                    data: {
                        balanceAmount: newBalance,
                        status: newStatus,
                    },
                });

                remainingAmount = remainingAmount.minus(paymentForOrder);
            }
        }

        await tx.customer.update({
            where: { id: payerId },
            data: { outstandingBalance: { decrement: new Prisma.Decimal(amount) } },
        });
        await createLedgerEntry({
            entryDate: payment.createdAt,
            description: `Payment received from Customer ${payerId.substring(0,8)} for ${paymentMethod}`,
            debitAccount: paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            creditAccount: 'Accounts Receivable',
            amount: convertToNumber(payment.amount),
            referenceId: payment.id,
        }, tx);
    } else if (payerType === 'SUPPLIER') {
        if (referenceOrderId) {
            // Payment for specific Purchase Order
            await tx.purchaseOrder.update({
                where: { id: referenceOrderId },
                data: {
                    balanceAmount: { decrement: new Prisma.Decimal(amount) },
                },
            });
        } else {
            // Apply payment to oldest unpaid purchase orders
            const unpaidOrders = await tx.purchaseOrder.findMany({
                where: {
                    supplierId: payerId,
                    status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] },
                },
                orderBy: { createdAt: 'asc' },
            });

            let remainingAmount = new Prisma.Decimal(amount);
            for (const order of unpaidOrders) {
                if (remainingAmount.lessThanOrEqualTo(0)) break;

                const orderBalance = order.balanceAmount;
                const paymentForOrder = remainingAmount.greaterThan(orderBalance) ? orderBalance : remainingAmount;
                const newBalance = orderBalance.minus(paymentForOrder);
                const newStatus = newBalance.lessThanOrEqualTo(0) ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

                await tx.purchaseOrder.update({
                    where: { id: order.id },
                    data: {
                        balanceAmount: newBalance,
                        status: newStatus,
                    },
                });

                remainingAmount = remainingAmount.minus(paymentForOrder);
            }
        }
        await tx.supplier.update({
            where: { id: payerId },
            data: { outstandingBalance: { decrement: new Prisma.Decimal(amount) } },
        });
        await createLedgerEntry({
            entryDate: payment.createdAt,
            description: `Payment made to Supplier ${payerId.substring(0,8)} for ${paymentMethod}`,
            debitAccount: 'Accounts Payable',
            creditAccount: paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            amount: convertToNumber(payment.amount),
            referenceId: payment.id,
        }, tx);
    }

    return convertPaymentToNumber(payment);
  });
}

export async function updatePayment(id: string, data: UpdatePaymentInput): Promise<Payment> {
  const existingPayment = await prisma.payment.findUnique({ where: { id } });
  if (!existingPayment) throw new Error('Payment not found');

  // TODO: This is complex. Updating payment amount or referenceOrderId will require reversing
  //  previous ledger entries and balance updates, and then applying new ones.
  //  For now, only simple field updates are supported without financial impact.

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      paymentDate: data.paymentDate,
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      paymentMethod: data.paymentMethod,
      referenceOrderId: data.referenceOrderId,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      status: data.status,
      isReconciled: data.isReconciled,
      reconciledBy: data.reconciledBy,
    },
    include: {
      customer: true,
      supplier: true,
    },
  });
  return convertPaymentToNumber(updatedPayment);
}

export async function deletePayment(id: string): Promise<void> {
  return prisma.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({ where: { id } });
    if (!existingPayment) throw new Error('Payment not found');

    // Revert SalesOrder/PurchaseOrder balanceAmount
    if (existingPayment.referenceOrderId) {
        if (existingPayment.payerType === 'CUSTOMER') { // Payment for Sales Order
            await tx.salesOrder.update({
                where: { id: existingPayment.referenceOrderId },
                data: { balanceAmount: { increment: existingPayment.amount } },
            });
        } else if (existingPayment.payerType === 'SUPPLIER') { // Payment for Purchase Order
            await tx.purchaseOrder.update({
                where: { id: existingPayment.referenceOrderId },
                data: { balanceAmount: { increment: existingPayment.amount } },
            });
        }
    }

    // Revert Customer/Supplier outstandingBalance
    if (existingPayment.payerType === 'CUSTOMER') {
        await tx.customer.update({
            where: { id: existingPayment.payerId },
            data: { outstandingBalance: { increment: existingPayment.amount } },
        });
        await createLedgerEntry({
            entryDate: new Date(),
            description: `Payment reversal from Customer ${existingPayment.payerId.substring(0,8)}`,
            debitAccount: 'Accounts Receivable',
            creditAccount: existingPayment.paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            amount: convertToNumber(existingPayment.amount),
            referenceId: existingPayment.id,
        }, tx);
    } else if (existingPayment.payerType === 'SUPPLIER') {
        await tx.supplier.update({
            where: { id: existingPayment.payerId },
            data: { outstandingBalance: { increment: existingPayment.amount } },
        });
        await createLedgerEntry({
            entryDate: new Date(),
            description: `Payment reversal to Supplier ${existingPayment.payerId.substring(0,8)}`,
            debitAccount: existingPayment.paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            creditAccount: 'Accounts Payable',
            amount: convertToNumber(existingPayment.amount),
            referenceId: existingPayment.id,
        }, tx);
    }

    await tx.payment.delete({ where: { id } });
  });
}

// ============================================================================
// Payment Refund Functions
// ============================================================================

export async function createRefund(data: CreateRefundInput): Promise<PaymentRefund> {
  return prisma.$transaction(async (tx) => {
    // Validate payment exists
    const payment = await tx.payment.findUnique({ where: { id: data.paymentId } });
    if (!payment) throw new Error('Payment not found');

    // Validate refund amount doesn't exceed original payment
    if (new Prisma.Decimal(data.refundAmount) > payment.amount) {
      throw new Error('Refund amount cannot exceed original payment amount');
    }

    // Create refund record
    const refund = await tx.paymentRefund.create({
      data: {
        paymentId: data.paymentId,
        transactionId: data.transactionId,
        originalAmount: payment.amount,
        refundAmount: new Prisma.Decimal(data.refundAmount),
        reason: data.reason,
        refundMethod: data.refundMethod || 'ORIGINAL_PAYMENT',
        status: 'PENDING',
      },
    });

    return {
      ...refund,
      originalAmount: convertToNumber(refund.originalAmount),
      refundAmount: convertToNumber(refund.refundAmount),
    } as PaymentRefund;
  });
}

export async function approveRefund(refundId: string, approvedBy: string, notes?: string): Promise<PaymentRefund> {
  const refund = await prisma.paymentRefund.update({
    where: { id: refundId },
    data: {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      notes,
    },
  });

  return {
    ...refund,
    originalAmount: convertToNumber(refund.originalAmount),
    refundAmount: convertToNumber(refund.refundAmount),
  } as PaymentRefund;
}

export async function processRefund(refundId: string, processedBy: string, notes?: string): Promise<PaymentRefund> {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.paymentRefund.findUnique({ where: { id: refundId } });
    if (!refund) throw new Error('Refund not found');

    if (refund.status !== 'APPROVED') {
      throw new Error('Refund must be approved before processing');
    }

    const payment = await tx.payment.findUnique({ where: { id: refund.paymentId } });
    if (!payment) throw new Error('Payment not found');

    // Update refund status
    const updatedRefund = await tx.paymentRefund.update({
      where: { id: refundId },
      data: {
        status: 'COMPLETED',
        processedBy,
        processedAt: new Date(),
        notes,
      },
    });

    // Create ledger entry for refund
    await createLedgerEntry({
      entryDate: new Date(),
      description: `Refund processed for Payment ${payment.id.substring(0, 8)} - ${refund.reason}`,
      debitAccount: 'Refunds Expense',
      creditAccount: payment.paymentMethod === 'CASH' ? 'Cash' : 'Bank',
      amount: convertToNumber(refund.refundAmount),
      referenceId: refund.id,
    }, tx);

    // Update customer/supplier outstanding balance if applicable
    if (payment.payerType === 'CUSTOMER') {
      await tx.customer.update({
        where: { id: payment.payerId },
        data: { outstandingBalance: { increment: new Prisma.Decimal(convertToNumber(refund.refundAmount)) } },
      });
    } else if (payment.payerType === 'SUPPLIER') {
      await tx.supplier.update({
        where: { id: payment.payerId },
        data: { outstandingBalance: { increment: new Prisma.Decimal(convertToNumber(refund.refundAmount)) } },
      });
    }

    return {
      ...updatedRefund,
      originalAmount: convertToNumber(updatedRefund.originalAmount),
      refundAmount: convertToNumber(updatedRefund.refundAmount),
    } as PaymentRefund;
  });
}

export async function getRefundsByPayment(paymentId: string): Promise<PaymentRefund[]> {
  const refunds = await prisma.paymentRefund.findMany({
    where: { paymentId },
    orderBy: { createdAt: 'desc' },
  });

  return refunds.map(r => ({
    ...r,
    originalAmount: convertToNumber(r.originalAmount),
    refundAmount: convertToNumber(r.refundAmount),
  })) as PaymentRefund[];
}

export async function rejectRefund(refundId: string, notes?: string): Promise<PaymentRefund> {
  const refund = await prisma.paymentRefund.update({
    where: { id: refundId },
    data: {
      status: 'REJECTED',
      notes,
    },
  });

  return {
    ...refund,
    originalAmount: convertToNumber(refund.originalAmount),
    refundAmount: convertToNumber(refund.refundAmount),
  } as PaymentRefund;
}

// ============================================================================
// Payment Reconciliation Functions
// ============================================================================

export async function createReconciliation(data: CreateReconciliationInput) {
  const reconciliation = await prisma.paymentReconciliation.create({
    data: {
      paymentId: data.paymentId,
      status: 'PENDING',
      notes: data.notes,
      verificationMethod: data.verificationMethod || 'MANUAL',
    },
  });

  return reconciliation;
}

export async function approveReconciliation(
  reconciliationId: string,
  reconciledBy: string,
  notes?: string
) {
  return prisma.$transaction(async (tx) => {
    const reconciliation = await tx.paymentReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: 'COMPLETED',
        reconciliedBy: reconciledBy,
        notes,
      },
    });

    // Mark payment as reconciled
    await tx.payment.update({
      where: { id: reconciliation.paymentId },
      data: {
        isReconciled: true,
        reconciledAt: new Date(),
        reconciledBy,
      },
    });

    return reconciliation;
  });
}

export async function rejectReconciliation(reconciliationId: string, notes?: string) {
  return prisma.paymentReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: 'FAILED',
      notes,
    },
  });
}

export async function getReconciliationsByPayment(paymentId: string) {
  return prisma.paymentReconciliation.findMany({
    where: { paymentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPendingReconciliations(limit: number = 50) {
  return prisma.paymentReconciliation.findMany({
    where: { status: 'PENDING' },
    include: { payment: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

export async function getUnreconciledPayments(limit: number = 50) {
  return prisma.payment.findMany({
    where: { isReconciled: false },
    orderBy: { paymentDate: 'desc' },
    take: limit,
  });
}

// ============================================================================
// Payment Analytics Functions
// ============================================================================

export async function getPaymentSummaryByMethod(startDate?: Date, endDate?: Date) {
  const where: Prisma.PaymentWhereInput = {
    status: 'COMPLETED',
  };

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = startDate;
    if (endDate) where.paymentDate.lte = endDate;
  }

  const summary = await prisma.payment.groupBy({
    by: ['paymentMethod'],
    where,
    _sum: {
      amount: true,
      transactionFee: true,
      netAmount: true,
    },
    _count: true,
  });

  return summary.map(s => ({
    paymentMethod: s.paymentMethod,
    count: s._count,
    totalAmount: convertToNumber(s._sum.amount),
    totalFees: convertToNumber(s._sum.transactionFee),
    netAmount: convertToNumber(s._sum.netAmount),
  }));
}

export async function getRefundSummary(startDate?: Date, endDate?: Date) {
  const where: Prisma.PaymentRefundWhereInput = {
    status: 'COMPLETED',
  };

  if (startDate || endDate) {
    where.processedAt = {};
    if (startDate) where.processedAt.gte = startDate;
    if (endDate) where.processedAt.lte = endDate;
  }

  const summary = await prisma.paymentRefund.aggregate({
    where,
    _count: true,
    _sum: {
      refundAmount: true,
    },
  });

  return {
    count: summary._count,
    totalRefunded: convertToNumber(summary._sum.refundAmount),
  };
}

export async function getReconciliationMetrics() {
  const total = await prisma.paymentReconciliation.count();
  const completed = await prisma.paymentReconciliation.count({ where: { status: 'COMPLETED' } });
  const pending = await prisma.paymentReconciliation.count({ where: { status: 'PENDING' } });
  const failed = await prisma.paymentReconciliation.count({ where: { status: 'FAILED' } });

  return {
    total,
    completed,
    pending,
    failed,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

/**
 * Create Payment record for POS Transaction
 * Handles both walk-in customers (no customerId) and registered customers
 * Creates ledger entries for revenue recognition
 * Updates customer outstanding balance
 */
export async function createPaymentFromTransaction(
  transactionId: string,
  customerId: string | null,
  amount: number,
  paymentMethod: string,
  txClient: Prisma.TransactionClient
): Promise<string> {
  try {
    console.log(`[Payment] Creating payment from transaction - ID: ${transactionId}, Customer: ${customerId}, Amount: ${amount}, Method: ${paymentMethod}`);
    
    // For walk-in customers (no customerId), we still need to record the payment
    // but it won't update customer balance (since there's no customer)
    
    if (customerId) {
      // Validate customer exists
      const customer = await txClient.customer.findUnique({
        where: { id: customerId }
      });
      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }
      console.log(`[Payment] Customer found: ${customer.id}`);
    }

    // Create Payment record
    const payment = await txClient.payment.create({
      data: {
        payerId: customerId || transactionId, // Use transactionId as fallback for walk-ins
        payerType: customerId ? 'CUSTOMER' : 'CUSTOMER', // Always CUSTOMER for POS
        customerId: customerId || null,
        supplierId: null,
        paymentDate: new Date(),
        amount: new Prisma.Decimal(amount),
        paymentMethod: paymentMethod as any,
        referenceNumber: `TXN-${transactionId.substring(0, 8).toUpperCase()}`,
        notes: `POS Transaction ${transactionId.substring(0, 8)}`,
        status: 'COMPLETED',
        transactionFee: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(amount),
        currency: 'USD',
      },
    });
    console.log(`[Payment] Payment record created: ${payment.id}`);

    // Create Ledger entries for revenue recognition
    const debitAccount = getAccountFromPaymentMethod(paymentMethod);
    console.log(`[Payment] Creating ledger entry - Debit: ${debitAccount}, Credit: Sales Revenue, Amount: ${amount}`);
    
    // Debit Cash/Bank account
    await createLedgerEntry(
      {
        entryDate: new Date(),
        description: `POS Sale - ${paymentMethod} (Ref: ${transactionId.substring(0, 8)})`,
        debitAccount,
        creditAccount: 'Sales Revenue',
        amount,
        referenceId: payment.id,
      },
      txClient
    );
    console.log(`[Payment] Ledger entry created`);

    // If there's a tax component, create separate ledger entry
    // This will be enhanced when tax calculation is available
    
    // Update customer outstanding balance if customer exists
    if (customerId) {
      // For POS sales, we're typically collecting payment immediately
      // So we don't increment the outstanding balance
      // This is different from credit sales where balance increases first
      await txClient.customer.update({
        where: { id: customerId },
        data: {
          // Don't update balance for cash sales
          // Balance only changes for credit sales (referenceOrderId)
        },
      });
      console.log(`[Payment] Customer balance check completed`);
    }

    // Link payment to transaction
    await txClient.transaction.update({
      where: { id: transactionId },
      data: { paymentId: payment.id },
    });
    console.log(`[Payment] Payment linked to transaction`);

    console.log(`[Payment] Payment creation completed successfully for transaction ${transactionId}`);
    return payment.id;
  } catch (error) {
    console.error(`[Payment] Error creating payment for transaction ${transactionId}:`, error);
    throw error;
  }
}

/**
 * Map payment method to ledger account
 */
function getAccountFromPaymentMethod(paymentMethod: string): string {
  const accountMap: Record<string, string> = {
    'CASH': 'Cash',
    'BANK_TRANSFER': 'Bank',
    'CARD': 'Bank',
    'UPI': 'Bank',
    'CHEQUE': 'Bank',
    'DIGITAL_WALLET': 'Bank',
    'CREDIT': 'Accounts Receivable',
    'DEBIT': 'Bank',
    'MOBILE_WALLET': 'Bank',
    'MIXED': 'Bank',
  };
  
  return accountMap[paymentMethod] || 'Bank';
}
