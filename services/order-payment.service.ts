// services/order-payment.service.ts

import { prisma } from '@/lib/prisma';
import { CreateOrderPaymentInput, OrderPaymentFiltersInput } from '@/lib/validations/order-payment.schema';
import { Prisma } from '@prisma/client';
import { createPayment, deletePayment } from './payment.service';

function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

function mapAllocationToOrderPayment(allocation: any) {
  const payment = allocation.payment;

  return {
    id: payment.id,
    salesOrderId: allocation.salesOrderId,
    customerId: payment.customerId,
    amount: convertToNumber(allocation.allocatedAmount),
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    salesOrder: allocation.salesOrder,
    customer: payment.customer,
  };
}

async function getSalesOrderAllocatedAmount(salesOrderId: string) {
  const allocations = await (prisma as any).orderPaymentAllocation.findMany({
    where: {
      orderType: 'SALES_ORDER',
      salesOrderId,
    },
  });

  return allocations.reduce(
    (sum: Prisma.Decimal, allocation: any) => sum.plus(allocation.allocatedAmount),
    new Prisma.Decimal(0)
  );
}

export async function createOrderPayment(input: CreateOrderPaymentInput) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: input.salesOrderId },
    include: { customer: true },
  });

  if (!order) {
    throw new Error('Sales order not found');
  }

  if (input.amount > Number(order.balanceAmount)) {
    throw new Error(`Payment amount exceeds remaining balance of ${Number(order.balanceAmount)}`);
  }

  const payment = await createPayment({
    payerId: order.customerId,
    payerType: 'CUSTOMER',
    amount: input.amount,
    paymentDate: input.paymentDate,
    paymentMethod: input.paymentMethod,
    referenceOrderId: input.salesOrderId,
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    status: 'COMPLETED',
  });

  const allocation = await (prisma as any).orderPaymentAllocation.findFirst({
    where: {
      paymentId: payment.id,
      orderType: 'SALES_ORDER',
      salesOrderId: input.salesOrderId,
    },
    include: {
      payment: {
        include: {
          customer: true,
        },
      },
      salesOrder: true,
    },
  });

  if (!allocation) {
    throw new Error('Failed to create payment allocation');
  }

  return mapAllocationToOrderPayment(allocation);
}

export async function getOrderPayments(salesOrderId: string) {
  const allocations = await (prisma as any).orderPaymentAllocation.findMany({
    where: {
      orderType: 'SALES_ORDER',
      salesOrderId,
    },
    include: {
      payment: {
        include: {
          customer: true,
        },
      },
      salesOrder: true,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  return allocations.map(mapAllocationToOrderPayment);
}

export async function getCustomerOrderPayments(
  customerId: string,
  filters?: Partial<OrderPaymentFiltersInput>
) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    orderType: 'SALES_ORDER' as const,
    payment: {
      customerId,
    },
  };

  const [allocations, total] = await Promise.all([
    (prisma as any).orderPaymentAllocation.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take: limit,
      include: {
        payment: {
          include: {
            customer: true,
          },
        },
        salesOrder: true,
      },
    }),
    (prisma as any).orderPaymentAllocation.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    payments: allocations.map(mapAllocationToOrderPayment),
    pagination: { page, limit, total, pages },
  };
}

export async function getOrderPaymentSummary(salesOrderId: string) {
  const [order, payments, allocatedAmount] = await Promise.all([
    prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
    }),
    getOrderPayments(salesOrderId),
    getSalesOrderAllocatedAmount(salesOrderId),
  ]);

  if (!order) {
    throw new Error('Sales order not found');
  }

  return {
    orderId: order.id,
    totalAmount: convertToNumber(order.totalAmount),
    paidAmount: convertToNumber(order.paidAmount),
    balanceAmount: convertToNumber(order.balanceAmount),
    paymentStatus: order.paymentStatus,
    paymentCount: payments.length,
    payments,
    allocatedAmount: convertToNumber(allocatedAmount),
  };
}

export async function deleteOrderPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (payment) {
    const allocation = await (prisma as any).orderPaymentAllocation.findFirst({
      where: {
        paymentId,
        orderType: 'SALES_ORDER',
      },
    });

    if (!allocation) {
      throw new Error('Payment is not linked to a sales order');
    }

    await deletePayment(paymentId);
    return;
  }

  throw new Error('Payment not found');
}

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
      (result._sum.totalAmount ?? new Prisma.Decimal(0)).minus(
        result._sum.paidAmount ?? new Prisma.Decimal(0)
      )
    ),
    paidOrders,
    partiallyPaidOrders,
    unpaidOrders,
  };
}
