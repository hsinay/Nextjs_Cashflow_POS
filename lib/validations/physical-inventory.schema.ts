import { z } from 'zod';

export const createPhysicalInventorySchema = z.object({
  referenceNumber: z.string().min(1, 'Reference number is required'),
  countDate: z.coerce.date(),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  countMethod: z.enum(['FULL_COUNT', 'CYCLE_COUNT', 'SPOT_CHECK']),
  notes: z.string().optional().nullable(),
});

export type CreatePhysicalInventoryInput = z.infer<typeof createPhysicalInventorySchema>;

export const updatePhysicalInventorySchema = z.object({
  referenceNumber: z.string().min(1).optional(),
  countDate: z.coerce.date().optional(),
  locationId: z.string().uuid().optional(),
  countMethod: z.enum(['FULL_COUNT', 'CYCLE_COUNT', 'SPOT_CHECK']).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'DONE']).optional(),
});

export type UpdatePhysicalInventoryInput = z.infer<typeof updatePhysicalInventorySchema>;

export const addCountLineSchema = z.object({
  physicalInventoryId: z.string().uuid('Physical Inventory ID must be a valid UUID'),
  productId: z.string().uuid('Product ID must be a valid UUID'),
  physicalQuantity: z.number().nonnegative('Physical quantity must be non-negative'),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  countedBy: z.string().optional().nullable(),
});

export type AddCountLineInput = z.infer<typeof addCountLineSchema>;

export const updateCountLineSchema = z.object({
  physicalQuantity: z.number().nonnegative().optional(),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  countedBy: z.string().optional().nullable(),
});

export type UpdateCountLineInput = z.infer<typeof updateCountLineSchema>;
