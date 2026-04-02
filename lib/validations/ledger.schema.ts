// lib/validations/ledger.schema.ts
import { z } from 'zod';

export const createLedgerEntrySchema = z.object({
    entryDate: z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
        return arg;
    }, z.date().optional()),
    description: z.string().min(1, 'Description is required'),
    debitAccount: z.string().min(1, 'Debit account is required'),
    creditAccount: z.string().min(1, 'Credit account is required'),
    amount: z.number().positive('Amount must be positive'),
    referenceId: z.string().optional(),
});

export const updateLedgerEntrySchema = z.object({
    entryDate: z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
        return arg;
    }, z.date().optional()),
    description: z.string().min(1, 'Description is required').optional(),
    debitAccount: z.string().min(1, 'Debit account is required').optional(),
    creditAccount: z.string().min(1, 'Credit account is required').optional(),
    amount: z.number().positive('Amount must be positive').optional(),
    referenceId: z.string().optional(),
});

export const ledgerFilterSchema = z.object({
    startDate: z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
        return arg;
    }, z.date().optional()),
    endDate: z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
        return arg;
    }, z.date().optional()),
    account: z.string().optional(),
    referenceId: z.string().optional(),
    page: z.preprocess((val) => Number(val), z.number().int().positive().optional()),
    limit: z.preprocess((val) => Number(val), z.number().int().positive().optional()),
});

