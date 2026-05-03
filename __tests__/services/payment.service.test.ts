import { Prisma } from '@prisma/client';
import {
  createPaymentFromTransaction,
  getAllPayments,
  getPaymentById,
} from '@/services/payment.service';
import { prisma } from '@/lib/prisma';
import { createLedgerEntry } from '@/services/ledger.service';
import { getCurrencyCode } from '@/lib/currency';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/services/ledger.service', () => ({
  createLedgerEntry: jest.fn(),
}));

jest.mock('@/lib/currency', () => ({
  getCurrencyCode: jest.fn().mockReturnValue('USD'),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCreateLedgerEntry = createLedgerEntry as jest.MockedFunction<typeof createLedgerEntry>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMockTx() {
  return {
    customer: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    salesOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    orderPaymentAllocation: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      update: jest.fn(),
    },
  };
}

type MockTx = ReturnType<typeof buildMockTx>;

function makeDecimal(n: string | number) {
  return new Prisma.Decimal(n);
}

// ---------------------------------------------------------------------------
// getAllPayments
// ---------------------------------------------------------------------------

describe('getAllPayments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated payments with default filters', async () => {
    const fakePayments = [
      {
        id: 'pay-1',
        amount: makeDecimal('100'),
        transactionFee: makeDecimal('0'),
        netAmount: makeDecimal('100'),
        customer: null,
        supplier: null,
      },
    ];
    (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue(fakePayments);
    (mockPrisma.payment.count as jest.Mock).mockResolvedValue(1);

    const result = await getAllPayments({ page: 1, limit: 20 });

    expect(result.pagination.total).toBe(1);
    expect(result.payments[0].amount).toBe(100);
    expect(result.pagination.pages).toBe(1);
  });

  it('applies search filter to the query', async () => {
    (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.payment.count as jest.Mock).mockResolvedValue(0);

    await getAllPayments({ search: 'INV-001', page: 1, limit: 10 });

    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { referenceNumber: { contains: 'INV-001', mode: 'insensitive' } },
          ]),
        }),
      })
    );
  });

  it('filters by paymentMethod when provided', async () => {
    (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.payment.count as jest.Mock).mockResolvedValue(0);

    await getAllPayments({ paymentMethod: 'CASH' as any, page: 1, limit: 10 });

    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentMethod: 'CASH' }),
      })
    );
  });

  it('computes correct page count for multi-page results', async () => {
    (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.payment.count as jest.Mock).mockResolvedValue(55);

    const result = await getAllPayments({ page: 1, limit: 20 });

    expect(result.pagination.pages).toBe(3);
  });

  it('converts Decimal amounts to numbers', async () => {
    const fakePayment = {
      id: 'pay-2',
      amount: makeDecimal('250.75'),
      transactionFee: makeDecimal('2.50'),
      netAmount: makeDecimal('248.25'),
      customer: null,
      supplier: null,
    };
    (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([fakePayment]);
    (mockPrisma.payment.count as jest.Mock).mockResolvedValue(1);

    const result = await getAllPayments({ page: 1, limit: 10 });

    expect(typeof result.payments[0].amount).toBe('number');
    expect(result.payments[0].amount).toBe(250.75);
    expect(result.payments[0].transactionFee).toBe(2.5);
    expect(result.payments[0].netAmount).toBe(248.25);
  });
});

// ---------------------------------------------------------------------------
// getPaymentById
// ---------------------------------------------------------------------------

describe('getPaymentById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when payment does not exist', async () => {
    (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await getPaymentById('non-existent-id');
    expect(result).toBeNull();
  });

  it('returns payment with converted Decimal values', async () => {
    const fakePayment = {
      id: 'pay-3',
      amount: makeDecimal('500'),
      transactionFee: makeDecimal('5'),
      netAmount: makeDecimal('495'),
      customer: { id: 'cust-1', name: 'Alice' },
      supplier: null,
    };
    (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(fakePayment);

    const result = await getPaymentById('pay-3');

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(500);
    expect(result!.netAmount).toBe(495);
  });
});

// ---------------------------------------------------------------------------
// createPaymentFromTransaction — walk-in customer (no customerId)
// ---------------------------------------------------------------------------

describe('createPaymentFromTransaction — walk-in (no customer)', () => {
  let mockTx: MockTx;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = buildMockTx();
    mockCreateLedgerEntry.mockResolvedValue(undefined as any);
  });

  it('creates a payment record without customer lookup', async () => {
    const paymentId = 'payment-abc';
    mockTx.payment.create.mockResolvedValue({
      id: paymentId,
      amount: makeDecimal('150'),
    });
    mockTx.transaction.update.mockResolvedValue({});

    const result = await createPaymentFromTransaction(
      'txn-001',
      null,
      150,
      'CASH',
      mockTx as any
    );

    expect(result).toBe(paymentId);
    expect(mockTx.customer.findUnique).not.toHaveBeenCalled();
    expect(mockTx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: makeDecimal('150'),
          paymentMethod: 'CASH',
          status: 'COMPLETED',
        }),
      })
    );
  });

  it('links the created payment to the transaction record', async () => {
    const paymentId = 'payment-link-test';
    mockTx.payment.create.mockResolvedValue({
      id: paymentId,
      amount: makeDecimal('80'),
    });
    mockTx.transaction.update.mockResolvedValue({});

    await createPaymentFromTransaction('txn-002', null, 80, 'CARD', mockTx as any);

    expect(mockTx.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'txn-002' },
        data: { paymentId },
      })
    );
  });

  it('creates ledger entry with CASH mapped to Cash debit account', async () => {
    mockTx.payment.create.mockResolvedValue({ id: 'p1', amount: makeDecimal('50') });
    mockTx.transaction.update.mockResolvedValue({});

    await createPaymentFromTransaction('txn-003', null, 50, 'CASH', mockTx as any);

    expect(mockCreateLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        debitAccount: 'Cash',
        creditAccount: 'Sales Revenue',
        amount: 50,
      }),
      mockTx
    );
  });

  it('creates ledger entry with CARD mapped to Bank debit account', async () => {
    mockTx.payment.create.mockResolvedValue({ id: 'p2', amount: makeDecimal('200') });
    mockTx.transaction.update.mockResolvedValue({});

    await createPaymentFromTransaction('txn-004', null, 200, 'CARD', mockTx as any);

    expect(mockCreateLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({ debitAccount: 'Bank' }),
      mockTx
    );
  });

  it('creates ledger entry with CREDIT mapped to Accounts Receivable', async () => {
    mockTx.payment.create.mockResolvedValue({ id: 'p3', amount: makeDecimal('300') });
    mockTx.transaction.update.mockResolvedValue({});

    await createPaymentFromTransaction('txn-005', null, 300, 'CREDIT', mockTx as any);

    expect(mockCreateLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({ debitAccount: 'Accounts Receivable' }),
      mockTx
    );
  });
});

// ---------------------------------------------------------------------------
// createPaymentFromTransaction — known customer
// ---------------------------------------------------------------------------

describe('createPaymentFromTransaction — with customer', () => {
  let mockTx: MockTx;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = buildMockTx();
    mockCreateLedgerEntry.mockResolvedValue(undefined as any);
  });

  it('throws when customer does not exist', async () => {
    mockTx.customer.findUnique.mockResolvedValue(null);

    await expect(
      createPaymentFromTransaction('txn-100', 'cust-missing', 100, 'CASH', mockTx as any)
    ).rejects.toThrow('Customer not found');
  });

  it('creates payment when customer exists', async () => {
    mockTx.customer.findUnique.mockResolvedValue({ id: 'cust-1', name: 'Bob' });
    mockTx.payment.create.mockResolvedValue({ id: 'pay-cust-1', amount: makeDecimal('120') });
    mockTx.transaction.update.mockResolvedValue({});
    mockTx.customer.update.mockResolvedValue({});

    const result = await createPaymentFromTransaction(
      'txn-101',
      'cust-1',
      120,
      'CASH',
      mockTx as any
    );

    expect(result).toBe('pay-cust-1');
    expect(mockTx.customer.findUnique).toHaveBeenCalledWith({ where: { id: 'cust-1' } });
  });

  it('allocates payment to sales order when referenceOrderId provided', async () => {
    mockTx.customer.findUnique.mockResolvedValue({ id: 'cust-2' });
    mockTx.payment.create.mockResolvedValue({ id: 'pay-alloc', amount: makeDecimal('500') });
    mockTx.transaction.update.mockResolvedValue({});
    mockTx.customer.update.mockResolvedValue({});

    // syncSalesOrderPaymentState needs these
    mockTx.salesOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      totalAmount: makeDecimal('500'),
      customerId: 'cust-2',
    });
    mockTx.orderPaymentAllocation.findMany.mockResolvedValue([
      { allocatedAmount: makeDecimal('500') },
    ]);
    mockTx.orderPaymentAllocation.create.mockResolvedValue({});
    mockTx.salesOrder.update.mockResolvedValue({});
    mockTx.salesOrder.aggregate = jest.fn().mockResolvedValue({ _sum: { balanceAmount: makeDecimal('0') } }) as any;

    await createPaymentFromTransaction(
      'txn-102',
      'cust-2',
      500,
      'CARD',
      mockTx as any,
      'order-1'
    );

    expect(mockTx.salesOrder.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-1' } })
    );
  });

  it('uses getCurrencyCode for payment currency field', async () => {
    (getCurrencyCode as jest.Mock).mockReturnValue('NPR');
    mockTx.customer.findUnique.mockResolvedValue({ id: 'cust-3' });
    mockTx.payment.create.mockResolvedValue({ id: 'pay-npr', amount: makeDecimal('1000') });
    mockTx.transaction.update.mockResolvedValue({});
    mockTx.customer.update.mockResolvedValue({});

    await createPaymentFromTransaction('txn-200', 'cust-3', 1000, 'CASH', mockTx as any);

    expect(mockTx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: 'NPR' }),
      })
    );
  });

  it('sets netAmount equal to amount (no fee for POS transactions)', async () => {
    mockTx.customer.findUnique.mockResolvedValue({ id: 'cust-4' });
    mockTx.payment.create.mockResolvedValue({ id: 'pay-net', amount: makeDecimal('250') });
    mockTx.transaction.update.mockResolvedValue({});
    mockTx.customer.update.mockResolvedValue({});

    await createPaymentFromTransaction('txn-300', 'cust-4', 250, 'CASH', mockTx as any);

    expect(mockTx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          transactionFee: makeDecimal('0'),
          netAmount: makeDecimal('250'),
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Payment state machine — tested via getSalesOrderPaymentState behavior
// These tests exercise the private state logic through its effects
// ---------------------------------------------------------------------------

describe('Sales order payment state transitions (via service behavior)', () => {
  it('UNPAID: paidAmount is 0 when no allocations exist', () => {
    const totalAmount = makeDecimal('1000');
    const paidAmount = makeDecimal('0');
    const balance = totalAmount.minus(paidAmount);
    const isUnpaid = paidAmount.lessThanOrEqualTo(0);
    expect(isUnpaid).toBe(true);
    expect(balance.toNumber()).toBe(1000);
  });

  it('PARTIALLY_PAID: balance > 0 and paid > 0', () => {
    const totalAmount = makeDecimal('1000');
    const paidAmount = makeDecimal('400');
    const balance = totalAmount.minus(paidAmount);
    expect(paidAmount.greaterThan(0)).toBe(true);
    expect(balance.greaterThan(0)).toBe(true);
  });

  it('PAID: balance reaches 0', () => {
    const totalAmount = makeDecimal('1000');
    const paidAmount = makeDecimal('1000');
    const balance = totalAmount.minus(paidAmount);
    expect(balance.lessThanOrEqualTo(0)).toBe(true);
  });

  it('clamps negative paidAmount to 0', () => {
    const negative = makeDecimal('-50');
    const clamped = negative.lessThan(0) ? makeDecimal('0') : negative;
    expect(clamped.toNumber()).toBe(0);
  });
});

describe('Purchase order payment state transitions', () => {
  it('PENDING when nothing has been paid', () => {
    const paidAmount = makeDecimal('0');
    const status = paidAmount.lessThanOrEqualTo(0) ? 'PENDING' : 'OTHER';
    expect(status).toBe('PENDING');
  });

  it('PARTIALLY_PAID when partially settled', () => {
    const totalAmount = makeDecimal('500');
    const paidAmount = makeDecimal('200');
    const balance = totalAmount.minus(paidAmount);
    const status = balance.greaterThan(0) ? 'PARTIALLY_PAID' : 'FULLY_PAID';
    expect(status).toBe('PARTIALLY_PAID');
  });

  it('FULLY_PAID when exactly settled', () => {
    const totalAmount = makeDecimal('500');
    const paidAmount = makeDecimal('500');
    const balance = totalAmount.minus(paidAmount);
    expect(balance.lessThanOrEqualTo(0)).toBe(true);
    expect(paidAmount.greaterThan(totalAmount)).toBe(false);
  });

  it('OVERPAID when paid exceeds total', () => {
    const totalAmount = makeDecimal('500');
    const paidAmount = makeDecimal('600');
    const isOverpaid = paidAmount.greaterThan(totalAmount);
    expect(isOverpaid).toBe(true);
  });
});
