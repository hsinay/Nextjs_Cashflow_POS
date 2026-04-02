import { z } from 'zod';

// Receipt validation
export const receiptItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const storeInfoSchema = z.object({
  storeName: z.string().min(1),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  storeEmail: z.string().email().optional(),
  gstNumber: z.string().optional(),
  termsUrl: z.string().url().optional(),
});

export const receiptSchema = z.object({
  transactionId: z.string().uuid(),
  format: z.enum(['THERMAL', 'A4', 'EMAIL', 'SMS']),
  items: z.array(receiptItemSchema),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  storeInfo: storeInfoSchema,
});

export type ReceiptInput = z.infer<typeof receiptSchema>;

// Refund validation
export const refundRequestSchema = z.object({
  transactionId: z.string().uuid(),
  refundAmount: z.number().positive(),
  reason: z.enum([
    'CUSTOMER_REQUEST',
    'DEFECTIVE_PRODUCT',
    'WRONG_ITEM',
    'DAMAGED',
    'OTHER',
  ]),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .optional(),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

export const refundApprovalSchema = z.object({
  refundId: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

export type RefundApprovalInput = z.infer<typeof refundApprovalSchema>;

// Terminal validation
export const terminalSchema = z.object({
  terminalId: z.string().min(1),
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  ipAddress: z.string().ip().optional(),
  deviceModel: z.string().optional(),
  serialNumber: z.string().optional(),
});

export type TerminalInput = z.infer<typeof terminalSchema>;

// Shift validation
export const shiftSchema = z.object({
  terminalId: z.string().uuid(),
  cashierId: z.string().uuid(),
  type: z.enum(['MORNING', 'EVENING', 'NIGHT', 'FULL_DAY']),
  openingBalance: z.number().nonnegative(),
  notes: z.string().optional(),
});

export type ShiftInput = z.infer<typeof shiftSchema>;

export const shiftCloseSchema = z.object({
  shiftId: z.string().uuid(),
  closingBalance: z.number().nonnegative(),
  notes: z.string().optional(),
});

export type ShiftCloseInput = z.infer<typeof shiftCloseSchema>;

// Terminal configuration validation
export const terminalConfigSchema = z.object({
  terminalId: z.string().uuid(),
  receiptFormat: z.enum(['THERMAL', 'A4', 'EMAIL', 'SMS']),
  printReceipt: z.boolean(),
  emailReceipt: z.boolean(),
  requireCustomerInfo: z.boolean(),
  autoLogoutTimeout: z.number().positive(),
  allowOfflineMode: z.boolean(),
  currencySymbol: z.string(),
  taxRate: z.number().min(0).max(100),
  serviceChargeRate: z.number().min(0).max(100),
});

export type TerminalConfigInput = z.infer<typeof terminalConfigSchema>;
