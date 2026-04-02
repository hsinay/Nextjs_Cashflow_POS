// lib/validations/inventory.schema.ts

import { z } from 'zod';

export const createInventoryTransactionSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  transactionType: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'POS_SALE']),
  quantity: z.number().int().nonnegative('Quantity must be a non-negative integer'),
  transactionDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  unitCost: z.number().positive('Unit cost must be a positive number').optional(),
  referenceId: z.string().optional(),
});

export type CreateInventoryTransactionInput = z.infer<typeof createInventoryTransactionSchema>;

export const inventoryTransactionFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  transactionType: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'POS_SALE']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type InventoryTransactionFiltersInput = z.infer<typeof inventoryTransactionFilterSchema>;
