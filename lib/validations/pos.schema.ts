// lib/validations/pos.schema.ts

import { CONCRETE_PAYMENT_METHODS } from '@/types/payment.types';
import { POS_SESSION_STATUSES, TRANSACTION_PAYMENT_METHODS, TRANSACTION_STATUSES } from '@/types/pos.types';
import { z } from 'zod';

export const createPOSSessionSchema = z.object({
  cashierId: z.string().uuid('Cashier ID must be a valid UUID'),
  terminalId: z.string().optional().nullable(),
  openingCashAmount: z.number().min(0, 'Opening cash amount cannot be negative'),
  notes: z.string().optional().nullable(),
});

export type CreatePOSSessionInput = z.infer<typeof createPOSSessionSchema>;

export const updatePOSSessionSchema = z.object({
  status: z.enum(POS_SESSION_STATUSES).optional(),
  closingCashAmount: z.number().min(0, 'Closing cash amount cannot be negative').optional(),
  notes: z.string().optional().nullable(),
});

export type UpdatePOSSessionInput = z.infer<typeof updatePOSSessionSchema>;

export const createTransactionItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().positive('Unit price must be a positive number').optional(),
  discountApplied: z.number().min(0, 'Discount cannot be negative').optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

export const createTransactionPaymentDetailSchema = z.object({
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS),
  amount: z.number().min(0, 'Payment amount cannot be negative'),
  referenceNumber: z.string().optional().nullable(),
});

export const createTransactionSchema = z.object({
  transactionNumber: z.string().min(1, 'Transaction number is required').max(255),
  cashierId: z.string().uuid('Cashier ID must be a valid UUID'),
  sessionId: z.string().uuid('Session ID must be a valid UUID').optional().nullable(),
  customerId: z.string().uuid('Customer ID must be a valid UUID').optional().nullable(),
  items: z.array(createTransactionItemSchema).min(1, 'Transaction must have at least one item'),
  paymentDetails: z.array(createTransactionPaymentDetailSchema).min(1, 'Transaction must have at least one payment detail'),
  notes: z.string().optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const posSessionFilterSchema = z.object({
  cashierId: z.string().uuid().optional(),
  status: z.enum(POS_SESSION_STATUSES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type POSSessionFiltersInput = z.infer<typeof posSessionFilterSchema>;

export const transactionFilterSchema = z.object({
  search: z.string().optional(), // transactionNumber or customerName
  customerId: z.string().uuid().optional(),
  cashierId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  paymentMethod: z.enum(TRANSACTION_PAYMENT_METHODS).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type TransactionFiltersInput = z.infer<typeof transactionFilterSchema>;
