// types/sales-order.types.ts
import { Customer } from './customer.types';
import { Product } from './product.types';

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  orderDate: Date;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  balanceAmount: number;
  paidAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  aiUpsellSuggestions: string[];
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  items: SalesOrderItem[];
}

export interface CreateSalesOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number; // Optional, can be fetched from product
  discount?: number;
}

export interface CreateSalesOrderInput {
  customerId: string;
  orderDate?: Date;
  status?: 'DRAFT' | 'CONFIRMED';
  items: CreateSalesOrderItemInput[];
}

export interface UpdateSalesOrderInput {
  orderDate?: Date;
  status?: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  items?: {
    update?: { id: string; quantity?: number; unitPrice?: number; discount?: number }[];
    create?: CreateSalesOrderItemInput[];
    delete?: string[];
  };
}

export interface SalesOrderFilters {
  search?: string;
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSalesOrders {
  orders: SalesOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrderPayment {
  id: string;
  salesOrderId: string;
  customerId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHEQUE' | 'DIGITAL_WALLET' | 'CREDIT' | 'DEBIT' | 'MOBILE_WALLET';
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  salesOrder?: SalesOrder;
  customer?: Customer;
}

export interface OrderPaymentSummary {
  orderId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  paymentCount: number;
  payments: OrderPayment[];
}

export interface CreateOrderPaymentInput {
  salesOrderId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}
