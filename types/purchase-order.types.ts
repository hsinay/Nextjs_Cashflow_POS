// types/purchase-order.types.ts
import { Product } from './product.types';
import { Supplier } from './supplier.types';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
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

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  orderDate: Date;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'OVERPAID';
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: Date;
  updatedAt: Date;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  orderDate?: Date;
  status?: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  items: CreatePurchaseOrderItemInput[];
}

export interface UpdatePurchaseOrderInput {
  orderDate?: Date;
  status?: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  items?: {
    update?: { id: string; quantity?: number; unitPrice?: number; discount?: number }[];
    create?: CreatePurchaseOrderItemInput[];
    delete?: string[];
  };
}

export interface PurchaseOrderFilters {
  search?: string;
  supplierId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPurchaseOrders {
  orders: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PurchaseOrderPayment {
  id: string;
  purchaseOrderId: string;
  paymentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  status: string;
  notes?: string;
}

export interface POPaymentStatusInfo {
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'OVERPAID';
  paidAmount: number;
  balanceAmount: number;
  totalAmount: number;
}

