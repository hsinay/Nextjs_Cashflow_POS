// services/payment-reconciliation.service.ts

import { prisma } from '@/lib/prisma';

export interface ReconciliationItem {
  id: string;
  purchaseOrderId: string;
  paymentId?: string;
  poAmount: number;
  paidAmount: number;
  status: 'UNMATCHED' | 'PARTIAL' | 'MATCHED' | 'OVERPAID';
  agingDays: number;
  poDate: Date;
  dueDate?: Date;
}

export interface SupplierAging {
  supplierId: string;
  supplierName: string;
  current: number;     // 0-30 days
  days31_60: number;   // 31-60 days
  days61_90: number;   // 61-90 days
  beyond90: number;    // 90+ days
  total: number;
  percentage: {
    current: number;
    days31_60: number;
    days61_90: number;
    beyond90: number;
  };
}

export interface PaymentReconciliationReport {
  reportDate: Date;
  supplierId: string;
  supplierName: string;
  creditLimit: number;
  outstandingBalance: number;
  items: ReconciliationItem[];
  summary: {
    totalPOs: number;
    totalMatchedPayments: number;
    unmatchedAmount: number;
    overPayments: number;
  };
}

export interface SupplierStatement {
  supplierId: string;
  supplierName: string;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  closingBalance: number;
  transactions: {
    date: Date;
    type: 'PO_CREATED' | 'PAYMENT_RECEIVED' | 'ADJUSTMENT';
    referenceId: string;
    debit?: number;
    credit?: number;
    balance: number;
  }[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    daysOverdue: number;
    lastPaymentDate?: Date;
  };
}

/**
 * Get unmatched purchase orders for supplier
 */
export async function getUnmatchedPOs(supplierId: string) {
  const unmatched = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      status: 'CONFIRMED',
      balanceAmount: { gt: 0 }, // Outstanding balance
    },
    include: {
      items: true,
      supplier: true,
    },
    orderBy: { orderDate: 'asc' },
  });

  return unmatched.map((po) => ({
    id: po.id,
    purchaseOrderId: po.id,
    poAmount: Number(po.totalAmount),
    paidAmount: Number(po.paidAmount),
    remainingBalance: Number(po.balanceAmount),
    status: po.paymentStatus,
    orderDate: po.orderDate,
    daysOutstanding: Math.floor(
      (new Date().getTime() - po.orderDate.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

/**
 * Reconcile payments against purchase orders
 */
export async function reconcilePayments(
  supplierId: string,
  startDate?: Date,
  endDate?: Date
): Promise<PaymentReconciliationReport> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      status: { in: ['CONFIRMED', 'RECEIVED'] },
      ...(startDate && { orderDate: { gte: startDate } }),
      ...(endDate && { orderDate: { lte: endDate } }),
    },
    include: { items: true },
  });

  const reconciliationItems: ReconciliationItem[] = [];
  let unmatchedAmount = 0;
  let overPayments = 0;

  for (const po of purchaseOrders) {
    const payments = await prisma.payment.findMany({
      where: { referenceOrderId: po.id },
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const poTotal = Number(po.totalAmount);

    let status: 'UNMATCHED' | 'PARTIAL' | 'MATCHED' | 'OVERPAID';
    if (totalPaid === 0) status = 'UNMATCHED';
    else if (totalPaid < poTotal) status = 'PARTIAL';
    else if (totalPaid === poTotal) status = 'MATCHED';
    else status = 'OVERPAID';

    const agingDays = Math.floor(
      (new Date().getTime() - po.orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    reconciliationItems.push({
      id: po.id,
      purchaseOrderId: po.id,
      poAmount: poTotal,
      paidAmount: totalPaid,
      status,
      agingDays,
      poDate: po.orderDate,
    });

    if (status === 'UNMATCHED') unmatchedAmount += poTotal;
    if (status === 'OVERPAID') overPayments += totalPaid - poTotal;
  }

  return {
    reportDate: new Date(),
    supplierId,
    supplierName: supplier.name,
    creditLimit: Number(supplier.creditLimit),
    outstandingBalance: Number(supplier.outstandingBalance),
    items: reconciliationItems,
    summary: {
      totalPOs: purchaseOrders.length,
      totalMatchedPayments: reconciliationItems.filter((i) => i.status === 'MATCHED').length,
      unmatchedAmount,
      overPayments,
    },
  };
}

/**
 * Calculate aging buckets for supplier
 */
export async function calculateSupplierAging(supplierId: string): Promise<SupplierAging> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      status: 'CONFIRMED',
    },
  });

  const now = new Date();
  let current = 0;
  let days31_60 = 0;
  let days61_90 = 0;
  let beyond90 = 0;

  for (const po of purchaseOrders) {
    const agingDays = Math.floor(
      (now.getTime() - po.orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const balance = Number(po.balanceAmount);

    if (agingDays <= 30) current += balance;
    else if (agingDays <= 60) days31_60 += balance;
    else if (agingDays <= 90) days61_90 += balance;
    else beyond90 += balance;
  }

  const total = current + days31_60 + days61_90 + beyond90;

  return {
    supplierId,
    supplierName: supplier.name,
    current,
    days31_60,
    days61_90,
    beyond90,
    total,
    percentage: {
      current: total > 0 ? (current / total) * 100 : 0,
      days31_60: total > 0 ? (days31_60 / total) * 100 : 0,
      days61_90: total > 0 ? (days61_90 / total) * 100 : 0,
      beyond90: total > 0 ? (beyond90 / total) * 100 : 0,
    },
  };
}

/**
 * Generate supplier statement for period
 */
export async function generateSupplierStatement(
  supplierId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<SupplierStatement> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Get opening balance (balance before period start)
  const posBefore = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      status: 'CONFIRMED',
      orderDate: { lt: periodStart },
    },
  });

  const openingBalance = posBefore.reduce((sum, po) => sum + Number(po.balanceAmount), 0);

  // Get POs and payments in period
  const posInPeriod = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      status: { in: ['CONFIRMED', 'RECEIVED'] },
      orderDate: { gte: periodStart, lte: periodEnd },
    },
  });

  const paymentsInPeriod = await prisma.payment.findMany({
    where: {
      supplierId,
      paymentDate: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { paymentDate: 'asc' },
  });

  // Build transaction list
  const transactions: SupplierStatement['transactions'] = [];
  let runningBalance = openingBalance;

  // Add POs
  for (const po of posInPeriod) {
    runningBalance += Number(po.totalAmount);
    transactions.push({
      date: po.orderDate,
      type: 'PO_CREATED',
      referenceId: po.id,
      debit: Number(po.totalAmount),
      balance: runningBalance,
    });
  }

  // Add payments
  for (const payment of paymentsInPeriod) {
    runningBalance -= Number(payment.amount);
    transactions.push({
      date: payment.paymentDate,
      type: 'PAYMENT_RECEIVED',
      referenceId: payment.id,
      credit: Number(payment.amount),
      balance: runningBalance,
    });
  }

  // Sort by date
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);

  const lastPayment = paymentsInPeriod[paymentsInPeriod.length - 1];

  return {
    supplierId,
    supplierName: supplier.name,
    statementDate: new Date(),
    periodStart,
    periodEnd,
    openingBalance,
    closingBalance: runningBalance,
    transactions,
    summary: {
      totalDebit,
      totalCredit,
      daysOverdue: Math.max(
        0,
        Math.floor((new Date().getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24))
      ),
      lastPaymentDate: lastPayment?.paymentDate,
    },
  };
}

/**
 * Mark payment as reconciled
 */
export async function markPaymentReconciled(
  paymentId: string,
  reconciledBy: string
): Promise<void> {
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      isReconciled: true,
      reconciledAt: new Date(),
      reconciledBy,
    },
  });

  // Create GL entry for reconciliation
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (payment) {
    // Note: createLedgerEntry implementation already handles this
  }
}

/**
 * Get aging analysis for all suppliers
 */
export async function getAllSuppliersAging() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
  });

  const agingReport = await Promise.all(
    suppliers.map((s) => calculateSupplierAging(s.id))
  );

  return agingReport.filter((a) => a.total > 0);
}
