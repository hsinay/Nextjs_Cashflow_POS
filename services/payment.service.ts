import { getCurrencyCode } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import runInteractiveTransaction from '@/lib/prisma-helpers';
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

function getSalesOrderPaymentState(
  totalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal
): {
  paidAmount: Prisma.Decimal;
  balanceAmount: Prisma.Decimal;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  status: 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID';
} {
  const normalizedPaid = paidAmount.lessThan(0) ? new Prisma.Decimal(0) : paidAmount;
  const balanceAmount = totalAmount.minus(normalizedPaid);
  const normalizedBalance = balanceAmount.lessThan(0) ? new Prisma.Decimal(0) : balanceAmount;
  const paymentStatus =
    normalizedPaid.lessThanOrEqualTo(0)
      ? 'UNPAID'
      : normalizedBalance.lessThanOrEqualTo(0)
        ? 'PAID'
        : 'PARTIALLY_PAID';
  const status =
    paymentStatus === 'PAID'
      ? 'PAID'
      : paymentStatus === 'PARTIALLY_PAID'
        ? 'PARTIALLY_PAID'
        : 'CONFIRMED';

  return {
    paidAmount: normalizedPaid,
    balanceAmount: normalizedBalance,
    paymentStatus,
    status,
  };
}

function getPurchaseOrderPaymentState(
  totalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal
): {
  paidAmount: Prisma.Decimal;
  balanceAmount: Prisma.Decimal;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'OVERPAID';
} {
  const normalizedPaid = paidAmount.lessThan(0) ? new Prisma.Decimal(0) : paidAmount;
  const balanceAmount = totalAmount.minus(normalizedPaid);
  const normalizedBalance = balanceAmount.lessThan(0) ? new Prisma.Decimal(0) : balanceAmount;
  const paymentStatus =
    normalizedPaid.lessThanOrEqualTo(0)
      ? 'PENDING'
      : normalizedBalance.lessThanOrEqualTo(0)
        ? (normalizedPaid.greaterThan(totalAmount) ? 'OVERPAID' : 'FULLY_PAID')
        : 'PARTIALLY_PAID';

  return {
    paidAmount: normalizedPaid,
    balanceAmount: normalizedBalance,
    paymentStatus,
  };
}

async function syncSalesOrderPaymentState(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.salesOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Sales order not found');
  }

  const allocations = await (tx as any).orderPaymentAllocation.findMany({
    where: {
      orderType: 'SALES_ORDER',
      salesOrderId: orderId,
    },
  });

  const paidAmount = allocations.reduce(
    (sum: Prisma.Decimal, allocation: any) => sum.plus(allocation.allocatedAmount),
    new Prisma.Decimal(0)
  );
  const nextState = getSalesOrderPaymentState(order.totalAmount, paidAmount);

  return tx.salesOrder.update({
    where: { id: orderId },
    data: nextState,
  });
}

async function syncCustomerOutstandingBalance(tx: Prisma.TransactionClient, customerId: string) {
  const aggregate = await tx.salesOrder.aggregate({
    where: {
      customerId,
      status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
    },
    _sum: {
      balanceAmount: true,
    },
  });

  return tx.customer.update({
    where: { id: customerId },
    data: {
      outstandingBalance: aggregate._sum.balanceAmount ?? new Prisma.Decimal(0),
    },
  });
}

async function syncSupplierOutstandingBalance(tx: Prisma.TransactionClient, supplierId: string) {
  const aggregate = await tx.purchaseOrder.aggregate({
    where: {
      supplierId,
      status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] },
    },
    _sum: {
      balanceAmount: true,
    },
  });

  return tx.supplier.update({
    where: { id: supplierId },
    data: {
      outstandingBalance: aggregate._sum.balanceAmount ?? new Prisma.Decimal(0),
    },
  });
}

async function syncPurchaseOrderPaymentState(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const order = await tx.purchaseOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Purchase order not found');
  }

  const allocations = await (tx as any).orderPaymentAllocation.findMany({
    where: {
      orderType: 'PURCHASE_ORDER',
      purchaseOrderId: orderId,
    },
  });
  const paidAmount = allocations.reduce(
    (sum: Prisma.Decimal, allocation: any) => sum.plus(allocation.allocatedAmount),
    new Prisma.Decimal(0)
  );
  const nextState = getPurchaseOrderPaymentState(order.totalAmount, paidAmount);

  return tx.purchaseOrder.update({
    where: { id: orderId },
    data: nextState,
  });
}

async function getReservedRefundAmount(
  tx: Prisma.TransactionClient,
  paymentId: string,
  excludeRefundId?: string
) {
  const aggregate = await tx.paymentRefund.aggregate({
    where: {
      paymentId,
      status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] },
      ...(excludeRefundId ? { id: { not: excludeRefundId } } : {}),
    },
    _sum: {
      refundAmount: true,
    },
  });

  return aggregate._sum.refundAmount ?? new Prisma.Decimal(0);
}

async function getSupplierPaymentAllocations(
  tx: Prisma.TransactionClient,
  paymentId: string
) {
  return (tx as any).orderPaymentAllocation.findMany({
    where: {
      paymentId,
      orderType: 'PURCHASE_ORDER',
      purchaseOrderId: { not: null },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

async function getCustomerPaymentAllocations(
  tx: Prisma.TransactionClient,
  paymentId: string
) {
  return (tx as any).orderPaymentAllocation.findMany({
    where: {
      paymentId,
      orderType: 'SALES_ORDER',
      salesOrderId: { not: null },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

async function reverseCustomerPaymentApplications(
  tx: Prisma.TransactionClient,
  payment: any
) {
  const allocations = await getCustomerPaymentAllocations(tx, payment.id);

  if (allocations.length === 0) {
    throw new Error(
      'Missing payment allocations for customer payment. Run the payment allocation backfill before editing, refunding, or deleting this payment.'
    );
  }

  const affectedOrderIds: string[] = Array.from(
    new Set(
      allocations
        .map((allocation: any) => allocation.salesOrderId as string | null | undefined)
        .filter((orderId: string | null | undefined): orderId is string => Boolean(orderId))
    )
  );

  await (tx as any).orderPaymentAllocation.deleteMany({
    where: {
      paymentId: payment.id,
      orderType: 'SALES_ORDER',
    },
  });

  for (const orderId of affectedOrderIds) {
    await syncSalesOrderPaymentState(tx, orderId);
  }

  if (payment.customerId) {
    await syncCustomerOutstandingBalance(tx, payment.customerId);
  }

  return affectedOrderIds;
}

async function createCustomerAllocation(
  tx: Prisma.TransactionClient,
  input: {
    paymentId: string;
    salesOrderId: string;
    allocatedAmount: Prisma.Decimal;
  }
) {
  return (tx as any).orderPaymentAllocation.create({
    data: {
      paymentId: input.paymentId,
      orderType: 'SALES_ORDER',
      salesOrderId: input.salesOrderId,
      allocatedAmount: input.allocatedAmount,
    },
  });
}

async function createSupplierAllocation(
  tx: Prisma.TransactionClient,
  input: {
    paymentId: string;
    purchaseOrderId: string;
    allocatedAmount: Prisma.Decimal;
  }
) {
  return (tx as any).orderPaymentAllocation.create({
    data: {
      paymentId: input.paymentId,
      orderType: 'PURCHASE_ORDER',
      purchaseOrderId: input.purchaseOrderId,
      allocatedAmount: input.allocatedAmount,
    },
  });
}

async function applyCustomerPaymentApplications(
  tx: Prisma.TransactionClient,
  input: {
    paymentId: string;
    customerId: string;
    amount: Prisma.Decimal;
    paymentDate: Date;
    paymentMethod: any;
    referenceOrderId?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
  }
) {
  let remainingAmount = input.amount;
  const affectedOrderIds = new Set<string>();

  if (input.referenceOrderId) {
    const order = await tx.salesOrder.findUnique({
      where: { id: input.referenceOrderId },
    });

    if (!order) throw new Error('Sales order not found');
    if (order.customerId !== input.customerId) {
      throw new Error('Payment customer does not match sales order customer');
    }
    if (remainingAmount.greaterThan(order.balanceAmount)) {
      throw new Error('Payment amount exceeds sales order balance');
    }

    if (remainingAmount.greaterThan(0)) {
      await createCustomerAllocation(tx, {
        paymentId: input.paymentId,
        salesOrderId: input.referenceOrderId,
        allocatedAmount: remainingAmount,
      });
      affectedOrderIds.add(input.referenceOrderId);
      remainingAmount = new Prisma.Decimal(0);
    }
  } else {
    const unpaidOrders = await tx.salesOrder.findMany({
      where: {
        customerId: input.customerId,
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    for (const order of unpaidOrders) {
      if (remainingAmount.lessThanOrEqualTo(0)) {
        break;
      }

      const allocatableAmount = remainingAmount.greaterThan(order.balanceAmount)
        ? order.balanceAmount
        : remainingAmount;

      if (allocatableAmount.lessThanOrEqualTo(0)) {
        continue;
      }

      await createCustomerAllocation(tx, {
        paymentId: input.paymentId,
        salesOrderId: order.id,
        allocatedAmount: allocatableAmount,
      });

      affectedOrderIds.add(order.id);
      remainingAmount = remainingAmount.minus(allocatableAmount);
    }
  }

  for (const orderId of affectedOrderIds) {
    await syncSalesOrderPaymentState(tx, orderId);
  }

  await syncCustomerOutstandingBalance(tx, input.customerId);

  return {
    affectedOrderIds: Array.from(affectedOrderIds),
    unallocatedAmount: remainingAmount,
  };
}

async function reverseSupplierPaymentApplications(
  tx: Prisma.TransactionClient,
  payment: any
) {
  const allocations = await getSupplierPaymentAllocations(tx, payment.id);

  if (allocations.length === 0) {
    throw new Error(
      'Missing payment allocations for supplier payment. Run the payment allocation backfill before editing, refunding, or deleting this payment.'
    );
  }

  const affectedOrderIds: string[] = Array.from(
    new Set(
      allocations
        .map((allocation: any) => allocation.purchaseOrderId as string | null | undefined)
        .filter((orderId: string | null | undefined): orderId is string => Boolean(orderId))
    )
  );

  await (tx as any).orderPaymentAllocation.deleteMany({
    where: {
      paymentId: payment.id,
      orderType: 'PURCHASE_ORDER',
    },
  });

  for (const orderId of affectedOrderIds) {
    await syncPurchaseOrderPaymentState(tx, orderId);
  }

  if (payment.supplierId) {
    await syncSupplierOutstandingBalance(tx, payment.supplierId);
  }

  return affectedOrderIds;
}

async function applySupplierPaymentApplications(
  tx: Prisma.TransactionClient,
  input: {
    paymentId: string;
    supplierId: string;
    amount: Prisma.Decimal;
    referenceOrderId?: string | null;
  }
) {
  let remainingAmount = input.amount;
  const affectedOrderIds = new Set<string>();

  if (input.referenceOrderId) {
    const order = await tx.purchaseOrder.findUnique({
      where: { id: input.referenceOrderId },
    });

    if (!order) throw new Error('Purchase order not found');
    if (order.supplierId !== input.supplierId) {
      throw new Error('Payment supplier does not match purchase order supplier');
    }
    if (remainingAmount.greaterThan(order.balanceAmount)) {
      throw new Error('Payment amount exceeds purchase order balance');
    }

    if (remainingAmount.greaterThan(0)) {
      await createSupplierAllocation(tx, {
        paymentId: input.paymentId,
        purchaseOrderId: input.referenceOrderId,
        allocatedAmount: remainingAmount,
      });
      affectedOrderIds.add(input.referenceOrderId);
      remainingAmount = new Prisma.Decimal(0);
    }
  } else {
    const unpaidOrders = await tx.purchaseOrder.findMany({
      where: {
        supplierId: input.supplierId,
        status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    for (const order of unpaidOrders) {
      if (remainingAmount.lessThanOrEqualTo(0)) {
        break;
      }

      const allocatableAmount = remainingAmount.greaterThan(order.balanceAmount)
        ? order.balanceAmount
        : remainingAmount;

      if (allocatableAmount.lessThanOrEqualTo(0)) {
        continue;
      }

      await createSupplierAllocation(tx, {
        paymentId: input.paymentId,
        purchaseOrderId: order.id,
        allocatedAmount: allocatableAmount,
      });

      affectedOrderIds.add(order.id);
      remainingAmount = remainingAmount.minus(allocatableAmount);
    }
  }

  for (const orderId of affectedOrderIds) {
    await syncPurchaseOrderPaymentState(tx, orderId);
  }

  await syncSupplierOutstandingBalance(tx, input.supplierId);

  return {
    affectedOrderIds: Array.from(affectedOrderIds),
    unallocatedAmount: remainingAmount,
  };
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
  return runInteractiveTransaction(async (tx) => {
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
        currency: getCurrencyCode(),
      },
    });

    // Update SalesOrder/PurchaseOrder balanceAmount
    if (payerType === 'CUSTOMER') {
        await applyCustomerPaymentApplications(tx, {
          paymentId: payment.id,
          customerId: payerId,
          amount: payment.amount,
          paymentDate: paymentDate || payment.createdAt,
          paymentMethod,
          referenceOrderId,
          referenceNumber,
          notes,
        });
        await createLedgerEntry({
            entryDate: payment.createdAt,
            description: `Payment received from Customer ${payerId.substring(0,8)} for ${paymentMethod}`,
            debitAccount: paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            creditAccount: 'Accounts Receivable',
            amount: Number(payment.amount),
            referenceId: payment.id,
        }, tx);
    } else if (payerType === 'SUPPLIER') {
        await applySupplierPaymentApplications(tx, {
          paymentId: payment.id,
          supplierId: payerId,
          amount: payment.amount,
          referenceOrderId,
        });
        await syncSupplierOutstandingBalance(tx, payerId);
        await createLedgerEntry({
            entryDate: payment.createdAt,
            description: `Payment made to Supplier ${payerId.substring(0,8)} for ${paymentMethod}`,
            debitAccount: 'Accounts Payable',
            creditAccount: paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            amount: Number(payment.amount),
            referenceId: payment.id,
        }, tx);
    }

    return convertPaymentToNumber(payment);
  });
}

export async function updatePayment(id: string, data: UpdatePaymentInput): Promise<Payment> {
  return runInteractiveTransaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({ where: { id } });
    if (!existingPayment) throw new Error('Payment not found');

    const nextAmount = data.amount !== undefined ? new Prisma.Decimal(data.amount) : existingPayment.amount;
    const nextReferenceOrderId =
      data.referenceOrderId !== undefined ? data.referenceOrderId : existingPayment.referenceOrderId;
    const nextPaymentMethod = data.paymentMethod ?? existingPayment.paymentMethod;
    const nextPaymentDate = data.paymentDate ?? existingPayment.paymentDate;
    const nextReferenceNumber =
      data.referenceNumber !== undefined ? data.referenceNumber : existingPayment.referenceNumber;
    const nextNotes = data.notes !== undefined ? data.notes : existingPayment.notes;

    const financialFieldsChanged =
      data.amount !== undefined ||
      data.referenceOrderId !== undefined ||
      data.paymentMethod !== undefined ||
      data.paymentDate !== undefined ||
      data.referenceNumber !== undefined;

    if (
      financialFieldsChanged &&
      existingPayment.payerType === 'SUPPLIER' &&
      existingPayment.supplierId
    ) {
      const supplierAllocations = await getSupplierPaymentAllocations(tx, existingPayment.id);
      if (supplierAllocations.length === 0) {
        throw new Error(
          'Missing payment allocations for supplier payment. Run the payment allocation backfill before editing this payment.'
        );
      }
    }

    const customerProjectionFieldsChanged =
      financialFieldsChanged || data.notes !== undefined;

    if (
      existingPayment.payerType === 'CUSTOMER' &&
      existingPayment.customerId &&
      customerProjectionFieldsChanged
    ) {
      await reverseCustomerPaymentApplications(tx, existingPayment);
    }
    if (
      existingPayment.payerType === 'SUPPLIER' &&
      existingPayment.supplierId &&
      customerProjectionFieldsChanged
    ) {
      await reverseSupplierPaymentApplications(tx, existingPayment);
    }

    const updatedPayment = await tx.payment.update({
      where: { id },
      data: {
        paymentDate: data.paymentDate,
        amount: data.amount !== undefined ? nextAmount : undefined,
        paymentMethod: data.paymentMethod,
        referenceOrderId: data.referenceOrderId,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        status: data.status,
        isReconciled: data.isReconciled,
        reconciledBy: data.reconciledBy,
        netAmount:
          data.amount !== undefined
            ? nextAmount.minus(existingPayment.transactionFee)
            : undefined,
      },
      include: {
        customer: true,
        supplier: true,
      },
    });

    if (
      updatedPayment.payerType === 'CUSTOMER' &&
      updatedPayment.customerId &&
      customerProjectionFieldsChanged
    ) {
      await applyCustomerPaymentApplications(tx, {
        paymentId: updatedPayment.id,
        customerId: updatedPayment.customerId,
        amount: nextAmount,
        paymentDate: nextPaymentDate,
        paymentMethod: nextPaymentMethod,
        referenceOrderId: nextReferenceOrderId,
        referenceNumber: nextReferenceNumber,
        notes: nextNotes,
      });
    } else if (updatedPayment.payerType === 'CUSTOMER' && updatedPayment.customerId) {
      await syncCustomerOutstandingBalance(tx, updatedPayment.customerId);
    }

    if (
      updatedPayment.payerType === 'SUPPLIER' &&
      updatedPayment.supplierId &&
      customerProjectionFieldsChanged
    ) {
      await applySupplierPaymentApplications(tx, {
        paymentId: updatedPayment.id,
        supplierId: updatedPayment.supplierId,
        amount: nextAmount,
        referenceOrderId: nextReferenceOrderId,
      });
    } else if (updatedPayment.payerType === 'SUPPLIER') {
      await syncSupplierOutstandingBalance(tx, updatedPayment.payerId);
    }

    return convertPaymentToNumber(updatedPayment);
  });
}

export async function deletePayment(id: string): Promise<void> {
  return runInteractiveTransaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({ where: { id } });
    if (!existingPayment) throw new Error('Payment not found');

    // Revert SalesOrder/PurchaseOrder balanceAmount
    if (existingPayment.payerType === 'CUSTOMER' && existingPayment.customerId) {
        await reverseCustomerPaymentApplications(tx, existingPayment);
    } else if (existingPayment.payerType === 'SUPPLIER' && existingPayment.supplierId) {
        await reverseSupplierPaymentApplications(tx, existingPayment);
    }

    // Revert Customer/Supplier outstandingBalance
    if (existingPayment.payerType === 'CUSTOMER') {
        await syncCustomerOutstandingBalance(tx, existingPayment.payerId);
        await createLedgerEntry({
            entryDate: new Date(),
            description: `Payment reversal from Customer ${existingPayment.payerId.substring(0,8)}`,
            debitAccount: 'Accounts Receivable',
            creditAccount: existingPayment.paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            amount: Number(existingPayment.amount),
            referenceId: existingPayment.id,
        }, tx);
    } else if (existingPayment.payerType === 'SUPPLIER') {
        await syncSupplierOutstandingBalance(tx, existingPayment.payerId);
        await createLedgerEntry({
            entryDate: new Date(),
            description: `Payment reversal to Supplier ${existingPayment.payerId.substring(0,8)}`,
            debitAccount: existingPayment.paymentMethod === 'CASH' ? 'Cash' : 'Bank',
            creditAccount: 'Accounts Payable',
            amount: Number(existingPayment.amount),
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
  return runInteractiveTransaction(async (tx) => {
    // Validate payment exists
    const payment = await tx.payment.findUnique({ where: { id: data.paymentId } });
    if (!payment) throw new Error('Payment not found');

    const requestedRefundAmount = new Prisma.Decimal(data.refundAmount);
    const reservedRefundAmount = await getReservedRefundAmount(tx, data.paymentId);
    const availableRefundAmount = payment.amount.minus(reservedRefundAmount);

    // Validate refund amount doesn't exceed remaining refundable payment
    if (requestedRefundAmount.greaterThan(availableRefundAmount)) {
      throw new Error('Refund amount cannot exceed the remaining refundable payment amount');
    }

    // Create refund record
    const refund = await tx.paymentRefund.create({
      data: {
        paymentId: data.paymentId,
        transactionId: data.transactionId,
        originalAmount: payment.amount,
        refundAmount: requestedRefundAmount,
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
  return runInteractiveTransaction(async (tx) => {
    const refund = await tx.paymentRefund.findUnique({ where: { id: refundId } });
    if (!refund) throw new Error('Refund not found');

    if (refund.status !== 'APPROVED') {
      throw new Error('Refund must be approved before processing');
    }

    const payment = await tx.payment.findUnique({ where: { id: refund.paymentId } });
    if (!payment) throw new Error('Payment not found');

    const reservedRefundAmount = await getReservedRefundAmount(tx, payment.id, refund.id);
    const availableRefundAmount = payment.amount.minus(reservedRefundAmount);
    if (refund.refundAmount.greaterThan(availableRefundAmount)) {
      throw new Error('Refund amount exceeds the remaining refundable payment amount');
    }

    const nextPaymentAmount = payment.amount.minus(refund.refundAmount);
    if (nextPaymentAmount.lessThan(0)) {
      throw new Error('Refund amount cannot reduce payment below zero');
    }

    const nextNetAmount = payment.netAmount.minus(refund.refundAmount);
    const normalizedNetAmount = nextNetAmount.lessThan(0)
      ? new Prisma.Decimal(0)
      : nextNetAmount;

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

    if (payment.payerType === 'CUSTOMER' && payment.customerId) {
      await reverseCustomerPaymentApplications(tx, payment);
    }
    if (payment.payerType === 'SUPPLIER' && payment.supplierId) {
      await reverseSupplierPaymentApplications(tx, payment);
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        amount: nextPaymentAmount,
        netAmount: normalizedNetAmount,
        notes: payment.notes
          ? `${payment.notes}\nRefunded ${convertToNumber(refund.refundAmount)} on ${new Date().toISOString()}`
          : `Refunded ${convertToNumber(refund.refundAmount)} on ${new Date().toISOString()}`,
      },
    });

    if (payment.payerType === 'CUSTOMER' && payment.customerId) {
      if (updatedPayment.amount.greaterThan(0)) {
        await applyCustomerPaymentApplications(tx, {
          paymentId: payment.id,
          customerId: payment.customerId,
          amount: updatedPayment.amount,
          paymentDate: updatedPayment.paymentDate,
          paymentMethod: updatedPayment.paymentMethod,
          referenceOrderId: updatedPayment.referenceOrderId,
          referenceNumber: updatedPayment.referenceNumber,
          notes: updatedPayment.notes,
        });
      } else {
        await syncCustomerOutstandingBalance(tx, payment.customerId);
      }
    }

    if (payment.payerType === 'SUPPLIER') {
      if (updatedPayment.amount.greaterThan(0) && updatedPayment.supplierId) {
        await applySupplierPaymentApplications(tx, {
          paymentId: updatedPayment.id,
          supplierId: updatedPayment.supplierId,
          amount: updatedPayment.amount,
          referenceOrderId: updatedPayment.referenceOrderId,
        });
      }
      await syncSupplierOutstandingBalance(tx, payment.payerId);
    }

    // Create ledger entry for refund
    await createLedgerEntry({
      entryDate: new Date(),
      description: `Refund processed for Payment ${payment.id.substring(0, 8)} - ${refund.reason}`,
      debitAccount: 'Refunds Expense',
      creditAccount: payment.paymentMethod === 'CASH' ? 'Cash' : 'Bank',
      amount: Number(refund.refundAmount),
      referenceId: refund.id,
    }, tx);

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
  return runInteractiveTransaction(async (tx) => {
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
  txClient: Prisma.TransactionClient,
  referenceOrderId?: string | null,
  paymentDate?: Date,
  referenceNumber?: string | null,
  notes?: string | null
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
        paymentDate: paymentDate || new Date(),
        amount: new Prisma.Decimal(amount),
        paymentMethod: paymentMethod as any,
        referenceOrderId: referenceOrderId || null,
        referenceNumber: referenceNumber || `TXN-${transactionId.substring(0, 8).toUpperCase()}`,
        notes: notes || `POS Transaction ${transactionId.substring(0, 8)}`,
        status: 'COMPLETED',
        transactionFee: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(amount),
        currency: getCurrencyCode(),
      },
    });
    console.log(`[Payment] Payment record created: ${payment.id}`);

    if (customerId && referenceOrderId) {
      await createCustomerAllocation(txClient, {
        paymentId: payment.id,
        salesOrderId: referenceOrderId,
        allocatedAmount: payment.amount,
      });
      await syncSalesOrderPaymentState(txClient, referenceOrderId);
      await syncCustomerOutstandingBalance(txClient, customerId);
    }

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
