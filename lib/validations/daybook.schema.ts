import { z } from "zod";

// Expense Category Schemas
export const createExpenseCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  parentCategoryId: z.string().uuid().optional().nullable(),
  accountHead: z.string().optional().nullable(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

export type CreateExpenseCategoryInput = z.infer<
  typeof createExpenseCategorySchema
>;
export type UpdateExpenseCategoryInput = z.infer<
  typeof updateExpenseCategorySchema
>;

// Day Book Schemas
export const createDayBookSchema = z.object({
  date: z.coerce.date(),
  openingCashBalance: z.coerce.number().nonnegative(),
  openingBankBalance: z.coerce.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

export const closeDayBookSchema = z.object({
  closingCashBalance: z.coerce.number().nonnegative(),
  closingBankBalance: z.coerce.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

export const approveDayBookSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type CreateDayBookInput = z.infer<typeof createDayBookSchema>;
export type CloseDayBookInput = z.infer<typeof closeDayBookSchema>;
export type ApproveDayBookInput = z.infer<typeof approveDayBookSchema>;

// Day Book Entry Schemas
export const createDayBookEntrySchema = z.object({
  dayBookId: z.string().uuid(),
  entryType: z.enum([
    "SALE",
    "PURCHASE",
    "EXPENSE",
    "PAYMENT_IN",
    "PAYMENT_OUT",
    "BANK_DEPOSIT",
    "BANK_WITHDRAWAL",
  ]),
  entryDate: z.coerce.date(),
  description: z.string().min(1).max(500),
  amount: z.coerce.number().positive(),
  paymentMethod: z
    .enum([
      "CASH",
      "BANK_TRANSFER",
      "CARD",
      "UPI",
      "CHEQUE",
      "DIGITAL_WALLET",
      "CREDIT",
      "DEBIT",
      "MOBILE_WALLET",
    ])
    .optional()
    .nullable(),
  referenceType: z
    .enum(["SALES_ORDER", "PURCHASE_ORDER", "POS_TRANSACTION", "PAYMENT"])
    .optional()
    .nullable(),
  referenceId: z.string().uuid().optional().nullable(),
  partyType: z
    .enum(["CUSTOMER", "SUPPLIER", "EMPLOYEE"])
    .optional()
    .nullable(),
  partyId: z.string().optional().nullable(),
  partyName: z.string().optional().nullable(),
  debitAccount: z.string().optional().nullable(),
  creditAccount: z.string().optional().nullable(),
  expenseCategoryId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
});

export const updateDayBookEntrySchema = createDayBookEntrySchema.partial();

export type CreateDayBookEntryInput = z.infer<
  typeof createDayBookEntrySchema
>;
export type UpdateDayBookEntryInput = z.infer<
  typeof updateDayBookEntrySchema
>;

// Cash Denomination Schema
export const createCashDenominationSchema = z.object({
  dayBookId: z.string().uuid(),
  denomination: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().nonnegative(),
  notes: z.string().optional().nullable(),
});

export const updateCashDenominationSchema =
  createCashDenominationSchema.partial();

export type CreateCashDenominationInput = z.infer<
  typeof createCashDenominationSchema
>;
export type UpdateCashDenominationInput = z.infer<
  typeof updateCashDenominationSchema
>;

// Reconciliation Schema
export const reconcileDayBookSchema = z.object({
  denominations: z.array(
    z.object({
      denomination: z.number().int().positive(),
      quantity: z.number().int().nonnegative(),
    })
  ),
  notes: z.string().optional().nullable(),
});

export type ReconcileDayBookInput = z.infer<typeof reconcileDayBookSchema>;
