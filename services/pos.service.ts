import { prisma } from '@/lib/prisma';
import {
    CreatePOSSessionInput,
    CreateTransactionInput,
    PaginatedPOSSessions,
    PaginatedTransactions,
    POSSession,
    Transaction,
    UpdatePOSSessionInput
} from '@/types/pos.types';
import { Prisma } from '@prisma/client';
import { createInventoryTransaction } from './inventory.service';
import { createPaymentFromTransaction } from './payment.service';
import { BadRequestError, NotFoundError } from '@/lib/errors';

function convertToNumber(value: any): any {
    if (value === null || value === undefined) return value;
    if (value instanceof Prisma.Decimal) {
        return value.toNumber();
    }
    return value;
}

// POS Sessions
export async function openPOSSession(data: CreatePOSSessionInput): Promise<POSSession> {
    const { cashierId, terminalId, openingCashAmount, notes } = data;

    const cashier = await prisma.user.findUnique({ where: { id: cashierId } });
    if (!cashier) {
        // Try to find by username as fallback
        const userByUsername = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: cashierId },
                    { email: cashierId }
                ]
            }
        });
        if (!userByUsername) {
            throw new NotFoundError(`Cashier with ID "${cashierId}" not found in the system`);
        }
        // Use the found user's ID
        return openPOSSession({ ...data, cashierId: userByUsername.id });
    }

    const session = await prisma.pOSSession.create({
        data: {
            cashierId,
            terminalId,
            openingCashAmount: new Prisma.Decimal(openingCashAmount),
            notes,
            status: 'OPEN',
        },
        include: { cashier: true },
    });
    return {
        ...session,
        openingCashAmount: convertToNumber(session.openingCashAmount),
        closingCashAmount: convertToNumber(session.closingCashAmount),
        totalSalesAmount: convertToNumber(session.totalSalesAmount),
        totalCashReceived: convertToNumber(session.totalCashReceived),
        totalCardReceived: convertToNumber(session.totalCardReceived),
        totalDigitalReceived: convertToNumber(session.totalDigitalReceived),
        cashVariance: convertToNumber(session.cashVariance),
    };
}

export async function closePOSSession(sessionId: string, data: UpdatePOSSessionInput): Promise<POSSession> {
    const { closingCashAmount, notes } = data;

    const existingSession = await prisma.pOSSession.findUnique({ where: { id: sessionId } });
    if (!existingSession) throw new NotFoundError('POS Session not found');
    if (existingSession.status === 'CLOSED') throw new BadRequestError('POS Session is already closed');

    // Calculate totals and variance
    const transactionsInSession = await prisma.transaction.findMany({
        where: { sessionId },
        include: { paymentDetails: true },
    });

    let totalSalesAmount = new Prisma.Decimal(0);
    let totalCashReceived = new Prisma.Decimal(0);
    let totalCardReceived = new Prisma.Decimal(0);
    let totalDigitalReceived = new Prisma.Decimal(0);

    for (const transaction of transactionsInSession) {
        totalSalesAmount = totalSalesAmount.plus(transaction.totalAmount);
        for (const payment of transaction.paymentDetails) {
            if (payment.paymentMethod === 'CASH') {
                totalCashReceived = totalCashReceived.plus(payment.amount);
            } else if (payment.paymentMethod === 'CARD') {
                totalCardReceived = totalCardReceived.plus(payment.amount);
            } else {
                totalDigitalReceived = totalDigitalReceived.plus(payment.amount);
            }
        }
    }

    const calculatedClosingCash = existingSession.openingCashAmount.plus(totalCashReceived);
    const cashVariance = closingCashAmount ? new Prisma.Decimal(closingCashAmount).minus(calculatedClosingCash) : new Prisma.Decimal(0);

    const session = await prisma.pOSSession.update({
        where: { id: sessionId },
        data: {
            status: 'CLOSED',
            closedAt: new Date(),
            closingCashAmount: closingCashAmount ? new Prisma.Decimal(closingCashAmount) : undefined,
            totalSalesAmount,
            totalCashReceived,
            totalCardReceived,
            totalDigitalReceived,
            totalTransactions: transactionsInSession.length,
            cashVariance,
            notes: notes || existingSession.notes,
        },
        include: { cashier: true },
    });

    return {
        ...session,
        openingCashAmount: convertToNumber(session.openingCashAmount),
        closingCashAmount: convertToNumber(session.closingCashAmount),
        totalSalesAmount: convertToNumber(session.totalSalesAmount),
        totalCashReceived: convertToNumber(session.totalCashReceived),
        totalCardReceived: convertToNumber(session.totalCardReceived),
        totalDigitalReceived: convertToNumber(session.totalDigitalReceived),
        cashVariance: convertToNumber(session.cashVariance),
    };
}

export async function getPOSSessionById(sessionId: string): Promise<POSSession | null> {
    const session = await prisma.pOSSession.findUnique({
        where: { id: sessionId },
        include: { cashier: true, transactions: { include: { items: true, paymentDetails: true } } },
    });
    if (!session) return null;
    return {
        ...session,
        openingCashAmount: convertToNumber(session.openingCashAmount),
        closingCashAmount: convertToNumber(session.closingCashAmount),
        totalSalesAmount: convertToNumber(session.totalSalesAmount),
        totalCashReceived: convertToNumber(session.totalCashReceived),
        totalCardReceived: convertToNumber(session.totalCardReceived),
        totalDigitalReceived: convertToNumber(session.totalDigitalReceived),
        cashVariance: convertToNumber(session.cashVariance),
        transactions: session.transactions.map(t => ({
            ...t,
            totalAmount: convertToNumber(t.totalAmount),
            taxAmount: convertToNumber(t.taxAmount),
            discountAmount: convertToNumber(t.discountAmount),
            items: t.items.map(ti => ({
                ...ti,
                unitPrice: convertToNumber(ti.unitPrice),
                totalPrice: convertToNumber(ti.totalPrice),
                discountApplied: convertToNumber(ti.discountApplied),
                taxRate: convertToNumber(ti.taxRate),
                taxAmount: convertToNumber(ti.taxAmount),
            })),
            paymentDetails: t.paymentDetails.map(pd => ({
                ...pd,
                amount: convertToNumber(pd.amount),
            })),
        })),
    };
}

export async function getLatestOpenPOSSessionByCashierId(cashierId: string): Promise<POSSession | null> {
    const session = await prisma.pOSSession.findFirst({
        where: { cashierId, status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
        include: { cashier: true },
    });
    if (!session) return null;
    return {
        ...session,
        openingCashAmount: convertToNumber(session.openingCashAmount),
        closingCashAmount: convertToNumber(session.closingCashAmount),
        totalSalesAmount: convertToNumber(session.totalSalesAmount),
        totalCashReceived: convertToNumber(session.totalCashReceived),
        totalCardReceived: convertToNumber(session.totalCardReceived),
        totalDigitalReceived: convertToNumber(session.totalDigitalReceived),
        cashVariance: convertToNumber(session.cashVariance),
    };
}

// Transactions
export async function createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    return prisma.$transaction(async (tx) => {
        const { transactionNumber, cashierId, sessionId, customerId, items, paymentDetails, notes } = data;

        const cashier = await tx.user.findUnique({ where: { id: cashierId } });
        if (!cashier) throw new NotFoundError('Cashier not found');
        
        if (sessionId) {
            const session = await tx.pOSSession.findUnique({ where: { id: sessionId } });
            if (!session || session.status !== 'OPEN') {
                throw new BadRequestError('Active POS Session not found');
            }
        }
        
        if (customerId) {
            const customer = await tx.customer.findUnique({ where: { id: customerId } });
            if (!customer) throw new NotFoundError('Customer not found');
        }

        let totalAmount = new Prisma.Decimal(0);
        let totalTaxAmount = new Prisma.Decimal(0);
        let totalDiscountAmount = new Prisma.Decimal(0);

        const transactionItemsData = await Promise.all(
            items.map(async (item) => {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new NotFoundError(`Product with ID ${item.productId} not found`);
                if (product.stockQuantity < item.quantity) throw new BadRequestError(`Not enough stock for product ${product.name}`);

                const unitPrice = new Prisma.Decimal(item.unitPrice || convertToNumber(product.price));
                const quantity = new Prisma.Decimal(item.quantity);
                const discountApplied = new Prisma.Decimal(item.discountApplied || 0);
                const taxRate = new Prisma.Decimal(product.taxRate || 0);

                const itemTotalPrice = unitPrice.times(quantity).minus(discountApplied);
                const itemTaxAmount = itemTotalPrice.times(taxRate.dividedBy(100));
                
                totalAmount = totalAmount.plus(itemTotalPrice);
                totalTaxAmount = totalTaxAmount.plus(itemTaxAmount);
                totalDiscountAmount = totalDiscountAmount.plus(discountApplied);

                // Decrement product stock
                await tx.product.update({
                    where: { id: product.id },
                    data: { stockQuantity: { decrement: item.quantity } },
                });

                // Create inventory transaction for sale
                await createInventoryTransaction({
                    productId: product.id,
                    transactionType: 'POS_SALE',
                    quantity: item.quantity,
                    referenceId: transactionNumber,
                });

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice: itemTotalPrice,
                    discountApplied,
                    taxRate,
                    taxAmount: itemTaxAmount,
                };
            })
        );

        // Determine main payment method (simplified for now, can be MIXED)
        // Both PaymentMethod and TransactionPaymentMethod have same values, convert to raw string
        const firstPaymentMethod = paymentDetails.length > 0 ? String(paymentDetails[0].paymentMethod) : 'CASH';
        const mainPaymentMethodStr = paymentDetails.length > 1 ? 'MIXED' : firstPaymentMethod;
        const isCreditSale = paymentDetails.some(pd => pd.paymentMethod === 'CREDIT');
        const upfrontCreditPaymentAmount = isCreditSale
            ? paymentDetails
                .filter(pd => pd.paymentMethod === 'CREDIT')
                .reduce((sum, pd) => sum.plus(new Prisma.Decimal(pd.amount)), new Prisma.Decimal(0))
            : new Prisma.Decimal(0);
        const rawRemainingCreditBalance = totalAmount.minus(upfrontCreditPaymentAmount);
        const remainingCreditBalance = rawRemainingCreditBalance.greaterThan(0)
            ? rawRemainingCreditBalance
            : new Prisma.Decimal(0);

        const transaction = await (tx as any).transaction.create({
            data: {
                transactionNumber,
                cashierId,
                sessionId,
                customerId,
                totalAmount,
                taxAmount: totalTaxAmount,
                discountAmount: totalDiscountAmount,
                paymentMethod: mainPaymentMethodStr as any,
                status: 'COMPLETED', // Assuming successful transaction
                notes,
                items: { create: transactionItemsData },
                paymentDetails: {
                    create: paymentDetails.map(pd => ({
                        paymentMethod: pd.paymentMethod,
                        amount: new Prisma.Decimal(pd.amount),
                        referenceNumber: pd.referenceNumber,
                        status: 'COMPLETED',
                    })),
                },
            },
            include: {
                customer: true,
                cashier: true,
                session: true,
                items: { include: { product: true } },
                paymentDetails: true,
            },
        });

        // If a customer is associated, create a corresponding SalesOrder
        if (customerId) {
            const customer = await tx.customer.findUnique({ where: { id: customerId } });
            if (!customer) throw new NotFoundError('Customer not found for Sales Order creation');

            if (isCreditSale) {
                const existingOutstanding = await tx.salesOrder.aggregate({
                    where: {
                        customerId,
                        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
                    },
                    _sum: {
                        balanceAmount: true,
                    },
                });

                const currentOutstandingBalance = existingOutstanding._sum.balanceAmount ?? new Prisma.Decimal(0);
                const newOutstandingBalance = currentOutstandingBalance.plus(remainingCreditBalance);
                if (newOutstandingBalance.greaterThan(customer.creditLimit)) {
                    throw new BadRequestError('Credit limit exceeded');
                }

                const initialPaymentStatus =
                    remainingCreditBalance.lessThanOrEqualTo(0)
                        ? 'PAID'
                        : upfrontCreditPaymentAmount.greaterThan(0)
                            ? 'PARTIALLY_PAID'
                            : 'UNPAID';

                // Create a SalesOrder with CONFIRMED status and balance due
                const salesOrder = await tx.salesOrder.create({
                    data: {
                        customerId,
                        orderDate: transaction.createdAt,
                        status: remainingCreditBalance.lessThanOrEqualTo(0) ? 'PAID' : 'CONFIRMED',
                        totalAmount,
                        paidAmount: upfrontCreditPaymentAmount,
                        paymentStatus: initialPaymentStatus,
                        balanceAmount: remainingCreditBalance,
                        items: {
                            create: transactionItemsData.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                subtotal: item.totalPrice,
                                taxAmount: item.taxAmount,
                                discount: item.discountApplied,
                            })),
                        },
                    },
                });

                if (upfrontCreditPaymentAmount.greaterThan(0)) {
                    await createPaymentFromTransaction(
                        transaction.id,
                        customerId,
                        convertToNumber(upfrontCreditPaymentAmount),
                        'CREDIT',
                        tx,
                        salesOrder.id,
                        transaction.createdAt,
                        undefined,
                        'Initial payment captured during POS credit sale'
                    );
                }

            } else {
                 const salesOrder = await tx.salesOrder.create({
                    data: {
                        customerId,
                        orderDate: transaction.createdAt,
                        status: 'PAID', // POS transactions are immediately paid
                        totalAmount,
                        balanceAmount: new Prisma.Decimal(0), // Paid in full
                        items: {
                            create: transactionItemsData.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                subtotal: item.totalPrice, // totalPrice from transaction item is subtotal for sales order item
                                taxAmount: item.taxAmount,
                                discount: item.discountApplied,
                            })),
                        },
                    },
                });

                await createPaymentFromTransaction(
                    transaction.id,
                    customerId,
                    convertToNumber(totalAmount),
                    mainPaymentMethodStr,
                    tx,
                    salesOrder.id,
                    transaction.createdAt
                );
            }
        }


        // Update POS Session totals
        if (sessionId) {
            await tx.pOSSession.update({
                where: { id: sessionId },
                data: {
                    totalSalesAmount: { increment: totalAmount },
                    totalTransactions: { increment: 1 },
                    totalCashReceived: {
                        increment: paymentDetails.filter(pd => pd.paymentMethod === 'CASH')
                                .reduce((sum, pd) => sum.plus(new Prisma.Decimal(pd.amount)), new Prisma.Decimal(0)),
                    },
                    totalCardReceived: {
                        increment: paymentDetails.filter(pd => pd.paymentMethod === 'CARD')
                                .reduce((sum, pd) => sum.plus(new Prisma.Decimal(pd.amount)), new Prisma.Decimal(0)),
                    },
                    totalDigitalReceived: {
                        increment: paymentDetails.filter(pd => pd.paymentMethod !== 'CASH' && pd.paymentMethod !== 'CARD')
                                .reduce((sum, pd) => sum.plus(new Prisma.Decimal(pd.amount)), new Prisma.Decimal(0)),
                    },
                },
            });
        }

        // Create Payment record and ledger entries for the transaction, but not for credit sales
        if (!isCreditSale && !customerId) {
            try {
                console.log(`[POS] Creating payment for transaction ${transaction.id}, customerId: ${customerId}, amount: ${convertToNumber(totalAmount)}, method: ${mainPaymentMethodStr}`);
                await createPaymentFromTransaction(
                    transaction.id,
                    customerId || null,
                    convertToNumber(totalAmount),
                    mainPaymentMethodStr,
                    tx
                );
                console.log(`[POS] Payment created successfully for transaction ${transaction.id}`);
            } catch (paymentError) {
                console.error(`[POS] Failed to create payment for transaction ${transaction.id}:`, paymentError);
                // Log error but don't fail the entire transaction
                // This ensures the sale is recorded even if payment recording fails
            }
        }

        const result = {
            ...transaction,
            totalAmount: convertToNumber(transaction.totalAmount),
            taxAmount: convertToNumber(transaction.taxAmount),
            discountAmount: convertToNumber(transaction.discountAmount),
            items: transaction.items.map((ti: any) => ({
                id: ti.id,
                transactionId: ti.transactionId,
                productId: ti.productId,
                quantity: ti.quantity,
                unitPrice: convertToNumber(ti.unitPrice),
                totalPrice: convertToNumber(ti.totalPrice),
                discountApplied: convertToNumber(ti.discountApplied),
                taxRate: convertToNumber(ti.taxRate),
                taxAmount: convertToNumber(ti.taxAmount),
                createdAt: ti.createdAt,
                updatedAt: ti.updatedAt,
            })),
            paymentDetails: transaction.paymentDetails.map((pd: any) => ({
                id: pd.id,
                transactionId: pd.transactionId,
                paymentMethod: pd.paymentMethod,
                amount: convertToNumber(pd.amount),
                referenceNumber: pd.referenceNumber,
                status: pd.status,
                notes: pd.notes,
                createdAt: pd.createdAt,
                updatedAt: pd.updatedAt,
            })),
        } as Transaction;

        return result;
    });
}
export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            customer: true,
            cashier: true,
            session: true,
            items: { include: { product: true } },
            paymentDetails: true,
            receipt: true,
        },
    });

    if (!transaction) return null;

    return {
        ...transaction,
        totalAmount: convertToNumber(transaction.totalAmount),
        taxAmount: convertToNumber(transaction.taxAmount),
        discountAmount: convertToNumber(transaction.discountAmount),
        items: transaction.items.map(ti => ({
            ...ti,
            unitPrice: convertToNumber(ti.unitPrice),
            totalPrice: convertToNumber(ti.totalPrice),
            discountApplied: convertToNumber(ti.discountApplied),
            taxRate: convertToNumber(ti.taxRate),
            taxAmount: convertToNumber(ti.taxAmount),
            product: {
                ...ti.product,
                price: convertToNumber(ti.product.price),
                costPrice: ti.product.costPrice ? convertToNumber(ti.product.costPrice) : null,
            },
        })),
        paymentDetails: transaction.paymentDetails.map(pd => ({
            ...pd,
            amount: convertToNumber(pd.amount),
        })),
    } as unknown as Transaction;
}

export async function getTransactionsBySessionId(sessionId: string): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
        where: { sessionId },
        include: {
            customer: true,
            cashier: true,
            items: { include: { product: true } },
            paymentDetails: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => ({
        ...t,
        totalAmount: convertToNumber(t.totalAmount),
        taxAmount: convertToNumber(t.taxAmount),
        discountAmount: convertToNumber(t.discountAmount),
        items: t.items.map(ti => ({
            ...ti,
            unitPrice: convertToNumber(ti.unitPrice),
            totalPrice: convertToNumber(ti.totalPrice),
            discountApplied: convertToNumber(ti.discountApplied),
            taxRate: convertToNumber(ti.taxRate),
            taxAmount: convertToNumber(ti.taxAmount),
        })),
        paymentDetails: t.paymentDetails.map(pd => ({
            ...pd,
            amount: convertToNumber(pd.amount),
        })),
    })) as unknown as Transaction[];
}

export async function getAllPOSSessions(filters: any): Promise<PaginatedPOSSessions> {
    const { cashierId, status, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.POSSessionWhereInput = {};

    if (cashierId) {
        where.cashierId = cashierId;
    }
    if (status) {
        where.status = status;
    }
    if (startDate || endDate) {
        where.openedAt = {};
        if (startDate) {
            where.openedAt.gte = startDate;
        }
        if (endDate) {
            where.openedAt.lte = endDate;
        }
    }

    const sessions = await prisma.pOSSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: { cashier: true },
    });

    const total = await prisma.pOSSession.count({ where });
    const pages = Math.ceil(total / limit);

    return {
        sessions: sessions.map(s => ({
            ...s,
            openingCashAmount: convertToNumber(s.openingCashAmount),
            closingCashAmount: convertToNumber(s.closingCashAmount),
            totalSalesAmount: convertToNumber(s.totalSalesAmount),
            totalCashReceived: convertToNumber(s.totalCashReceived),
            totalCardReceived: convertToNumber(s.totalCardReceived),
            totalDigitalReceived: convertToNumber(s.totalDigitalReceived),
            cashVariance: convertToNumber(s.cashVariance),
        })),
        pagination: {
            page,
            limit,
            total,
            pages,
        },
    };
}

export async function getAllTransactions(filters: any): Promise<PaginatedTransactions> {
    const { search, customerId, cashierId, sessionId, status, paymentMethod, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (search) {
        where.OR = [
            { transactionNumber: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
        ];
    }
    if (customerId) {
        where.customerId = customerId;
    }
    if (cashierId) {
        where.cashierId = cashierId;
    }
    if (sessionId) {
        where.sessionId = sessionId;
    }
    if (status) {
        where.status = status;
    }
    if (paymentMethod) {
        where.paymentMethod = paymentMethod;
    }
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            where.createdAt.gte = startDate;
        }
        if (endDate) {
            where.createdAt.lte = endDate;
        }
    }

    const transactions = await prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, cashier: true, session: true },
    });

    const total = await prisma.transaction.count({ where });
    const pages = Math.ceil(total / limit);

    return {
        transactions: transactions.map(t => ({
            ...t,
            totalAmount: convertToNumber(t.totalAmount),
            taxAmount: convertToNumber(t.taxAmount),
            discountAmount: convertToNumber(t.discountAmount),
        })) as unknown as Transaction[],
        pagination: {
            page,
            limit,
            total,
            pages,
        },
    };
}
