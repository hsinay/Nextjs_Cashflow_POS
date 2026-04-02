// services/ledger.service.ts

import { prisma } from '@/lib/prisma';
import {
    CreateLedgerEntryInput,
    LedgerEntry,
    LedgerFilters,
    PaginatedLedgerEntries,
    UpdateLedgerEntryInput,
} from '@/types/ledger.types';
import { Prisma } from '@prisma/client';

function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

// Support both regular and transaction contexts
export async function createLedgerEntry(data: CreateLedgerEntryInput, txClient?: Prisma.TransactionClient): Promise<LedgerEntry> {
    const { entryDate, description, debitAccount, creditAccount, amount, referenceId } = data;
    
    const client = txClient || prisma;

    const entry = await client.ledgerEntry.create({
        data: {
            entryDate: entryDate || new Date(),
            description,
            debitAccount,
            creditAccount,
            amount: new Prisma.Decimal(amount),
            referenceId,
        },
    });

    return {
        ...entry,
        amount: convertToNumber(entry.amount),
    };
}

export async function getAllLedgerEntries(filters: LedgerFilters): Promise<PaginatedLedgerEntries> {
    const { startDate, endDate, account, referenceId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.LedgerEntryWhereInput = {};

    if (startDate || endDate) {
        where.entryDate = {};
        if (startDate) where.entryDate.gte = startDate;
        if (endDate) where.entryDate.lte = endDate;
    }
    if (account) {
        where.OR = [
            { debitAccount: { contains: account, mode: 'insensitive' } },
            { creditAccount: { contains: account, mode: 'insensitive' } },
        ];
    }
    if (referenceId) {
        where.referenceId = referenceId;
    }

    const entries = await prisma.ledgerEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entryDate: 'desc' },
    });

    const total = await prisma.ledgerEntry.count({ where });
    const pages = Math.ceil(total / limit);

    return {
        entries: entries.map(e => ({
            ...e,
            amount: convertToNumber(e.amount),
        })),
        pagination: {
            page,
            limit,
            total,
            pages,
        },
    };
}

export async function getLedgerEntryById(id: string): Promise<LedgerEntry | null> {
    const entry = await prisma.ledgerEntry.findUnique({
        where: { id },
    });
    if (!entry) return null;
    return {
        ...entry,
        amount: convertToNumber(entry.amount),
    };
}

export async function updateLedgerEntry(id: string, data: UpdateLedgerEntryInput): Promise<LedgerEntry> {
    const updatedEntry = await prisma.ledgerEntry.update({
        where: { id },
        data: {
            entryDate: data.entryDate,
            description: data.description,
            debitAccount: data.debitAccount,
            creditAccount: data.creditAccount,
            amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
            referenceId: data.referenceId,
        },
    });
    return {
        ...updatedEntry,
        amount: convertToNumber(updatedEntry.amount),
    };
}

export async function deleteLedgerEntry(id: string): Promise<void> {
    await prisma.ledgerEntry.delete({ where: { id } });
}

// Financial Reports Implementation
export async function getTrialBalance(startDate?: Date, endDate?: Date): Promise<any> {
    const where: Prisma.LedgerEntryWhereInput = {};
    
    if (startDate || endDate) {
        where.entryDate = {};
        if (startDate) where.entryDate.gte = startDate;
        if (endDate) where.entryDate.lte = endDate;
    }

    const entries = await prisma.ledgerEntry.findMany({
        where,
        orderBy: { entryDate: 'asc' },
    });

    // Build account balances
    const accountBalances: Record<string, { debit: number; credit: number }> = {};

    entries.forEach(entry => {
        const amount = convertToNumber(entry.amount);
        
        // Debit account
        if (!accountBalances[entry.debitAccount]) {
            accountBalances[entry.debitAccount] = { debit: 0, credit: 0 };
        }
        accountBalances[entry.debitAccount].debit += amount;

        // Credit account
        if (!accountBalances[entry.creditAccount]) {
            accountBalances[entry.creditAccount] = { debit: 0, credit: 0 };
        }
        accountBalances[entry.creditAccount].credit += amount;
    });

    // Format trial balance
    const accounts = Object.entries(accountBalances).map(([name, balance]) => ({
        account: name,
        debit: balance.debit,
        credit: balance.credit,
    }));

    const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

    return {
        reportDate: endDate || new Date(),
        accounts,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
}

export async function getProfitAndLossStatement(startDate?: Date, endDate?: Date): Promise<any> {
    // Use transactions to calculate income and expenses
    const where: Prisma.TransactionWhereInput = {};
    
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const transactions = await prisma.transaction.findMany({
        where,
        select: {
            totalAmount: true,
            taxAmount: true,
            discountAmount: true,
            status: true,
        },
    });

    const revenue = transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + convertToNumber(t.totalAmount), 0);

    const taxCollected = transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + convertToNumber(t.taxAmount), 0);

    const discountsGiven = transactions
        .reduce((sum, t) => sum + convertToNumber(t.discountAmount), 0);

    // Get expenses from ledger (expense accounts)
    const expenseEntries = await prisma.ledgerEntry.findMany({
        where: {
            ...where,
            debitAccount: { contains: 'expense', mode: 'insensitive' },
        },
    });

    const totalExpenses = expenseEntries.reduce((sum, e) => sum + convertToNumber(e.amount), 0);
    const netProfit = revenue - totalExpenses - discountsGiven;

    return {
        period: {
            startDate: startDate || new Date(new Date().getFullYear(), 0, 1),
            endDate: endDate || new Date(),
        },
        revenue,
        expenses: totalExpenses,
        discounts: discountsGiven,
        tax: taxCollected,
        netProfit,
        profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%',
    };
}

export async function getBalanceSheet(date?: Date): Promise<any> {
    const reportDate = date || new Date();
    
    // Get all ledger entries up to the report date
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            entryDate: {
                lte: reportDate,
            },
        },
        orderBy: { entryDate: 'asc' },
    });

    // Aggregate balances by account type
    const assets: Record<string, number> = {};
    const liabilities: Record<string, number> = {};
    const equity: Record<string, number> = {};

    entries.forEach(entry => {
        const amount = convertToNumber(entry.amount);

        // Simplified categorization based on account name
        const debitAcc = entry.debitAccount.toLowerCase();
        const creditAcc = entry.creditAccount.toLowerCase();

        if (debitAcc.includes('asset')) {
            assets[entry.debitAccount] = (assets[entry.debitAccount] || 0) + amount;
        } else if (debitAcc.includes('liability')) {
            liabilities[entry.debitAccount] = (liabilities[entry.debitAccount] || 0) - amount;
        } else if (debitAcc.includes('equity')) {
            equity[entry.debitAccount] = (equity[entry.debitAccount] || 0) + amount;
        }

        if (creditAcc.includes('asset')) {
            assets[entry.creditAccount] = (assets[entry.creditAccount] || 0) - amount;
        } else if (creditAcc.includes('liability')) {
            liabilities[entry.creditAccount] = (liabilities[entry.creditAccount] || 0) + amount;
        } else if (creditAcc.includes('equity')) {
            equity[entry.creditAccount] = (equity[entry.creditAccount] || 0) - amount;
        }
    });

    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + val, 0);
    const totalEquity = Object.values(equity).reduce((sum, val) => sum + val, 0);

    return {
        reportDate,
        assets: {
            items: Object.entries(assets).map(([name, value]) => ({ account: name, amount: value })),
            total: totalAssets,
        },
        liabilities: {
            items: Object.entries(liabilities).map(([name, value]) => ({ account: name, amount: value })),
            total: totalLiabilities,
        },
        equity: {
            items: Object.entries(equity).map(([name, value]) => ({ account: name, amount: value })),
            total: totalEquity,
        },
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
}
