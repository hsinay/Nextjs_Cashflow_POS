// lib/validations/payment.schema.ts

import {
    CARD_BRANDS,
    CARD_TYPES,
    CHEQUE_STATUSES,
    CONCRETE_PAYMENT_METHODS,
    PAYER_TYPES,
    RECONCILIATION_STATUSES,
    REFUND_METHODS,
    VERIFICATION_METHODS,
    WALLET_PROVIDERS,
} from '@/types/payment.types';
import { z } from 'zod';

// ============================================================================
// Payment Schemas
// ============================================================================

export const createPaymentSchema = z.object({
  payerId: z.string().uuid('Payer ID must be a valid UUID'),
  payerType: z.enum(PAYER_TYPES, { message: 'Invalid payer type' }),
  paymentDate: z.coerce.date().optional(),
  amount: z.number().positive('Amount must be a positive number'),
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS, { message: 'Invalid payment method' }),
  referenceOrderId: z.string().uuid('Reference Order ID must be a valid UUID').optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  transactionFee: z.number().min(0).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  
  // Card details
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.enum(CARD_BRANDS).optional(),
  cardType: z.enum(CARD_TYPES).optional(),
  
  // Digital wallet
  walletProvider: z.enum(WALLET_PROVIDERS).optional(),
  walletIdentifier: z.string().max(100).optional(),
  
  // Bank transfer
  bankName: z.string().max(100).optional(),
  accountHolder: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(), // Should be encrypted in practice
  routingNumber: z.string().max(50).optional(),
  
  // UPI
  upiId: z.string().email().optional(),
  
  // Cheque
  chequeNumber: z.string().max(50).optional(),
  chequeDate: z.coerce.date().optional(),
  chequeBank: z.string().max(100).optional(),
  chequeStatus: z.enum(CHEQUE_STATUSES).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = z.object({
  paymentDate: z.coerce.date().optional(),
  amount: z.number().positive('Amount must be a positive number').optional(),
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS, { message: 'Invalid payment method' }).optional(),
  referenceOrderId: z.string().uuid('Reference Order ID must be a valid UUID').optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  isReconciled: z.boolean().optional(),
  reconciledBy: z.string().uuid().optional(),
}).partial();

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

export const paymentFilterSchema = z.object({
  search: z.string().optional(),
  payerType: z.enum(PAYER_TYPES, { message: 'Invalid payer type' }).optional(),
  payerId: z.string().uuid('Payer ID must be a valid UUID').optional(),
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS, { message: 'Invalid payment method' }).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  referenceOrderId: z.string().uuid('Reference Order ID must be a valid UUID').optional(),
  isReconciled: z.boolean().optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type PaymentFiltersInput = z.infer<typeof paymentFilterSchema>;

// ============================================================================
// Payment Refund Schemas
// ============================================================================

export const createRefundSchema = z.object({
  paymentId: z.string().uuid('Payment ID must be a valid UUID'),
  transactionId: z.string().uuid('Transaction ID must be a valid UUID').optional(),
  refundAmount: z.number().positive('Refund amount must be a positive number'),
  reason: z.string().min(1).max(500, 'Reason must not exceed 500 characters'),
  refundMethod: z.enum(REFUND_METHODS).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

export const approveRefundSchema = z.object({
  refundId: z.string().uuid('Refund ID must be a valid UUID'),
  approvedBy: z.string().uuid('Approver ID must be a valid UUID'),
  notes: z.string().max(500).optional(),
});

export type ApproveRefundInput = z.infer<typeof approveRefundSchema>;

export const processRefundSchema = z.object({
  refundId: z.string().uuid('Refund ID must be a valid UUID'),
  processedBy: z.string().uuid('Processor ID must be a valid UUID'),
  notes: z.string().max(500).optional(),
});

export type ProcessRefundInput = z.infer<typeof processRefundSchema>;

export const rejectRefundSchema = z.object({
  refundId: z.string().uuid('Refund ID must be a valid UUID'),
  notes: z.string().max(500).optional(),
});

export type RejectRefundInput = z.infer<typeof rejectRefundSchema>;

// ============================================================================
// Payment Reconciliation Schemas
// ============================================================================

export const createReconciliationSchema = z.object({
  paymentId: z.string().uuid('Payment ID must be a valid UUID'),
  notes: z.string().max(500).optional(),
  verificationMethod: z.enum(VERIFICATION_METHODS).optional(),
});

export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;

export const updateReconciliationSchema = z.object({
  status: z.enum(RECONCILIATION_STATUSES),
  reconciliedBy: z.string().uuid('Reconciler ID must be a valid UUID').optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateReconciliationInput = z.infer<typeof updateReconciliationSchema>;

export const rejectReconciliationSchema = z.object({
  reconciliationId: z.string().uuid('Reconciliation ID must be a valid UUID'),
  notes: z.string().max(500).optional(),
});

export type RejectReconciliationInput = z.infer<typeof rejectReconciliationSchema>;

// ============================================================================
// POS Payment Detail Schemas
// ============================================================================

export const createPOSPaymentDetailSchema = z.object({
  transactionId: z.string().uuid('Transaction ID must be a valid UUID'),
  paymentMethod: z.string().min(1).max(50),
  amount: z.number().positive('Amount must be a positive number'),
  referenceNumber: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  sequenceNumber: z.number().int().positive().optional(),
  transactionFee: z.number().min(0).optional(),
  netAmount: z.number().optional(),
  
  // Card
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().max(50).optional(),
  authorizationId: z.string().max(100).optional(),
  
  // Digital wallet
  walletProvider: z.string().max(50).optional(),
  walletTransactionId: z.string().max(100).optional(),
  
  // Bank
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(),
  
  // UPI
  upiId: z.string().email().optional(),
  
  // Cheque
  chequeNumber: z.string().max(50).optional(),
  chequeDate: z.coerce.date().optional(),
  chequeBank: z.string().max(100).optional(),
  chequeStatus: z.string().max(50).optional(),
});

export type CreatePOSPaymentDetailInput = z.infer<typeof createPOSPaymentDetailSchema>;

// ============================================================================
// Split Payment Schema
// ============================================================================

export const splitPaymentSchema = z.object({
  paymentDetails: z.array(createPOSPaymentDetailSchema).min(1, 'At least one payment method required'),
  totalAmount: z.number().positive('Total amount must be a positive number'),
  notes: z.string().max(500).optional(),
});

export type SplitPaymentInput = z.infer<typeof splitPaymentSchema>;
