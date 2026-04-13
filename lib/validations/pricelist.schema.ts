import { z } from 'zod';

// ============================================
// Pricelist Schemas
// ============================================

const basePricelistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const createPricelistSchema = basePricelistSchema;

export const updatePricelistSchema = basePricelistSchema.partial();

export type CreatePricelistInput = z.infer<typeof createPricelistSchema>;
export type UpdatePricelistInput = z.infer<typeof updatePricelistSchema>;

// ============================================
// Pricelist Rule Schemas
// ============================================

/**
 * FIXED_PRICE: Represents bulk tier pricing where fixedPrice is the TOTAL for minQuantity units
 * 
 * Example:
 * - If rule is: minQuantity=3, fixedPrice=25
 * - Customer orders 3 units → pays 25 total (8.33 per unit)
 * - Customer orders 5 units → pays 41.67 total (8.33 per unit proportionally)
 * - Customer orders 6 units → pays 50 total (8.33 per unit) - still matches this tier
 * 
 * PERCENTAGE_DISCOUNT: Discount applied to base product price
 * FIXED_DISCOUNT: Fixed amount deducted per unit
 * FORMULA: Custom calculation based on cost + margin + markup
 */

export const pricecalculationTypeEnum = z.enum([
  'FIXED_PRICE',
  'PERCENTAGE_DISCOUNT',
  'FIXED_DISCOUNT',
  'FORMULA',
]);

// Simplified rule schema - Product-focused with quantity tiers
const coerceNumberOrNull = (min?: number) =>
  z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    min !== undefined
      ? z.coerce.number().min(min).nullable().optional()
      : z.coerce.number().nullable().optional()
  );

const coerceIntOrNull = (min?: number) =>
  z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.number().int().refine((v) => v === null || v >= (min ?? 0), { message: 'Invalid number' }).nullable().optional()
  );

const coerceIntWithDefault = (def: number) =>
  z.preprocess(
    (val) => (val === '' || val === undefined ? def : val),
    z.coerce.number().int().nonnegative()
  );

const basePricelistRuleSchema = z.object({
  id: z.string().optional(), // Can be UUID for existing rules, or temporary string ID like 'rule-xxx' for new rules
  appliedTo: z.enum(['PRODUCT', 'CATEGORY', 'CUSTOMER', 'ALL_PRODUCTS']).default('PRODUCT'),
  productId: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.string().uuid('Product is required').optional()
  ), // validated per appliedTo
  categoryId: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.string().uuid('Category is required').optional()
  ),
  name: z.string().min(1, 'Rule name is required').max(100, 'Rule name must be 100 characters or less').optional(),
  minQuantity: coerceIntWithDefault(1).optional(),
  maxQuantity: coerceIntOrNull(0),
  calculationType: pricecalculationTypeEnum.default('PERCENTAGE_DISCOUNT'),
  discountPercentage: coerceNumberOrNull(0),
  fixedPrice: coerceNumberOrNull(0),
  fixedDiscount: coerceNumberOrNull(0),
  formulaMargin: coerceNumberOrNull(),
  formulaMarkup: coerceNumberOrNull(0),
  isActive: z.boolean().default(true).optional(),
});

export const createPricelistRuleSchema = basePricelistRuleSchema.refine(
  (data) => {
    // Validate max quantity > min quantity if both provided
    if (data.maxQuantity !== null && data.maxQuantity !== undefined && data.minQuantity !== undefined) {
      return data.maxQuantity >= data.minQuantity;
    }
    return true;
  },
  {
    message: 'Max quantity must be greater than or equal to min quantity',
    path: ['maxQuantity'],
  }
).refine(
  (data) => {
    // Only validate calculated values if they're expected to have a value
    // Allow undefined/null values - API will validate on backend
    if (data.calculationType === 'PERCENTAGE_DISCOUNT') {
      // discountPercentage can be 0, which is valid
      return data.discountPercentage !== undefined && data.discountPercentage !== null;
    }
    if (data.calculationType === 'FIXED_PRICE') {
      // fixedPrice can be 0, check explicitly for null/undefined
      return data.fixedPrice !== undefined && data.fixedPrice !== null;
    }
    if (data.calculationType === 'FIXED_DISCOUNT') {
      // fixedDiscount can be 0, check explicitly for null/undefined
      return data.fixedDiscount !== undefined && data.fixedDiscount !== null;
    }
    if (data.calculationType === 'FORMULA') {
      // At least one of margin or markup should be defined
      return (data.formulaMargin !== undefined && data.formulaMargin !== null) || (data.formulaMarkup !== undefined && data.formulaMarkup !== null);
    }
    return true;
  },
  {
    message: 'Required value missing for selected calculation type',
    path: ['calculationType'],
  }
).refine(
  (data) => {
    if (data.appliedTo === 'PRODUCT') return !!data.productId;
    if (data.appliedTo === 'CATEGORY') return !!data.categoryId;
    return true;
  },
  {
    message: 'Product or Category is required for this rule target',
    path: ['appliedTo'],
  }
);

export const updatePricelistRuleSchema = basePricelistRuleSchema.partial();

export type CreatePricelistRuleInput = z.infer<typeof createPricelistRuleSchema>;
export type UpdatePricelistRuleInput = z.infer<typeof updatePricelistRuleSchema>;

// ============================================
// Price Calculation Request Schema
// ============================================

export const calculatePriceSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  pricelistId: z.string().uuid('Invalid pricelist ID').optional().nullable(),
  customerId: z.string().uuid('Invalid customer ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
});

export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;

// ============================================
// Batch Price Calculation Schema
// ============================================

export const batchCalculatePriceSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be a positive integer'),
    })
  ).min(1, 'At least one item is required'),
  customerId: z.string().uuid('Invalid customer ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
});

export type BatchCalculatePriceInput = z.infer<typeof batchCalculatePriceSchema>;

// ============================================
// Form Schemas (for UI forms with nested data)
// ============================================

// Use a completely permissive schema for the form
// Allows any rule structure while editing, full validation happens in onSubmit
export const pricelistFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  rules: z.array(z.record(z.any())).optional(), // Accept any rule structure - validate in onSubmit
});

export type PricelistFormData = z.infer<typeof pricelistFormSchema>;
