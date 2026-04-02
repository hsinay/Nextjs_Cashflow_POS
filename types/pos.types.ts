// types/pos.types.ts

import { User } from './auth.types'; // Assuming User type is in auth.types
import { Customer } from './customer.types';
import { ConcretePaymentMethod } from './payment.types';
import { Product } from './product.types';

export const POS_SESSION_STATUSES = ['OPEN', 'CLOSED', 'SUSPENDED'] as const;
export type POSSessionStatus = typeof POS_SESSION_STATUSES[number];
export const TRANSACTION_PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CHEQUE', 'CREDIT', 'DEBIT', 'MOBILE_WALLET', 'MIXED'] as const;
export type TransactionPaymentMethod = typeof TRANSACTION_PAYMENT_METHODS[number];
export const TRANSACTION_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'] as const;
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];
export const POS_PAYMENT_STATUSES = ['PENDING', 'PARTIALLY_PAID', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;
export type POSPaymentStatus = typeof POS_PAYMENT_STATUSES[number];


export interface POSSession {
    id: string;
    cashierId: string;
    terminalId: string | null;
    status: POSSessionStatus;
    openingCashAmount: number;
    closingCashAmount: number | null;
    totalSalesAmount: number;
    totalCashReceived: number;
    totalCardReceived: number;
    totalDigitalReceived: number;
    totalTransactions: number;
    cashVariance: number;
    openedAt: Date;
    closedAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    cashier?: User;
    transactions?: Transaction[];
}

export interface TransactionItem {
    id: string;
    transactionId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountApplied: number;
    taxRate: number | null;
    taxAmount: number;
    createdAt: Date;
    updatedAt: Date;
    product?: Product;
}

export interface POSPaymentDetail {
    id: string;
    transactionId: string;
    paymentMethod: TransactionPaymentMethod;
    amount: number;
    referenceNumber: string | null;
    status: POSPaymentStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaction {
    id: string;
    transactionNumber: string;
    customerId: string | null;
    cashierId: string;
    sessionId: string | null;
    totalAmount: number;
    taxAmount: number;
    discountAmount: number;
    paymentMethod: TransactionPaymentMethod;
    status: TransactionStatus;
    loyaltyPointsEarned: number;
    loyaltyPointsRedeemed: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: Customer | null;
    cashier?: User;
    session?: POSSession | null;
    items?: TransactionItem[];
    paymentDetails?: POSPaymentDetail[];
}

export interface CreatePOSSessionInput {
    cashierId: string;
    terminalId?: string | null;
    openingCashAmount: number;
    notes?: string | null;
}

export interface UpdatePOSSessionInput {
    status?: POSSessionStatus;
    closingCashAmount?: number;
    notes?: string | null;
}

export interface CreateTransactionItemInput {
    productId: string;
    quantity: number;
    unitPrice?: number;
    discountApplied?: number;
    taxRate?: number;
}

export interface CreateTransactionInput {
    transactionNumber: string;
    cashierId: string;
    sessionId?: string | null;
    customerId?: string | null;
    items: CreateTransactionItemInput[];
    paymentDetails: {
        paymentMethod: ConcretePaymentMethod;
        amount: number;
        referenceNumber?: string | null;
        transactionFee?: number;
        notes?: string | null;
        cardLast4?: string | null;
        cardBrand?: string | null;
        authorizationId?: string | null;
        walletProvider?: string | null;
        walletTransactionId?: string | null;
        upiId?: string | null;
        chequeNumber?: string | null;
        chequeDate?: string | null;
        chequeBank?: string | null;
    }[];
    notes?: string | null;
}

export interface PaginatedPOSSessions {
    sessions: POSSession[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface PaginatedTransactions {
    transactions: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
