// lib/validations/order-payment.schema.ts

import { z } from 'zod';

export const createOrderPaymentSchema = z.object({
  salesOrderId: z.string().uuid('Sales Order ID must be a valid UUID'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: z.coerce.date().default(() => new Date()),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'DIGITAL_WALLET', 'CREDIT', 'DEBIT', 'MOBILE_WALLET']),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateOrderPaymentInput = z.infer<typeof createOrderPaymentSchema>;

export const orderPaymentFilterSchema = z.object({
  salesOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  paymentMethod: z.string().optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type OrderPaymentFiltersInput = z.infer<typeof orderPaymentFilterSchema>;
