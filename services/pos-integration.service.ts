/**
 * POS Integration Service
 * 
 * Coordinates atomic transactions across multiple modules:
 * - POS: Transaction creation and session management
 * - Inventory: Stock deduction and transaction tracking
 * - Accounting: Ledger entry creation for revenue recognition
 * - Customer: Loyalty points management and balance updates
 * - Payment: Payment detail creation and reconciliation
 * 
 * ARCHITECTURE DECISIONS:
 * =====================
 * 
 * 1. ATOMIC TRANSACTIONS
 *    - All operations wrapped in prisma.$transaction()
 *    - Single rollback point for entire POS flow
 *    - If any step fails, entire transaction rolls back
 * 
 * 2. LOOSE COUPLING
 *    - Services call only their core functions
 *    - No circular dependencies
 *    - Event-like pattern via shared transaction context
 *    - Each service maintains single responsibility
 * 
 * 3. ERROR HANDLING
 *    - Validation at entry point
 *    - Specific error messages for debugging
 *    - Transaction context prevents partial commits
 *    - Automatic rollback on any error
 * 
 * 4. DATA FLOW
 *    - POS receives order
 *    - Validates inventory availability
 *    - Deducts inventory
 *    - Creates ledger entries (revenue + inventory cost)
 *    - Updates customer loyalty + balance
 *    - Records payment details
 *    - Updates session totals
 * 
 * 5. PAYMENT INTEGRATION
 *    - Supports multiple payment methods
 *    - Split payments (mix of CASH + CARD + UPI, etc.)
 *    - Payment reconciliation tracking
 *    - Transaction fee deduction
 * 
 * 6. TESTABILITY
 *    - Each service can be tested independently
 *    - Integration tests can mock service layers
 *    - Atomic transactions ensure data consistency
 *    - Clear input/output contracts
 */

import { prisma } from '@/lib/prisma';
import { PaymentMethod } from '@/types/payment.types';
import { CreateTransactionInput } from '@/types/pos.types';
import { Prisma } from '@prisma/client';
import { createPaymentFromTransaction } from './payment.service';

// ============================================================================
// Type Definitions
// ============================================================================

export interface POSIntegrationInput extends CreateTransactionInput {
  // Extended fields for full integration
  loyaltyPointsRate?: number; // Points per rupee spent (default: 1)
  costPriceForInventory?: boolean; // Use cost price for COGS (default: true)
}

export interface POSIntegrationResult {
  transactionId: string;
  transactionNumber: string;
  totalAmount: number;
  totalTax: number;
  totalDiscount: number;
  pointsEarned: number;
  paymentMethods: PaymentMethod[];
  inventoryEntriesCreated: number;
  ledgerEntriesCreated: number;
  customerBalanceUpdated: boolean;
}

export interface TransactionStep {
  name: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function convertToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (value instanceof Prisma.Decimal) return value.toNumber();
  return typeof value === 'number' ? value : parseFloat(value);
}

function toDecimal(value: any): Prisma.Decimal {
  return new Prisma.Decimal(convertToNumber(value));
}

function getSalesOrderFinancialState(
  totalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal
): {
  paidAmount: Prisma.Decimal;
  balanceAmount: Prisma.Decimal;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  status: 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID';
} {
  const normalizedPaidAmount = paidAmount.lessThan(0)
    ? toDecimal(0)
    : paidAmount.greaterThan(totalAmount)
      ? totalAmount
      : paidAmount;
  const balanceAmount = totalAmount.minus(normalizedPaidAmount);
  const paymentStatus =
    normalizedPaidAmount.lessThanOrEqualTo(0)
      ? 'UNPAID'
      : balanceAmount.lessThanOrEqualTo(0)
        ? 'PAID'
        : 'PARTIALLY_PAID';
  const status =
    paymentStatus === 'PAID'
      ? 'PAID'
      : paymentStatus === 'PARTIALLY_PAID'
        ? 'PARTIALLY_PAID'
        : 'CONFIRMED';

  return {
    paidAmount: normalizedPaidAmount,
    balanceAmount: balanceAmount.lessThan(0) ? toDecimal(0) : balanceAmount,
    paymentStatus,
    status,
  };
}

// ============================================================================
// Main Integration Function
// ============================================================================

/**
 * Complete POS transaction workflow
 * 
 * Steps:
 * 1. Validate all inputs (cashier, session, customer, products)
 * 2. Deduct inventory and create inventory transactions
 * 3. Create accounting ledger entries (revenue + COGS)
 * 4. Update customer loyalty points and balance
 * 5. Record payment details
 * 6. Create main transaction
 * 7. Update POS session totals
 * 
 * All wrapped in atomic transaction - rollback if any step fails
 */
export async function processIntegratedPOSTransaction(
  input: POSIntegrationInput
): Promise<POSIntegrationResult> {
  const {
    transactionNumber,
    cashierId,
    sessionId,
    customerId,
    items,
    paymentDetails,
    notes,
    loyaltyPointsRate = 1,
    costPriceForInventory = true,
  } = input;

  return prisma.$transaction(
    async (tx) => {
      // ========================================================================
      // STEP 1: VALIDATION
      // ========================================================================

      const cashier = await tx.user.findUnique({ where: { id: cashierId } });
      if (!cashier) throw new Error('Cashier not found');

      let session = null;
      if (sessionId) {
        session = await tx.pOSSession.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== 'OPEN') {
          throw new Error('Active POS Session not found');
        }
      }

      let customer = null;
      if (customerId) {
        customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new Error('Customer not found');
      }

      if (!items || items.length === 0) {
        throw new Error('Transaction must have at least one item');
      }

      if (!paymentDetails || paymentDetails.length === 0) {
        throw new Error('Transaction must have at least one payment method');
      }

      // ========================================================================
      // STEP 2: INVENTORY & CALCULATIONS
      // ========================================================================

      let totalAmount = toDecimal(0);
      let totalTaxAmount = toDecimal(0);
      let totalDiscountAmount = toDecimal(0);
      let totalCOGS = toDecimal(0); // Cost of Goods Sold for COGS ledger entry

      const transactionItems = await Promise.all(
        items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) throw new Error(`Product ${item.productId} not found`);
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }

          const unitPrice = toDecimal(item.unitPrice || product.price);
          const quantity = item.quantity;
          const discount = toDecimal(item.discountApplied || 0);
          const taxRate = toDecimal(product.taxRate || 0);

          // Calculate amounts
          const lineTotal = unitPrice.times(quantity).minus(discount);
          const lineTax = lineTotal.times(taxRate.dividedBy(100));
          const lineCost = costPriceForInventory
            ? toDecimal(product.costPrice || product.price).times(quantity)
            : toDecimal(0);

          totalAmount = totalAmount.plus(lineTotal);
          totalTaxAmount = totalTaxAmount.plus(lineTax);
          totalDiscountAmount = totalDiscountAmount.plus(discount);
          totalCOGS = totalCOGS.plus(lineCost);

          // DEDUCT INVENTORY
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: quantity } },
          });

          return {
            productId: product.id,
            quantity,
            unitPrice,
            totalPrice: lineTotal,
            discountApplied: discount,
            taxRate,
            taxAmount: lineTax,
            costPrice: lineCost,
          };
        })
      );

      // ========================================================================
      // STEP 3: CREATE INVENTORY TRANSACTIONS
      // ========================================================================

      for (const item of transactionItems) {
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: 'POS_SALE',
            quantity: item.quantity,
            referenceId: transactionNumber,
            notes: `POS Sale - ${transactionNumber}`,
          },
        });
      }

      // ========================================================================
      // STEP 4: ACCOUNTING - LEDGER ENTRIES
      // ========================================================================

      // Revenue Recognition: Debit Cash/Bank, Credit Revenue
      const paymentMethodsUsed = paymentDetails.map((pd) => pd.paymentMethod);
      const hasCard = paymentMethodsUsed.includes('CARD');
      const hasDigitalWallet = paymentMethodsUsed.includes('DIGITAL_WALLET');
      const debitAccount = hasCard || hasDigitalWallet ? 'Bank' : 'Cash';

      // Revenue entry
      await tx.ledgerEntry.create({
        data: {
          entryDate: new Date(),
          description: `POS Sale - ${transactionNumber}${customerId ? ` (Customer: ${customerId.substring(0, 8)})` : ''}`,
          debitAccount,
          creditAccount: 'Revenue',
          amount: totalAmount,
          referenceId: transactionNumber,
        },
      });

      // COGS entry (if cost price available)
      if (totalCOGS.gt(0)) {
        await tx.ledgerEntry.create({
          data: {
            entryDate: new Date(),
            description: `COGS - ${transactionNumber}`,
            debitAccount: 'Cost of Goods Sold',
            creditAccount: 'Inventory',
            amount: totalCOGS,
            referenceId: transactionNumber,
          },
        });
      }

      // Tax liability entry (if tax collected)
      if (totalTaxAmount.gt(0)) {
        await tx.ledgerEntry.create({
          data: {
            entryDate: new Date(),
            description: `Sales Tax - ${transactionNumber}`,
            debitAccount,
            creditAccount: 'Sales Tax Payable',
            amount: totalTaxAmount,
            referenceId: transactionNumber,
          },
        });
      }

      // Discount expense entry (if discount given)
      if (totalDiscountAmount.gt(0)) {
        await tx.ledgerEntry.create({
          data: {
            entryDate: new Date(),
            description: `Discount Expense - ${transactionNumber}`,
            debitAccount: 'Discount Expense',
            creditAccount: 'Revenue',
            amount: totalDiscountAmount,
            referenceId: transactionNumber,
          },
        });
      }

      // ========================================================================
      // STEP 5: CUSTOMER UPDATES (LOYALTY & BALANCE)
      // ========================================================================

      let pointsEarned = 0;
      const creditPortion = paymentDetails
        .filter((pd) => pd.paymentMethod === 'CREDIT')
        .reduce((sum, pd) => sum.plus(toDecimal(pd.amount)), toDecimal(0));
      const collectedAmount = totalAmount.minus(creditPortion);
      const normalizedCollectedAmount = collectedAmount.lessThan(0)
        ? toDecimal(0)
        : collectedAmount;

      if (customerId && customer) {
        // Calculate loyalty points
        pointsEarned = Math.floor(convertToNumber(totalAmount) * loyaltyPointsRate);

        if (creditPortion.gt(0)) {
          const existingOutstanding = await tx.salesOrder.aggregate({
            where: {
              customerId,
              status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
            },
            _sum: {
              balanceAmount: true,
            },
          });

          const currentOutstandingBalance =
            existingOutstanding._sum.balanceAmount ?? toDecimal(0);
          const nextOutstandingBalance =
            currentOutstandingBalance.plus(creditPortion);

          if (nextOutstandingBalance.greaterThan(customer.creditLimit)) {
            throw new Error('Credit limit exceeded');
          }
        }

        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: pointsEarned },
          },
        });
      }

      // ========================================================================
      // STEP 6: CREATE PAYMENT DETAILS
      // ========================================================================

      const paymentDetailsData = await Promise.all(
        paymentDetails.map(async (pd, index) => {
          const amount = toDecimal(pd.amount);
          const transactionFee = toDecimal(pd.transactionFee || 0);
          const netAmount = amount.minus(transactionFee);

          // Create payment detail record
          const paymentDetail = await tx.pOSPaymentDetail.create({
            data: {
              transactionId: '', // Will be set after transaction creation
              paymentMethod: pd.paymentMethod,
              amount,
              referenceNumber: pd.referenceNumber,
              status: 'COMPLETED',
              notes: pd.notes,
              sequenceNumber: index + 1,
              transactionFee,
              netAmount,
              cardLast4: pd.cardLast4,
              cardBrand: pd.cardBrand,
              authorizationId: pd.authorizationId,
              walletProvider: pd.walletProvider,
              upiId: pd.upiId,
              chequeNumber: pd.chequeNumber,
              chequeDate: pd.chequeDate,
              chequeBank: pd.chequeBank,
            },
          });

          return paymentDetail;
        })
      );

      // ========================================================================
      // STEP 7: CREATE MAIN TRANSACTION
      // ========================================================================

      const mainPaymentMethod =
        paymentDetails.length > 1 ? 'MIXED' : paymentDetails[0].paymentMethod;

      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          cashierId,
          sessionId,
          customerId,
          totalAmount,
          taxAmount: totalTaxAmount,
          discountAmount: totalDiscountAmount,
          paymentMethod: mainPaymentMethod,
          status: 'COMPLETED',
          notes,
          items: {
            create: transactionItems.map((ti) => ({
              productId: ti.productId,
              quantity: ti.quantity,
              unitPrice: ti.unitPrice,
              totalPrice: ti.totalPrice,
              discountApplied: ti.discountApplied,
              taxRate: ti.taxRate,
              taxAmount: ti.taxAmount,
            })),
          },
          paymentDetails: {
            create: paymentDetailsData.map((pd) => ({
              paymentMethod: pd.paymentMethod,
              amount: pd.amount,
              referenceNumber: pd.referenceNumber,
              status: pd.status,
              notes: pd.notes,
              sequenceNumber: pd.sequenceNumber,
              transactionFee: pd.transactionFee,
              netAmount: pd.netAmount,
              cardLast4: pd.cardLast4,
              cardBrand: pd.cardBrand,
              authorizationId: pd.authorizationId,
              walletProvider: pd.walletProvider,
              upiId: pd.upiId,
              chequeNumber: pd.chequeNumber,
              chequeDate: pd.chequeDate,
              chequeBank: pd.chequeBank,
            })),
          },
        },
      });

      if (customerId) {
        const salesOrder = await tx.salesOrder.create({
          data: {
            customerId,
            orderDate: transaction.createdAt,
            totalAmount,
            ...getSalesOrderFinancialState(totalAmount, normalizedCollectedAmount),
            items: {
              create: transactionItems.map((ti) => ({
                productId: ti.productId,
                quantity: ti.quantity,
                unitPrice: ti.unitPrice,
                subtotal: ti.totalPrice,
                taxAmount: ti.taxAmount,
                discount: ti.discountApplied,
              })),
            },
          },
        });

        const immediatePaymentDetails = paymentDetails.filter(
          (pd) => pd.paymentMethod !== 'CREDIT' && toDecimal(pd.amount).gt(0)
        );

        if (immediatePaymentDetails.length > 0) {
          await Promise.all(
            immediatePaymentDetails.map((pd) =>
              createPaymentFromTransaction(
                transaction.id,
                customerId,
                Number(pd.amount),
                pd.paymentMethod,
                tx,
                salesOrder.id,
                transaction.createdAt,
                pd.referenceNumber,
                pd.notes ?? `Captured during integrated POS sale ${transaction.transactionNumber}`
              )
            )
          );
        }
      }

      // ========================================================================
      // STEP 8: UPDATE POS SESSION TOTALS
      // ========================================================================

      if (sessionId) {
        // Calculate totals by payment method
        const cashTotal = paymentDetails
          .filter((pd) => pd.paymentMethod === 'CASH')
          .reduce((sum, pd) => sum + pd.amount, 0);

        const cardTotal = paymentDetails
          .filter((pd) => pd.paymentMethod === 'CARD')
          .reduce((sum, pd) => sum + pd.amount, 0);

        const otherTotal = paymentDetails
          .filter(
            (pd) =>
              pd.paymentMethod !== 'CASH' && pd.paymentMethod !== 'CARD'
          )
          .reduce((sum, pd) => sum + pd.amount, 0);

        await tx.pOSSession.update({
          where: { id: sessionId },
          data: {
            totalSalesAmount: { increment: totalAmount },
            totalTransactions: { increment: 1 },
            totalCashReceived: { increment: toDecimal(cashTotal) },
            totalCardReceived: { increment: toDecimal(cardTotal) },
            totalDigitalReceived: { increment: toDecimal(otherTotal) },
          },
        });
      }

      // ========================================================================
      // RETURN RESULT
      // ========================================================================

      return {
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        totalAmount: convertToNumber(totalAmount),
        totalTax: convertToNumber(totalTaxAmount),
        totalDiscount: convertToNumber(totalDiscountAmount),
        pointsEarned,
        paymentMethods: paymentDetails.map((pd) => pd.paymentMethod),
        inventoryEntriesCreated: items.length,
        ledgerEntriesCreated: 3 + (totalCOGS.gt(0) ? 1 : 0) + (totalDiscountAmount.gt(0) ? 1 : 0),
        customerBalanceUpdated: !!customerId && creditPortion.gt(0),
      };
    },
    {
      // Transaction options
      maxWait: 10000, // 10 seconds
      timeout: 30000, // 30 seconds
    }
  );
}

// ============================================================================
// Helper: Validate Transaction Input
// ============================================================================

export function validatePOSIntegrationInput(input: POSIntegrationInput): string[] {
  const errors: string[] = [];

  if (!input.transactionNumber?.trim())
    errors.push('Transaction number is required');
  if (!input.cashierId?.trim()) errors.push('Cashier ID is required');
  if (!input.items?.length) errors.push('Items array is required');
  if (!input.paymentDetails?.length)
    errors.push('Payment details are required');

  const hasCreditPayment = input.paymentDetails?.some(
    (pd) => pd.paymentMethod === 'CREDIT' && pd.amount > 0
  );
  if (hasCreditPayment && !input.customerId) {
    errors.push('Customer is required for credit POS transactions');
  }

  // Validate payment total matches transaction total
  const paymentTotal = input.paymentDetails.reduce(
    (sum, pd) => sum + pd.amount,
    0
  );
  const itemTotal = input.items.reduce((sum, item) => {
    const price = (item.unitPrice || 0) * item.quantity;
    return sum + price - (item.discountApplied || 0);
  }, 0);

  if (Math.abs(paymentTotal - itemTotal) > 0.01) {
    errors.push(
      `Payment total (${paymentTotal}) does not match items total (${itemTotal})`
    );
  }

  return errors;
}

// ============================================================================
// Helper: Calculate Transaction Analytics
// ============================================================================

export async function getTransactionAnalytics(
  sessionId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Prisma.TransactionWhereInput = {
    status: 'COMPLETED',
  };

  if (sessionId) where.sessionId = sessionId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { paymentDetails: true },
  });

  const stats = {
    totalTransactions: transactions.length,
    totalRevenue: convertToNumber(
      transactions.reduce((sum, t) => sum + convertToNumber(t.totalAmount), 0)
    ),
    totalTax: convertToNumber(
      transactions.reduce((sum, t) => sum + convertToNumber(t.taxAmount), 0)
    ),
    totalDiscount: convertToNumber(
      transactions.reduce(
        (sum, t) => sum + convertToNumber(t.discountAmount),
        0
      )
    ),
    paymentBreakdown: {} as Record<string, number>,
    averageOrderValue: 0,
  };

  // Payment breakdown
  transactions.forEach((t) => {
    t.paymentDetails.forEach((pd) => {
      if (!stats.paymentBreakdown[pd.paymentMethod]) {
        stats.paymentBreakdown[pd.paymentMethod] = 0;
      }
      stats.paymentBreakdown[pd.paymentMethod] += convertToNumber(pd.amount);
    });
  });

  stats.averageOrderValue =
    stats.totalTransactions > 0 ? stats.totalRevenue / stats.totalTransactions : 0;

  return stats;
}
