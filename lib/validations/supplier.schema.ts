// lib/validations/supplier.schema.ts

import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().optional(),
  contactNumber: z.string().regex(/^[+\d()\-\.\s]*$/).min(7).max(30).optional(),
  address: z.string().max(500).optional(),
  creditLimit: z.preprocess((val) => {
    if (typeof val === 'string') {
      const n = parseFloat(val);
      return isNaN(n) ? val : n;
    }
    return val;
  }, z.number().min(0).max(99999999.99)).optional().default(0),
});

export const updateSupplierSchema = createSupplierSchema.partial().refine(
  (data) => data.creditLimit === undefined || data.creditLimit >= 0,
  { message: 'Credit limit must be positive', path: ['creditLimit'] }
);

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
