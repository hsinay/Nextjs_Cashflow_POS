/**
 * Payment Types - Comprehensive type definitions for payment processing system
 */

import { Customer } from './customer.types';
import { Supplier } from './supplier.types';

// ============================================================================
// Enums
// ============================================================================

// Payment Method - Concrete methods (used for individual Payment records)
export const CONCRETE_PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'DIGITAL_WALLET', 'CREDIT', 'DEBIT', 'MOBILE_WALLET'] as const;
export type ConcretePaymentMethod = typeof CONCRETE_PAYMENT_METHODS[number];

// Payment Method - All methods including MIXED (used for Transaction records)
export const PAYMENT_METHODS = [...CONCRETE_PAYMENT_METHODS, 'MIXED'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Payer Type
export const PAYER_TYPES = ['CUSTOMER', 'SUPPLIER'] as const;
export type PayerType = typeof PAYER_TYPES[number];

// Payment Status
export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

// Card Type
export const CARD_TYPES = ['CREDIT', 'DEBIT', 'OTHER'] as const;
export type CardType = typeof CARD_TYPES[number];

// Card Brand
export const CARD_BRANDS = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'DINERS'] as const;
export type CardBrand = typeof CARD_BRANDS[number];

// Wallet Provider
export const WALLET_PROVIDERS = ['APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL', 'SQUARE_CASH', 'VENMO', 'ALIPAY', 'WECHAT_PAY'] as const;
export type WalletProvider = typeof WALLET_PROVIDERS[number];

// Cheque Status
export const CHEQUE_STATUSES = ['PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED'] as const;
export type ChequeStatus = typeof CHEQUE_STATUSES[number];

// Refund Status
export const REFUND_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED'] as const;
export type RefundStatus = typeof REFUND_STATUSES[number];

// Refund Method
export const REFUND_METHODS = ['ORIGINAL_PAYMENT', 'CASH', 'STORE_CREDIT', 'CHECK', 'BANK_TRANSFER'] as const;
export type RefundMethod = typeof REFUND_METHODS[number];

// Reconciliation Status
export const RECONCILIATION_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] as const;
export type ReconciliationStatus = typeof RECONCILIATION_STATUSES[number];

// Verification Method
export const VERIFICATION_METHODS = ['MANUAL', 'AUTOMATED', 'BANK_FEED'] as const;
export type VerificationMethod = typeof VERIFICATION_METHODS[number];

// ============================================================================
// Payment Interfaces
// ============================================================================

export interface Payment {
  id: string;
  payerId: string;
  payerType: PayerType;
  paymentDate: Date;
  amount: number;
  paymentMethod: ConcretePaymentMethod;
  referenceOrderId: string | null;
  paymentInsights: string | null;
  referenceNumber: string | null;
  notes: string | null;
  status: PaymentStatus;
  transactionFee: number;
  netAmount: number;
  currency: string;
  ipAddress: string | null;
  userAgent: string | null;
  
  // Card details
  cardLast4: string | null;
  cardBrand: CardBrand | null;
  cardType: CardType | null;
  
  // Digital wallet
  walletProvider: WalletProvider | null;
  walletIdentifier: string | null;
  
  // Bank transfer
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  
  // UPI
  upiId: string | null;
  
  // Cheque
  chequeNumber: string | null;
  chequeDate: Date | null;
  chequeBank: string | null;
  chequeStatus: ChequeStatus | null;
  
  // Reconciliation
  isReconciled: boolean;
  reconciledAt: Date | null;
  reconciledBy: string | null;
  
  // Metadata
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  customer?: Customer | null;
  supplier?: Supplier | null;
}

export interface CreatePaymentInput {
  payerId: string;
  payerType: PayerType;
  paymentDate?: Date;
  amount: number;
  paymentMethod: ConcretePaymentMethod;
  referenceOrderId?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  status?: PaymentStatus;
  transactionFee?: number;
  currency?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Card details
  cardLast4?: string;
  cardBrand?: CardBrand;
  cardType?: CardType;
  
  // Digital wallet
  walletProvider?: WalletProvider;
  walletIdentifier?: string;
  
  // Bank transfer
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  routingNumber?: string;
  
  // UPI
  upiId?: string;
  
  // Cheque
  chequeNumber?: string;
  chequeDate?: Date;
  chequeBank?: string;
  chequeStatus?: ChequeStatus;
}

export interface UpdatePaymentInput {
  paymentDate?: Date;
  amount?: number;
  paymentMethod?: ConcretePaymentMethod;
  referenceOrderId?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  status?: PaymentStatus;
  isReconciled?: boolean;
  reconciledBy?: string;
  metadata?: Record<string, any>;
}

export interface PaymentFilters {
  search?: string;
  payerType?: PayerType;
  payerId?: string;
  paymentMethod?: ConcretePaymentMethod;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  referenceOrderId?: string;
  isReconciled?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedPayments {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// POS Payment Detail Interfaces
// ============================================================================

export interface POSPaymentDetail {
  id: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  referenceNumber: string | null;
  status: string;
  notes: string | null;
  sequenceNumber: number;
  transactionFee: number;
  netAmount: number;
  
  // Card
  cardLast4: string | null;
  cardBrand: string | null;
  authorizationId: string | null;
  
  // Digital wallet
  walletProvider: string | null;
  walletTransactionId: string | null;
  
  // Bank
  bankName: string | null;
  accountNumber: string | null;
  
  // UPI
  upiId: string | null;
  
  // Cheque
  chequeNumber: string | null;
  chequeDate: Date | null;
  chequeBank: string | null;
  chequeStatus: string | null;
  
  metadata: Record<string, any> | null;
  processedAt: Date | null;
  processedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePOSPaymentDetailInput {
  transactionId: string;
  paymentMethod: string;
  amount: number;
  referenceNumber?: string;
  status?: string;
  notes?: string;
  sequenceNumber?: number;
  transactionFee?: number;
  netAmount?: number;
  
  // Card
  cardLast4?: string;
  cardBrand?: string;
  authorizationId?: string;
  
  // Digital wallet
  walletProvider?: string;
  walletTransactionId?: string;
  
  // Bank
  bankName?: string;
  accountNumber?: string;
  
  // UPI
  upiId?: string;
  
  // Cheque
  chequeNumber?: string;
  chequeDate?: Date;
  chequeBank?: string;
  chequeStatus?: string;
}

// ============================================================================
// Payment Refund Interfaces
// ============================================================================

export interface PaymentRefund {
  id: string;
  paymentId: string;
  transactionId: string | null;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  status: RefundStatus;
  refundMethod: RefundMethod | null;
  approvedBy: string | null;
  processedBy: string | null;
  approvedAt: Date | null;
  processedAt: Date | null;
  notes: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRefundInput {
  paymentId: string;
  transactionId?: string;
  refundAmount: number;
  reason: string;
  refundMethod?: RefundMethod;
  notes?: string;
}

export interface ApproveRefundInput {
  refundId: string;
  approvedBy: string;
  notes?: string;
}

export interface ProcessRefundInput {
  refundId: string;
  processedBy: string;
  notes?: string;
}

// ============================================================================
// Payment Reconciliation Interfaces
// ============================================================================

export interface PaymentReconciliation {
  id: string;
  paymentId: string;
  reconciliationDate: Date;
  status: ReconciliationStatus;
  notes: string | null;
  reconciliedBy: string | null;
  verificationMethod: VerificationMethod | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReconciliationInput {
  paymentId: string;
  notes?: string;
  verificationMethod?: VerificationMethod;
}

export interface UpdateReconciliationInput {
  status: ReconciliationStatus;
  reconciliedBy?: string;
  notes?: string;
}

// ============================================================================
// Split Payment Interfaces
// ============================================================================

export interface SplitPayment {
  paymentDetails: CreatePOSPaymentDetailInput[];
  totalAmount: number;
  notes?: string;
}

// ============================================================================
// Payment Statistics & Summary
// ============================================================================

export interface PaymentStats {
  totalAmount: number;
  totalFees: number;
  totalNetAmount: number;
  paymentMethodBreakdown: Record<PaymentMethod, number>;
  averageTransactionSize: number;
  successRate: number;
  failureCount: number;
}

export interface PaymentSummary {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  paymentMethodSummary: Record<PaymentMethod, {
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  reconciledAmount: number;
  pendingAmount: number;
}
