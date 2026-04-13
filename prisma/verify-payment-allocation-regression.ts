import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type VerificationIssue = {
  scope: string;
  id: string;
  message: string;
};

type VerificationSummary = {
  salesOrdersChecked: number;
  purchaseOrdersChecked: number;
  customerPaymentsChecked: number;
  supplierPaymentsChecked: number;
  customersChecked: number;
  suppliersChecked: number;
  issues: VerificationIssue[];
};

const ZERO = new Prisma.Decimal(0);

function equalsDecimal(
  left: Prisma.Decimal | number | string | null | undefined,
  right: Prisma.Decimal | number | string | null | undefined
) {
  const leftDecimal = left instanceof Prisma.Decimal ? left : new Prisma.Decimal(left ?? 0);
  const rightDecimal = right instanceof Prisma.Decimal ? right : new Prisma.Decimal(right ?? 0);
  return leftDecimal.equals(rightDecimal);
}

function getSalesOrderExpectedState(totalAmount: Prisma.Decimal, paidAmount: Prisma.Decimal) {
  const normalizedPaid = paidAmount.lessThan(0) ? ZERO : paidAmount;
  const balanceAmount = totalAmount.minus(normalizedPaid);
  const normalizedBalance = balanceAmount.lessThan(0) ? ZERO : balanceAmount;
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

  return { paidAmount: normalizedPaid, balanceAmount: normalizedBalance, paymentStatus, status };
}

function getPurchaseOrderExpectedState(totalAmount: Prisma.Decimal, paidAmount: Prisma.Decimal) {
  const normalizedPaid = paidAmount.lessThan(0) ? ZERO : paidAmount;
  const balanceAmount = totalAmount.minus(normalizedPaid);
  const normalizedBalance = balanceAmount.lessThan(0) ? ZERO : balanceAmount;
  const paymentStatus =
    normalizedPaid.lessThanOrEqualTo(0)
      ? 'PENDING'
      : normalizedBalance.lessThanOrEqualTo(0)
        ? (normalizedPaid.greaterThan(totalAmount) ? 'OVERPAID' : 'FULLY_PAID')
        : 'PARTIALLY_PAID';

  return { paidAmount: normalizedPaid, balanceAmount: normalizedBalance, paymentStatus };
}

function pushIssue(summary: VerificationSummary, issue: VerificationIssue) {
  summary.issues.push(issue);
}

async function verifySalesOrders(summary: VerificationSummary) {
  const salesOrders = await prisma.salesOrder.findMany({
    include: {
      paymentAllocations: {
        include: {
          payment: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  summary.salesOrdersChecked = salesOrders.length;

  for (const salesOrder of salesOrders) {
    const allocatedAmount = salesOrder.paymentAllocations.reduce(
      (sum, allocation) => sum.plus(allocation.allocatedAmount),
      ZERO
    );
    const expectedState = getSalesOrderExpectedState(salesOrder.totalAmount, allocatedAmount);

    if (!equalsDecimal(salesOrder.paidAmount, expectedState.paidAmount)) {
      pushIssue(summary, {
        scope: 'sales_order',
        id: salesOrder.id,
        message: `paidAmount mismatch. stored=${salesOrder.paidAmount} expected=${expectedState.paidAmount}`,
      });
    }

    if (!equalsDecimal(salesOrder.balanceAmount, expectedState.balanceAmount)) {
      pushIssue(summary, {
        scope: 'sales_order',
        id: salesOrder.id,
        message: `balanceAmount mismatch. stored=${salesOrder.balanceAmount} expected=${expectedState.balanceAmount}`,
      });
    }

    if (salesOrder.paymentStatus !== expectedState.paymentStatus) {
      pushIssue(summary, {
        scope: 'sales_order',
        id: salesOrder.id,
        message: `paymentStatus mismatch. stored=${salesOrder.paymentStatus} expected=${expectedState.paymentStatus}`,
      });
    }

    if (salesOrder.status !== expectedState.status && salesOrder.status !== 'DRAFT' && salesOrder.status !== 'CANCELLED') {
      pushIssue(summary, {
        scope: 'sales_order',
        id: salesOrder.id,
        message: `status mismatch. stored=${salesOrder.status} expected=${expectedState.status}`,
      });
    }

    for (const allocation of salesOrder.paymentAllocations) {
      if (allocation.orderType !== 'SALES_ORDER') {
        pushIssue(summary, {
          scope: 'sales_order_allocation',
          id: allocation.id,
          message: `unexpected allocation type ${allocation.orderType}`,
        });
      }

      if (allocation.salesOrderId !== salesOrder.id) {
        pushIssue(summary, {
          scope: 'sales_order_allocation',
          id: allocation.id,
          message: 'allocation salesOrderId does not match parent sales order',
        });
      }

      if (allocation.payment.payerType !== 'CUSTOMER') {
        pushIssue(summary, {
          scope: 'sales_order_allocation',
          id: allocation.id,
          message: `allocation is backed by non-customer payment ${allocation.payment.payerType}`,
        });
      }

      if (allocation.payment.customerId !== salesOrder.customerId) {
        pushIssue(summary, {
          scope: 'sales_order_allocation',
          id: allocation.id,
          message: 'allocation payment customer does not match sales-order customer',
        });
      }
    }
  }
}

async function verifyPurchaseOrders(summary: VerificationSummary) {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      paymentAllocations: {
        include: {
          payment: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  summary.purchaseOrdersChecked = purchaseOrders.length;

  for (const purchaseOrder of purchaseOrders) {
    const allocatedAmount = purchaseOrder.paymentAllocations.reduce(
      (sum, allocation) => sum.plus(allocation.allocatedAmount),
      ZERO
    );
    const expectedState = getPurchaseOrderExpectedState(purchaseOrder.totalAmount, allocatedAmount);

    if (!equalsDecimal(purchaseOrder.paidAmount, expectedState.paidAmount)) {
      pushIssue(summary, {
        scope: 'purchase_order',
        id: purchaseOrder.id,
        message: `paidAmount mismatch. stored=${purchaseOrder.paidAmount} expected=${expectedState.paidAmount}`,
      });
    }

    if (!equalsDecimal(purchaseOrder.balanceAmount, expectedState.balanceAmount)) {
      pushIssue(summary, {
        scope: 'purchase_order',
        id: purchaseOrder.id,
        message: `balanceAmount mismatch. stored=${purchaseOrder.balanceAmount} expected=${expectedState.balanceAmount}`,
      });
    }

    if (purchaseOrder.paymentStatus !== expectedState.paymentStatus) {
      pushIssue(summary, {
        scope: 'purchase_order',
        id: purchaseOrder.id,
        message: `paymentStatus mismatch. stored=${purchaseOrder.paymentStatus} expected=${expectedState.paymentStatus}`,
      });
    }

    for (const allocation of purchaseOrder.paymentAllocations) {
      if (allocation.orderType !== 'PURCHASE_ORDER') {
        pushIssue(summary, {
          scope: 'purchase_order_allocation',
          id: allocation.id,
          message: `unexpected allocation type ${allocation.orderType}`,
        });
      }

      if (allocation.purchaseOrderId !== purchaseOrder.id) {
        pushIssue(summary, {
          scope: 'purchase_order_allocation',
          id: allocation.id,
          message: 'allocation purchaseOrderId does not match parent purchase order',
        });
      }

      if (allocation.payment.payerType !== 'SUPPLIER') {
        pushIssue(summary, {
          scope: 'purchase_order_allocation',
          id: allocation.id,
          message: `allocation is backed by non-supplier payment ${allocation.payment.payerType}`,
        });
      }

      if (allocation.payment.supplierId !== purchaseOrder.supplierId) {
        pushIssue(summary, {
          scope: 'purchase_order_allocation',
          id: allocation.id,
          message: 'allocation payment supplier does not match purchase-order supplier',
        });
      }
    }
  }
}

async function verifyPayments(summary: VerificationSummary) {
  const customerPayments = await prisma.payment.findMany({
    where: { payerType: 'CUSTOMER' },
    include: { allocations: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  summary.customerPaymentsChecked = customerPayments.length;

  for (const payment of customerPayments) {
    const salesAllocations = payment.allocations.filter(
      (allocation) => allocation.orderType === 'SALES_ORDER'
    );
    const allocatedAmount = salesAllocations.reduce(
      (sum, allocation) => sum.plus(allocation.allocatedAmount),
      ZERO
    );

    if (allocatedAmount.greaterThan(payment.amount)) {
      pushIssue(summary, {
        scope: 'customer_payment',
        id: payment.id,
        message: `allocated amount exceeds payment amount. allocated=${allocatedAmount} payment=${payment.amount}`,
      });
    }

    if (payment.referenceOrderId && salesAllocations.length === 0) {
      pushIssue(summary, {
        scope: 'customer_payment',
        id: payment.id,
        message: 'linked customer payment is missing sales-order allocation',
      });
    }
  }

  const supplierPayments = await prisma.payment.findMany({
    where: { payerType: 'SUPPLIER' },
    include: { allocations: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  summary.supplierPaymentsChecked = supplierPayments.length;

  for (const payment of supplierPayments) {
    const purchaseAllocations = payment.allocations.filter(
      (allocation) => allocation.orderType === 'PURCHASE_ORDER'
    );
    const allocatedAmount = purchaseAllocations.reduce(
      (sum, allocation) => sum.plus(allocation.allocatedAmount),
      ZERO
    );

    if (allocatedAmount.greaterThan(payment.amount)) {
      pushIssue(summary, {
        scope: 'supplier_payment',
        id: payment.id,
        message: `allocated amount exceeds payment amount. allocated=${allocatedAmount} payment=${payment.amount}`,
      });
    }

    if (payment.referenceOrderId && purchaseAllocations.length === 0) {
      pushIssue(summary, {
        scope: 'supplier_payment',
        id: payment.id,
        message: 'linked supplier payment is missing purchase-order allocation',
      });
    }
  }
}

async function verifyOutstandingBalances(summary: VerificationSummary) {
  const customers = await prisma.customer.findMany({
    include: {
      salesOrders: {
        select: {
          status: true,
          balanceAmount: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  summary.customersChecked = customers.length;

  for (const customer of customers) {
    const expectedOutstanding = customer.salesOrders.reduce((sum, order) => {
      if (order.status === 'CONFIRMED' || order.status === 'PARTIALLY_PAID') {
        return sum.plus(order.balanceAmount);
      }
      return sum;
    }, ZERO);

    if (!equalsDecimal(customer.outstandingBalance, expectedOutstanding)) {
      pushIssue(summary, {
        scope: 'customer',
        id: customer.id,
        message: `outstanding balance mismatch. stored=${customer.outstandingBalance} expected=${expectedOutstanding}`,
      });
    }
  }

  const suppliers = await prisma.supplier.findMany({
    include: {
      purchaseOrders: {
        select: {
          status: true,
          balanceAmount: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  summary.suppliersChecked = suppliers.length;

  for (const supplier of suppliers) {
    const expectedOutstanding = supplier.purchaseOrders.reduce((sum, order) => {
      if (order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') {
        return sum.plus(order.balanceAmount);
      }
      return sum;
    }, ZERO);

    if (!equalsDecimal(supplier.outstandingBalance, expectedOutstanding)) {
      pushIssue(summary, {
        scope: 'supplier',
        id: supplier.id,
        message: `outstanding balance mismatch. stored=${supplier.outstandingBalance} expected=${expectedOutstanding}`,
      });
    }
  }
}

async function main() {
  const summary: VerificationSummary = {
    salesOrdersChecked: 0,
    purchaseOrdersChecked: 0,
    customerPaymentsChecked: 0,
    supplierPaymentsChecked: 0,
    customersChecked: 0,
    suppliersChecked: 0,
    issues: [],
  };

  await verifySalesOrders(summary);
  await verifyPurchaseOrders(summary);
  await verifyPayments(summary);
  await verifyOutstandingBalances(summary);

  console.log('Payment allocation regression verification complete.');
  console.log(`Sales orders checked: ${summary.salesOrdersChecked}`);
  console.log(`Purchase orders checked: ${summary.purchaseOrdersChecked}`);
  console.log(`Customer payments checked: ${summary.customerPaymentsChecked}`);
  console.log(`Supplier payments checked: ${summary.supplierPaymentsChecked}`);
  console.log(`Customers checked: ${summary.customersChecked}`);
  console.log(`Suppliers checked: ${summary.suppliersChecked}`);

  if (summary.issues.length === 0) {
    console.log('No consistency issues found.');
    return;
  }

  console.error(`Found ${summary.issues.length} consistency issue(s):`);
  for (const issue of summary.issues) {
    console.error(`[${issue.scope}] ${issue.id}: ${issue.message}`);
  }
  process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
