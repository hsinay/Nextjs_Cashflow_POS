// lib/validations/purchase-order.schema.ts

import { z } from 'zod';

const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().positive('Unit price must be a positive number').optional(),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Supplier ID must be a valid UUID'),
  orderDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional().default('DRAFT'),
  items: z.array(purchaseOrderItemSchema).min(1, 'Purchase order must have at least one item'),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const purchaseOrderFilterSchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type PurchaseOrderFiltersInput = z.infer<typeof purchaseOrderFilterSchema>;

export const updatePurchaseOrderSchema = z.object({
    orderDate: z.coerce.date().optional(),
    status: z.enum(['DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
    items: z.object({
        update: z.array(z.object({
            id: z.string().uuid(),
            quantity: z.number().int().positive().optional(),
            unitPrice: z.number().positive().optional(),
            discount: z.number().min(0).optional(),
        })).optional(),
        create: z.array(purchaseOrderItemSchema).optional(),
        delete: z.array(z.string().uuid()).optional(),
    }).optional(),
}).partial();

export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;

// ============================================
// PHASE 2: Payment Tracking Schemas
// ============================================

export const linkPaymentToPOSchema = z.object({
  paymentId: z.string().uuid('Payment ID must be a valid UUID'),
});

export type LinkPaymentToPOInput = z.infer<typeof linkPaymentToPOSchema>;

export const unlinkPaymentFromPOSchema = z.object({
  paymentId: z.string().uuid('Payment ID must be a valid UUID'),
});

export type UnlinkPaymentFromPOInput = z.infer<typeof unlinkPaymentFromPOSchema>;
