// lib/validations/sales-order.schema.ts

import { z } from 'zod';

const salesOrderItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().positive('Unit price must be a positive number').optional(),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  orderDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED']).optional().default('DRAFT'),
  items: z.array(salesOrderItemSchema).min(1, 'Sales order must have at least one item'),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;

export const salesOrderFilterSchema = z.object({
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type SalesOrderFiltersInput = z.infer<typeof salesOrderFilterSchema>;

export const updateSalesOrderSchema = z.object({
    orderDate: z.coerce.date().optional(),
    status: z.enum(['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).optional(),
    items: z.object({
        update: z.array(z.object({
            id: z.string().uuid(),
            quantity: z.number().int().positive().optional(),
            unitPrice: z.number().positive().optional(),
            discount: z.number().min(0).optional(),
        })).optional(),
        create: z.array(salesOrderItemSchema).optional(),
        delete: z.array(z.string().uuid()).optional(),
    }).optional(),
    // Payment fields (optional, only required when status is PAID or PARTIALLY_PAID)
    payment: z.object({
        amount: z.number().positive('Payment amount must be positive'),
        paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'DIGITAL_WALLET', 'CREDIT', 'DEBIT', 'MOBILE_WALLET']),
        paymentDate: z.coerce.date().optional(),
        notes: z.string().optional(),
    }).optional(),
}).partial();

export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;

// Schema for form editing (includes all statuses and payment fields)
export const editSalesOrderFormSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  orderDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']),
  items: z.array(salesOrderItemSchema).min(1, 'Sales order must have at least one item'),
  // Payment fields for form
  paymentAmount: z.number().positive().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'DIGITAL_WALLET', 'CREDIT', 'DEBIT', 'MOBILE_WALLET']).optional(),
  paymentDate: z.coerce.date().optional(),
  paymentNotes: z.string().optional(),
});

export type EditSalesOrderFormInput = z.infer<typeof editSalesOrderFormSchema>;
