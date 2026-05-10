// services/ledger.service.ts

import { prisma } from '@/lib/prisma';
import { buildOrderBy } from '@/lib/build-order-by';
import {
    CreateLedgerEntryInput,
    LedgerEntry,
    LedgerFilters,
    PaginatedLedgerEntries,
    UpdateLedgerEntryInput,
} from '@/types/ledger.types';
import { Prisma } from '@prisma/client';

function decimalToNumber(value: unknown): number {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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
        amount: decimalToNumber(entry.amount),
    };
}

export async function getAllLedgerEntries(filters: LedgerFilters): Promise<PaginatedLedgerEntries> {
    const { startDate, endDate, account, referenceId, page = 1, limit = 20, sortField, sortDir } = filters;
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
        orderBy: buildOrderBy(sortField, sortDir, { entryDate: 'desc' }),
    });

    const total = await prisma.ledgerEntry.count({ where });
    const pages = Math.ceil(total / limit);

    return {
        entries: entries.map(e => ({
            ...e,
            amount: decimalToNumber(e.amount),
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
        amount: decimalToNumber(entry.amount),
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
        amount: decimalToNumber(updatedEntry.amount),
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
        const amount = decimalToNumber(entry.amount);
        
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
        .reduce((sum, t) => sum + decimalToNumber(t.totalAmount), 0);

    const taxCollected = transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + decimalToNumber(t.taxAmount), 0);

    const discountsGiven = transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + decimalToNumber(t.discountAmount), 0);

    const expenseWhere: Prisma.LedgerEntryWhereInput = {
      debitAccount: { contains: 'expense', mode: 'insensitive' },
    };
    if (startDate || endDate) {
      expenseWhere.entryDate = {};
      if (startDate) expenseWhere.entryDate.gte = startDate;
      if (endDate) expenseWhere.entryDate.lte = endDate;
    }

    const expenseEntries = await prisma.ledgerEntry.findMany({
      where: expenseWhere,
    });

    const totalExpenses = expenseEntries.reduce((sum, e) => sum + decimalToNumber(e.amount), 0);
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

// Account classification for double-entry bookkeeping.
// Debit-normal: assets, expenses (debit increases balance).
// Credit-normal: liabilities, equity, revenue (credit increases balance).
const ASSET_ACCOUNTS = new Set([
    'Cash', 'Bank', 'Accounts Receivable', 'Inventory',
    'Prepaid Expenses', 'Inventory in Transit', 'Other Assets',
]);
const LIABILITY_ACCOUNTS = new Set([
    'Accounts Payable', 'Goods Received Clearing',
    'Taxes Payable', 'Other Liabilities',
]);
const EQUITY_ACCOUNTS = new Set([
    'Sales Revenue', 'Owner Equity', 'Retained Earnings',
]);
const EXPENSE_ACCOUNTS = new Set([
    'Refunds Expense', 'Cost of Goods Sold',
]);

function classifyAccount(name: string): 'asset' | 'liability' | 'equity' | 'expense' | 'unknown' {
    if (ASSET_ACCOUNTS.has(name)) return 'asset';
    if (LIABILITY_ACCOUNTS.has(name)) return 'liability';
    if (EQUITY_ACCOUNTS.has(name)) return 'equity';
    if (EXPENSE_ACCOUNTS.has(name)) return 'expense';
    // Fallback: keyword matching for ad-hoc account names
    const lower = name.toLowerCase();
    if (lower.includes('cash') || lower.includes('bank') || lower.includes('receivable') || lower.includes('inventory')) return 'asset';
    if (lower.includes('payable') || lower.includes('liability') || lower.includes('clearing')) return 'liability';
    if (lower.includes('revenue') || lower.includes('equity') || lower.includes('retained')) return 'equity';
    if (lower.includes('expense') || lower.includes('cogs') || lower.includes('cost')) return 'expense';
    return 'unknown';
}

export async function getBalanceSheet(date?: Date): Promise<any> {
    const reportDate = date || new Date();

    const entries = await prisma.ledgerEntry.findMany({
        where: { entryDate: { lte: reportDate } },
        orderBy: { entryDate: 'asc' },
    });

    // Net balance per account: debit-normal accounts increase on debit, decrease on credit.
    // Credit-normal accounts increase on credit, decrease on debit.
    const balances: Record<string, number> = {};

    entries.forEach(entry => {
        const amount = decimalToNumber(entry.amount);
        const debitType = classifyAccount(entry.debitAccount);
        const creditType = classifyAccount(entry.creditAccount);

        // Debit side: increases debit-normal (asset/expense), decreases credit-normal
        if (debitType === 'asset' || debitType === 'expense') {
            balances[entry.debitAccount] = (balances[entry.debitAccount] || 0) + amount;
        } else {
            balances[entry.debitAccount] = (balances[entry.debitAccount] || 0) - amount;
        }

        // Credit side: increases credit-normal (liability/equity/revenue), decreases debit-normal
        if (creditType === 'liability' || creditType === 'equity') {
            balances[entry.creditAccount] = (balances[entry.creditAccount] || 0) + amount;
        } else {
            balances[entry.creditAccount] = (balances[entry.creditAccount] || 0) - amount;
        }
    });

    const assets: Record<string, number> = {};
    const liabilities: Record<string, number> = {};
    const equity: Record<string, number> = {};

    Object.entries(balances).forEach(([account, balance]) => {
        const type = classifyAccount(account);
        if (type === 'asset') assets[account] = balance;
        else if (type === 'liability') liabilities[account] = balance;
        else if (type === 'equity' || type === 'expense') equity[account] = balance;
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
