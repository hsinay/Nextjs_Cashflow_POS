// lib/validations/customer.schema.ts

import { CustomerSegment } from '@/types/customer.types';
import { z } from 'zod';

// Accept number or decimal string for creditLimit, coerce strings to numbers
const creditLimitSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
  }
  return val;
}, z.number().min(0).max(99999999.99)).optional().default(0);

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().optional(),
  contactNumber: z.string().regex(/^[+\d()\-\.\s]*$/).min(7).max(30).optional(),
  billingAddress: z.string().max(500).optional(),
  shippingAddress: z.string().max(500).optional(),
  creditLimit: creditLimitSchema,
  aiSegment: z.nativeEnum(CustomerSegment).optional().default(CustomerSegment.NEW),
});

export const updateCustomerSchema = createCustomerSchema.partial().refine(
  (data) => data.creditLimit === undefined || data.creditLimit >= 0,
  { message: 'Credit limit must be positive', path: ['creditLimit'] }
);

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
