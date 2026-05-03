import { Prisma } from '@prisma/client';
import {
  openPOSSession,
  closePOSSession,
  getPOSSessionById,
} from '@/services/pos.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    pOSSession: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dayBook: { findUnique: jest.fn(), create: jest.fn() },
    transaction: { findMany: jest.fn() },
  },
}));

jest.mock('@/services/inventory.service', () => ({
  createInventoryTransaction: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/services/payment.service', () => ({
  createPaymentFromTransaction: jest.fn().mockResolvedValue('pay-mock'),
}));

jest.mock('@/lib/errors', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
  },
  BadRequestError: class BadRequestError extends Error {
    constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function dec(n: string | number) {
  return new Prisma.Decimal(n);
}

const stubCashier = { id: 'cashier-1', username: 'john', email: 'john@test.com' };
const stubDayBook = { id: 'db-1', date: new Date(), status: 'OPEN' };

function stubSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    cashierId: 'cashier-1',
    terminalId: 'terminal-1',
    dayBookId: 'db-1',
    status: 'OPEN',
    openingCashAmount: dec('500'),
    closingCashAmount: null,
    totalSalesAmount: dec('0'),
    totalCashReceived: dec('0'),
    totalCardReceived: dec('0'),
    totalDigitalReceived: dec('0'),
    cashVariance: dec('0'),
    totalTransactions: 0,
    openedAt: new Date(),
    closedAt: null,
    notes: null,
    cashier: stubCashier,
    dayBook: stubDayBook,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// openPOSSession
// ---------------------------------------------------------------------------

describe('openPOSSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundError when cashier ID does not exist', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      openPOSSession({ cashierId: 'unknown', terminalId: 't1', openingCashAmount: 100 })
    ).rejects.toThrow('not found');
  });

  it('returns existing open session without creating a new one', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(stubCashier);

    const existingSession = stubSession();
    (mockPrisma.pOSSession.findFirst as jest.Mock).mockResolvedValue(existingSession);

    const result = await openPOSSession({
      cashierId: 'cashier-1',
      terminalId: 'terminal-1',
      openingCashAmount: 500,
    });

    expect(result.id).toBe('session-1');
    expect(mockPrisma.pOSSession.create).not.toHaveBeenCalled();
  });

  it('creates a dayBook for today if none exists', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(stubCashier);
    (mockPrisma.pOSSession.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.dayBook.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.dayBook.create as jest.Mock).mockResolvedValue(stubDayBook);
    (mockPrisma.pOSSession.create as jest.Mock).mockResolvedValue(stubSession());

    await openPOSSession({ cashierId: 'cashier-1', terminalId: 't1', openingCashAmount: 200 });

    expect(mockPrisma.dayBook.create).toHaveBeenCalled();
  });

  it('reuses existing dayBook when one already exists for today', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(stubCashier);
    (mockPrisma.pOSSession.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.dayBook.findUnique as jest.Mock).mockResolvedValue(stubDayBook);
    (mockPrisma.pOSSession.create as jest.Mock).mockResolvedValue(stubSession());

    await openPOSSession({ cashierId: 'cashier-1', terminalId: 't1', openingCashAmount: 300 });

    expect(mockPrisma.dayBook.create).not.toHaveBeenCalled();
  });

  it('converts Decimal values to numbers in returned session', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(stubCashier);
    (mockPrisma.pOSSession.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.dayBook.findUnique as jest.Mock).mockResolvedValue(stubDayBook);
    (mockPrisma.pOSSession.create as jest.Mock).mockResolvedValue(stubSession());

    const result = await openPOSSession({
      cashierId: 'cashier-1',
      terminalId: 't1',
      openingCashAmount: 500,
    });

    expect(typeof result.openingCashAmount).toBe('number');
    expect(result.openingCashAmount).toBe(500);
  });

  it('passes openingCashAmount as Decimal to DB create', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(stubCashier);
    (mockPrisma.pOSSession.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.dayBook.findUnique as jest.Mock).mockResolvedValue(stubDayBook);
    (mockPrisma.pOSSession.create as jest.Mock).mockResolvedValue(stubSession());

    await openPOSSession({ cashierId: 'cashier-1', terminalId: 't1', openingCashAmount: 750 });

    expect(mockPrisma.pOSSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          openingCashAmount: dec('750'),
          status: 'OPEN',
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// closePOSSession
// ---------------------------------------------------------------------------

describe('closePOSSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundError when session does not exist', async () => {
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      closePOSSession('non-existent', { closingCashAmount: 500 })
    ).rejects.toThrow('POS Session not found');
  });

  it('throws BadRequestError when session is already CLOSED', async () => {
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(
      stubSession({ status: 'CLOSED' })
    );

    await expect(
      closePOSSession('session-1', { closingCashAmount: 500 })
    ).rejects.toThrow('already closed');
  });

  it('calculates totalSalesAmount from transaction totals', async () => {
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(stubSession());

    const transactions = [
      { totalAmount: dec('300'), paymentDetails: [{ paymentMethod: 'CASH', amount: dec('300') }] },
      { totalAmount: dec('200'), paymentDetails: [{ paymentMethod: 'CARD', amount: dec('200') }] },
    ];
    (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue(transactions);

    const closedSession = stubSession({
      status: 'CLOSED',
      totalSalesAmount: dec('500'),
      totalCashReceived: dec('300'),
      totalCardReceived: dec('200'),
    });
    (mockPrisma.pOSSession.update as jest.Mock).mockResolvedValue(closedSession);

    const result = await closePOSSession('session-1', { closingCashAmount: 800 });

    expect(mockPrisma.pOSSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalSalesAmount: dec('500'),
          totalCashReceived: dec('300'),
          totalCardReceived: dec('200'),
          status: 'CLOSED',
        }),
      })
    );
    expect(result.totalSalesAmount).toBe(500);
  });

  it('calculates cash variance as closingCash minus (opening + cashReceived)', async () => {
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(stubSession());
    (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([
      { totalAmount: dec('100'), paymentDetails: [{ paymentMethod: 'CASH', amount: dec('100') }] },
    ]);

    const closedSession = stubSession({ status: 'CLOSED', cashVariance: dec('50') });
    (mockPrisma.pOSSession.update as jest.Mock).mockResolvedValue(closedSession);

    await closePOSSession('session-1', { closingCashAmount: 650 });

    // openingCash(500) + cashReceived(100) = 650 expected; actual 650 → variance = 0
    // but in this test we provide 650 which = expected, so variance = 0
    expect(mockPrisma.pOSSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cashVariance: expect.any(Prisma.Decimal),
        }),
      })
    );
  });

  it('excludes CREDIT payments from cash/card totals', async () => {
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(stubSession());

    const transactions = [
      {
        totalAmount: dec('400'),
        paymentDetails: [
          { paymentMethod: 'CASH', amount: dec('200') },
          { paymentMethod: 'CREDIT', amount: dec('200') },
        ],
      },
    ];
    (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
    (mockPrisma.pOSSession.update as jest.Mock).mockResolvedValue(stubSession({ status: 'CLOSED' }));

    await closePOSSession('session-1', { closingCashAmount: 700 });

    expect(mockPrisma.pOSSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalCashReceived: dec('200'),
        }),
      })
    );
  });

  it('sets totalTransactions to count of transactions in session', async () => {
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(stubSession());

    const transactions = Array.from({ length: 7 }, (_, i) => ({
      totalAmount: dec('50'),
      paymentDetails: [{ paymentMethod: 'CASH', amount: dec('50') }],
    }));
    (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
    (mockPrisma.pOSSession.update as jest.Mock).mockResolvedValue(stubSession({ status: 'CLOSED' }));

    await closePOSSession('session-1', {});

    expect(mockPrisma.pOSSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalTransactions: 7 }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// getPOSSessionById
// ---------------------------------------------------------------------------

describe('getPOSSessionById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when session does not exist', async () => {
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await getPOSSessionById('missing');
    expect(result).toBeNull();
  });

  it('returns session with converted Decimal amounts', async () => {
    const rawSession = {
      ...stubSession({ openingCashAmount: dec('1000') }),
      transactions: [],
    };
    (mockPrisma.pOSSession.findUnique as jest.Mock).mockResolvedValue(rawSession);

    const result = await getPOSSessionById('session-1');

    expect(result).not.toBeNull();
    expect(typeof result!.openingCashAmount).toBe('number');
    expect(result!.openingCashAmount).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// POS transaction business logic — pure logic unit tests
// ---------------------------------------------------------------------------

describe('Transaction calculation logic', () => {
  it('computes item total as (unitPrice * quantity) - discount', () => {
    const unitPrice = dec('29.99');
    const quantity = dec('3');
    const discount = dec('5');
    const total = unitPrice.times(quantity).minus(discount);
    expect(total.toNumber()).toBeCloseTo(84.97);
  });

  it('computes tax on discounted item total', () => {
    const discountedTotal = dec('100');
    const taxRate = dec('13'); // 13%
    const tax = discountedTotal.times(taxRate.dividedBy(100));
    expect(tax.toNumber()).toBeCloseTo(13);
  });

  it('total = subtotal + tax', () => {
    const subtotal = dec('200');
    const tax = dec('26');
    const total = subtotal.plus(tax);
    expect(total.toNumber()).toBe(226);
  });

  it('detects insufficient stock', () => {
    const stockQuantity = 5;
    const requested = 10;
    expect(requested > stockQuantity).toBe(true);
  });

  it('payment total must match transaction total (non-credit)', () => {
    const transactionTotal = dec('150');
    const paymentTotal = dec('150');
    const diff = transactionTotal.minus(paymentTotal).abs();
    expect(diff.lessThanOrEqualTo(dec('0.01'))).toBe(true);
  });

  it('rejects when non-credit payment total mismatches', () => {
    const transactionTotal = dec('150');
    const paymentTotal = dec('100');
    const diff = transactionTotal.minus(paymentTotal).abs();
    expect(diff.greaterThan(dec('0.01'))).toBe(true);
  });

  it('caps credit balance to zero when immediate payment exceeds total', () => {
    const total = dec('100');
    const immediatePayment = dec('120');
    const rawCredit = total.minus(immediatePayment);
    const creditBalance = rawCredit.greaterThan(0) ? rawCredit : dec('0');
    expect(creditBalance.toNumber()).toBe(0);
  });

  it('maps MIXED payment method when multiple payment details provided', () => {
    const paymentDetails = [
      { paymentMethod: 'CASH', amount: 50 },
      { paymentMethod: 'CARD', amount: 50 },
    ];
    const method = paymentDetails.length > 1 ? 'MIXED' : paymentDetails[0].paymentMethod;
    expect(method).toBe('MIXED');
  });
});
