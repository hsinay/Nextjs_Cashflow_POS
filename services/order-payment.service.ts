// services/order-payment.service.ts

import { prisma } from '@/lib/prisma';
import { CreateOrderPaymentInput, OrderPaymentFiltersInput } from '@/lib/validations/order-payment.schema';
import { Prisma } from '@prisma/client';

/**
 * Convert Decimal to number for JSON serialization
 */
function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

/**
 * Convert object with Decimals to numbers
 */
function convertPaymentToNumber(payment: any) {
  return {
    ...payment,
    amount: convertToNumber(payment.amount),
  };
}

/**
 * Create a new order payment
 */
export async function createOrderPayment(input: CreateOrderPaymentInput) {
  // Validate order exists and get details
  const order = await prisma.salesOrder.findUnique({
    where: { id: input.salesOrderId },
    include: { customer: true },
  });

  if (!order) {
    throw new Error('Sales order not found');
  }

  // Check that payment amount doesn't exceed remaining balance
  const remainingBalance = order.totalAmount.toNumber() - order.paidAmount.toNumber();
  if (input.amount > remainingBalance) {
    throw new Error(`Payment amount exceeds remaining balance of ${remainingBalance}`);
  }

  // Create the payment record
  const payment = await prisma.orderPayment.create({
    data: {
      salesOrderId: input.salesOrderId,
      customerId: order.customerId,
      amount: new Prisma.Decimal(input.amount),
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
    },
    include: {
      salesOrder: true,
      customer: true,
    },
  });

  // Update order with new paid amount
  const newPaidAmount = order.paidAmount.add(new Prisma.Decimal(input.amount));
  const isFullyPaid = newPaidAmount.gte(order.totalAmount);
  const isPartiallPaid = newPaidAmount.gt(0);

  await prisma.salesOrder.update({
    where: { id: input.salesOrderId },
    data: {
      paidAmount: newPaidAmount,
      paymentStatus: isFullyPaid ? 'PAID' : isPartiallPaid ? 'PARTIALLY_PAID' : 'UNPAID',
      status: isFullyPaid ? 'PAID' : order.status,
      balanceAmount: order.totalAmount.sub(newPaidAmount),
    },
  });

  // Create DayBook entry for cashflow tracking
  const dayBook = await getOrCreateDayBook();
  if (dayBook) {
    await prisma.dayBookEntry.create({
      data: {
        dayBookId: dayBook.id,
        entryType: 'CASH_RECEIPT',
        entryDate: new Date(input.paymentDate),
        description: `Payment received from customer ${order.customer.name} for order ${input.salesOrderId.slice(0, 8)}`,
        amount: new Prisma.Decimal(input.amount),
        paymentMethod: input.paymentMethod,
        referenceType: 'SALES_ORDER_PAYMENT',
        referenceId: payment.id,
        partyType: 'CUSTOMER',
        partyId: order.customerId,
        partyName: order.customer.name,
        debitAccount: 'CASH',
        creditAccount: 'SALES_REVENUE',
        createdById: 'system', // In real scenario, get from session
      },
    });
  }

  return convertPaymentToNumber(payment);
}

/**
 * Get all payments for a sales order
 */
export async function getOrderPayments(salesOrderId: string) {
  const payments = await prisma.orderPayment.findMany({
    where: { salesOrderId },
    orderBy: { createdAt: 'desc' },
    include: {
      salesOrder: true,
      customer: true,
    },
  });

  return payments.map(convertPaymentToNumber);
}

/**
 * Get all payments for a customer
 */
export async function getCustomerOrderPayments(
  customerId: string,
  filters?: Partial<OrderPaymentFiltersInput>
) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const payments = await prisma.orderPayment.findMany({
    where: { customerId },
    orderBy: { paymentDate: 'desc' },
    skip,
    take: limit,
    include: {
      salesOrder: true,
      customer: true,
    },
  });

  const total = await prisma.orderPayment.count({ where: { customerId } });
  const pages = Math.ceil(total / limit);

  return {
    payments: payments.map(convertPaymentToNumber),
    pagination: { page, limit, total, pages },
  };
}

/**
 * Get order payment summary
 */
export async function getOrderPaymentSummary(salesOrderId: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      payments: {
        select: {
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          referenceNumber: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Sales order not found');
  }

  return {
    orderId: order.id,
    totalAmount: convertToNumber(order.totalAmount),
    paidAmount: convertToNumber(order.paidAmount),
    balanceAmount: convertToNumber(order.balanceAmount),
    paymentStatus: order.paymentStatus,
    paymentCount: order.payments.length,
    payments: order.payments.map(convertPaymentToNumber),
  };
}

/**
 * Delete a payment (with validation)
 */
export async function deleteOrderPayment(paymentId: string) {
  const payment = await prisma.orderPayment.findUnique({
    where: { id: paymentId },
    include: { salesOrder: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Recalculate order amounts
  const newPaidAmount = payment.salesOrder.paidAmount.sub(payment.amount);
  const order = await prisma.salesOrder.findUnique({
    where: { id: payment.salesOrderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Update order
  await prisma.salesOrder.update({
    where: { id: payment.salesOrderId },
    data: {
      paidAmount: newPaidAmount,
      paymentStatus: newPaidAmount.lte(0) ? 'UNPAID' : 'PARTIALLY_PAID',
      balanceAmount: order.totalAmount.sub(newPaidAmount),
    },
  });

  // Remove DayBook entry
  await prisma.dayBookEntry.deleteMany({
    where: {
      referenceId: paymentId,
      referenceType: 'SALES_ORDER_PAYMENT',
    },
  });

  // Delete payment
  return await prisma.orderPayment.delete({
    where: { id: paymentId },
  });
}

/**
 * Get or create DayBook for today
 */
async function getOrCreateDayBook() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dayBook = await prisma.dayBook.findUnique({
    where: { date: today },
  });

  if (!dayBook) {
    // Create DayBook with system user
    const systemUser = await prisma.user.findFirst({
      where: { username: 'system' },
    });

    if (systemUser) {
      dayBook = await prisma.dayBook.create({
        data: {
          date: today,
          openedById: systemUser.id,
          status: 'OPEN',
        },
      });
    }
  }

  return dayBook;
}

/**
 * Get payment statistics for a customer
 */
export async function getCustomerPaymentStats(customerId: string) {
  const result = await prisma.salesOrder.aggregate({
    where: { customerId },
    _sum: {
      totalAmount: true,
      paidAmount: true,
    },
    _count: {
      id: true,
    },
  });

  const paidOrders = await prisma.salesOrder.count({
    where: { customerId, paymentStatus: 'PAID' },
  });

  const partiallyPaidOrders = await prisma.salesOrder.count({
    where: { customerId, paymentStatus: 'PARTIALLY_PAID' },
  });

  const unpaidOrders = await prisma.salesOrder.count({
    where: { customerId, paymentStatus: 'UNPAID' },
  });

  return {
    totalOrders: result._count.id,
    totalOrderValue: convertToNumber(result._sum.totalAmount || 0),
    totalPaidAmount: convertToNumber(result._sum.paidAmount || 0),
    totalOutstanding: convertToNumber(
      (result._sum.totalAmount || 0) - (result._sum.paidAmount || 0)
    ),
    paidOrders,
    partiallyPaidOrders,
    unpaidOrders,
  };
}
