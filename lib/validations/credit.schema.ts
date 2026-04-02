/**
 * Credit System Zod Validation Schemas
 * Centralized validation for all credit operations
 */

import { z } from 'zod';

// ===== CUSTOMER CREDIT =====
export const createCustomerCreditSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  totalLimit: z
    .number()
    .positive('Credit limit must be positive')
    .max(999999.99, 'Credit limit too high'),
});
export type CreateCustomerCreditInput = z.infer<typeof createCustomerCreditSchema>;

export const updateCustomerCreditSchema = z.object({
  totalLimit: z
    .number()
    .positive('Credit limit must be positive')
    .max(999999.99, 'Credit limit too high')
    .optional(),
  status: z.enum(['ACTIVE', 'PARTIAL', 'OVERDUE', 'SETTLED', 'CLOSED']).optional(),
});
export type UpdateCustomerCreditInput = z.infer<typeof updateCustomerCreditSchema>;

// ===== CREDIT TRANSACTION =====
export const createCreditTransactionSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999.99, 'Amount too high'),
  description: z.string().max(500).optional(),
  paymentTerms: z
    .enum(['IMMEDIATE', 'NET_7', 'NET_15', 'NET_30', 'NET_60', 'END_OF_MONTH', 'CUSTOM'])
    .default('NET_30'),
  dueDate: z.date().optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateCreditTransactionInput = z.infer<typeof createCreditTransactionSchema>;

export const updateCreditTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(999999.99).optional(),
  description: z.string().max(500).optional(),
  paymentTerms: z
    .enum(['IMMEDIATE', 'NET_7', 'NET_15', 'NET_30', 'NET_60', 'END_OF_MONTH', 'CUSTOM'])
    .optional(),
  dueDate: z.date().optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});
export type UpdateCreditTransactionInput = z.infer<typeof updateCreditTransactionSchema>;

// ===== CREDIT PAYMENT =====
export const paymentAllocationSchema = z.object({
  creditTransactionId: z.string().uuid('Invalid transaction ID'),
  allocatedAmount: z
    .number()
    .positive('Allocated amount must be positive')
    .max(999999.99),
});
export type PaymentAllocationInput = z.infer<typeof paymentAllocationSchema>;

export const createCreditPaymentSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z
    .number()
    .positive('Payment amount must be positive')
    .max(999999.99, 'Amount too high'),
  paymentMethod: z.enum([
    'CASH',
    'BANK_TRANSFER',
    'CARD',
    'UPI',
    'CHEQUE',
    'DIGITAL_WALLET',
    'CREDIT',
    'DEBIT',
    'MOBILE_WALLET',
  ]),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  allocations: z.array(paymentAllocationSchema).optional().default([]),
});
export type CreateCreditPaymentInput = z.infer<typeof createCreditPaymentSchema>;

export const updateCreditPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(999999.99).optional(),
  paymentMethod: z
    .enum([
      'CASH',
      'BANK_TRANSFER',
      'CARD',
      'UPI',
      'CHEQUE',
      'DIGITAL_WALLET',
      'CREDIT',
      'DEBIT',
      'MOBILE_WALLET',
    ])
    .optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'OVERDUE', 'CANCELLED']).optional(),
});
export type UpdateCreditPaymentInput = z.infer<typeof updateCreditPaymentSchema>;

// ===== INTEREST ENTRY =====
export const createInterestSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  creditTransactionId: z.string().uuid('Invalid transaction ID').optional(),
  amount: z.number().positive('Interest amount must be positive').max(999999.99),
  rate: z
    .number()
    .positive('Rate must be positive')
    .max(100, 'Rate cannot exceed 100%'),
  period: z.number().int().positive('Period must be positive'),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateInterestInput = z.infer<typeof createInterestSchema>;

// ===== CREDIT REFUND =====
export const createCreditRefundSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z
    .number()
    .positive('Refund amount must be positive')
    .max(999999.99, 'Amount too high'),
  reason: z.string().min(10, 'Refund reason must be at least 10 characters').max(500),
  creditPaymentId: z.string().uuid('Invalid payment ID').optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateCreditRefundInput = z.infer<typeof createCreditRefundSchema>;

// ===== PAYMENT REMINDER =====
export const createReminderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  reminderType: z.enum(['DUE_REMINDER', 'OVERDUE_REMINDER', 'LATE_FEE_NOTICE', 'COLLECTION_NOTICE']),
  scheduledDate: z.date().min(new Date(), 'Scheduled date must be in future'),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'NOTIFICATION']).optional(),
  message: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateReminderInput = z.infer<typeof createReminderSchema>;

export const updateReminderSchema = z.object({
  status: z
    .enum(['CREATED', 'SENT', 'FAILED', 'ACKNOWLEDGED'])
    .optional(),
  sentDate: z.date().optional(),
  acknowledgedDate: z.date().optional(),
  deliveryStatus: z.string().max(100).optional(),
  failureReason: z.string().max(500).optional(),
});
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

// ===== BULK PAYMENT BATCH =====
export const createBulkPaymentBatchSchema = z.object({
  totalCustomers: z.number().int().positive('Total customers must be positive'),
  totalAmount: z
    .number()
    .positive('Total amount must be positive')
    .max(9999999.99, 'Amount too high'),
  notes: z.string().max(1000).optional(),
});
export type CreateBulkPaymentBatchInput = z.infer<typeof createBulkPaymentBatchSchema>;
