import { z } from 'zod';

// Create POS Session
export const createPOSSessionSchema = z.object({
  terminalId: z.string().optional(),
  openingCashAmount: z.coerce.number().positive('Opening cash must be positive'),
  notes: z.string().max(500).optional(),
});

export type CreatePOSSessionInput = z.infer<typeof createPOSSessionSchema>;

// Close POS Session
export const closePOSSessionSchema = z.object({
  closingCashAmount: z.coerce.number().nonnegative('Closing cash must be non-negative'),
  notes: z.string().max(500).optional(),
});

export type ClosePOSSessionInput = z.infer<typeof closePOSSessionSchema>;

// List sessions query
export const listPOSSessionsSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'SUSPENDED']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type ListPOSSessionsInput = z.infer<typeof listPOSSessionsSchema>;

// Update transaction totals
export const updateSessionTotalsSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'DIGITAL_WALLET', 'MOBILE_WALLET', 'CREDIT']),
  amount: z.coerce.number().positive(),
});

export type UpdateSessionTotalsInput = z.infer<typeof updateSessionTotalsSchema>;
