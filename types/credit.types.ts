/**
 * Credit System Type Definitions
 * Centralized types for customer credit management
 */

import {
  CreditStatus,
  PaymentTerms,
  CreditTransactionType,
  CreditPaymentStatus,
  ReminderType,
  ReminderStatus,
  PaymentMethod,
} from '@prisma/client';

// ===== CUSTOMER CREDIT =====
export interface CustomerCredit {
  id: string;
  customerId: string;
  status: CreditStatus;
  totalLimit: number;
  totalUtilized: number;
  totalCreditSales: number;
  totalPayments: number;
  totalInterest: number;
  totalRefunds: number;
  outstandingAmount: number;
  overdueDays: number;
  lastPaymentDate: Date | null;
  nextDueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerCreditInput {
  customerId: string;
  totalLimit: number;
}

export interface UpdateCustomerCreditInput {
  totalLimit?: number;
  status?: CreditStatus;
}

// ===== CREDIT TRANSACTION =====
export interface CreditTransaction {
  id: string;
  customerCreditId: string;
  customerId: string;
  createdByUserId: string;
  transactionType: CreditTransactionType;
  description?: string;
  amount: number;
  transactionDate: Date;
  dueDate: Date;
  paymentTerms: PaymentTerms;
  paidAmount: number;
  balanceAmount: number;
  isFullyPaid: boolean;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreditTransactionInput {
  customerId: string;
  amount: number;
  description?: string;
  paymentTerms?: PaymentTerms;
  dueDate?: Date;
  reference?: string;
  notes?: string;
}

export interface UpdateCreditTransactionInput {
  amount?: number;
  description?: string;
  paymentTerms?: PaymentTerms;
  dueDate?: Date;
  reference?: string;
  notes?: string;
}

// ===== CREDIT PAYMENT =====
export interface CreditPayment {
  id: string;
  customerCreditId: string;
  customerId: string;
  recordedByUserId: string;
  bulkBatchId?: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  status: CreditPaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreditPaymentInput {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  allocations?: PaymentAllocationInput[];
}

export interface UpdateCreditPaymentInput {
  amount?: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  status?: CreditPaymentStatus;
}

// ===== PAYMENT ALLOCATION =====
export interface PaymentAllocation {
  creditPaymentId: string;
  creditTransactionId: string;
  allocatedAmount: number;
  createdAt: Date;
}

export interface PaymentAllocationInput {
  creditTransactionId: string;
  allocatedAmount: number;
}

// ===== INTEREST ENTRY =====
export interface InterestEntry {
  id: string;
  customerCreditId: string;
  customerId: string;
  createdByUserId: string;
  creditTransactionId?: string;
  amount: number;
  rate: number;
  applicableRate: number;
  period: number;
  description?: string;
  calculatedDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInterestInput {
  customerId: string;
  creditTransactionId?: string;
  amount: number;
  rate: number;
  period: number;
  description?: string;
  notes?: string;
}

// ===== CREDIT REFUND =====
export interface CreditRefund {
  id: string;
  customerId: string;
  approvedByUserId: string;
  customerCreditId: string;
  creditPaymentId?: string;
  amount: number;
  reason: string;
  refundDate: Date;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreditRefundInput {
  customerId: string;
  amount: number;
  reason: string;
  creditPaymentId?: string;
  reference?: string;
  notes?: string;
}

// ===== PAYMENT REMINDER =====
export interface PaymentReminder {
  id: string;
  customerId: string;
  customerCreditId: string;
  createdByUserId: string;
  reminderType: ReminderType;
  status: ReminderStatus;
  scheduledDate: Date;
  sentDate?: Date;
  acknowledgedDate?: Date;
  channel?: string;
  message?: string;
  deliveryStatus?: string;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReminderInput {
  customerId: string;
  reminderType: ReminderType;
  scheduledDate: Date;
  channel?: string;
  message?: string;
  notes?: string;
}

export interface UpdateReminderInput {
  status?: ReminderStatus;
  sentDate?: Date;
  acknowledgedDate?: Date;
  deliveryStatus?: string;
  failureReason?: string;
}

// ===== BULK PAYMENT BATCH =====
export interface BulkPaymentBatch {
  id: string;
  batchNumber: string;
  totalCustomers: number;
  totalAmount: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  batchDate: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBulkPaymentBatchInput {
  totalCustomers: number;
  totalAmount: number;
  notes?: string;
}

// ===== AGGREGATE/COMPUTED TYPES =====
export interface CreditAccountSummary extends CustomerCredit {
  customer?: {
    id: string;
    name: string;
    email?: string;
    contactNumber?: string;
  };
  pending: CreditTransaction[];
  overdue: CreditTransaction[];
  recentPayments: CreditPayment[];
  interestDue: number;
}

export interface CreditHealthMetrics {
  customerId: string;
  utilizationRatio: number; // outstanding / limit
  overdueDays: number;
  totalOverdueAmount: number;
  averagePaymentDelay: number; // in days
  defaultRiskScore: number; // 0-100
  recommendedAction: 'ACTIVE' | 'MONITOR' | 'REVIEW' | 'SUSPEND';
}
