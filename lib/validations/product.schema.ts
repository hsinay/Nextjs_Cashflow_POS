// lib/validations/product.schema.ts

import { z } from 'zod';

/**
 * Product name: 1-255 characters, required, trimmed
 */
const productNameSchema = z
  .string()
  .min(1, 'Product name is required')
  .max(255, 'Product name must be at most 255 characters')
  .transform((val) => val.trim());

/**
 * Product description: optional, max 1000 characters
 */
const descriptionSchema = z
  .string()
  .max(1000, 'Description must be at most 1000 characters')
  .optional()
  .nullable();

/**
 * SKU: optional, alphanumeric with dash/underscore, 3-50 characters
 */
const skuSchema = z
  .string()
  .regex(
    /^[A-Z0-9_-]{3,50}$/,
    'SKU must be 3-50 characters, alphanumeric, dash or underscore only'
  )
  .transform((val) => val.toUpperCase())
  .optional();

/**
 * Barcode: optional, alphanumeric, 8-50 characters
 */
const barcodeSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{8,50}$/,
    'Barcode must be 8-50 alphanumeric characters'
  )
  .transform((val) => val.toUpperCase())
  .optional()
  .nullable();

/**
 * Image URL: optional, valid URL format
 */
const imageUrlSchema = z
  .string()
  .url('Image URL must be a valid URL')
  .optional()
  .nullable();

/**
 * Price: required, positive number, max 2 decimal places
 */
const priceSchema = z
  .number()
  .positive('Price must be a positive number')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

/**
 * Cost price: optional, positive number, max 2 decimal places
 */
const costPriceSchema = z
  .number()
  .positive('Cost price must be a positive number')
  .multipleOf(0.01, 'Cost price must have at most 2 decimal places')
  .optional()
  .nullable();

/**
 * Stock quantity: required, non-negative integer
 */
const stockQuantitySchema = z
  .number()
  .int('Stock quantity must be an integer')
  .min(0, 'Stock quantity cannot be negative');

/**
 * Reorder level: optional, non-negative integer
 */
const reorderLevelSchema = z
  .number()
  .int('Reorder level must be an integer')
  .min(0, 'Reorder level cannot be negative')
  .optional()
  .nullable();

/**
 * Tax rate: optional, 0-100 percentage
 */
const taxRateSchema = z
  .number()
  .min(0, 'Tax rate cannot be negative')
  .max(100, 'Tax rate cannot exceed 100%')
  .multipleOf(0.01, 'Tax rate must have at most 2 decimal places')
  .optional()
  .nullable();

/**
 * Category ID: required, valid UUID
 */
const categoryIdSchema = z
  .string()
  .uuid('Category ID must be a valid UUID');

/**
 * AI Tags: optional, array of strings
 */
const aiTagsSchema = z
  .array(z.string().trim())
  .optional()
  .default([]);

/**
 * Create product schema
 */
export const createProductSchema = z
  .object({
    name: productNameSchema,
    description: descriptionSchema,
    sku: skuSchema,
    barcode: barcodeSchema,
    imageUrl: imageUrlSchema,
    price: priceSchema,
    costPrice: costPriceSchema,
    stockQuantity: stockQuantitySchema,
    reorderLevel: reorderLevelSchema,
    taxRate: taxRateSchema,
    isActive: z.boolean().optional().default(true),
    categoryId: categoryIdSchema,
    aiTags: aiTagsSchema,
  })
  .refine(
    (data) => !data.costPrice || data.costPrice <= data.price,
    {
      message: 'Cost price must be less than or equal to selling price',
      path: ['costPrice'],
    }
  )
  .refine(
    (data) => !data.reorderLevel || data.reorderLevel < data.stockQuantity,
    {
      message: 'Reorder level should be less than current stock (warning only)',
      path: ['reorderLevel'],
    }
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Update product schema (all fields optional)
 */
export const updateProductSchema = z
  .object({
    name: productNameSchema.optional(),
    description: descriptionSchema,
    sku: skuSchema,
    barcode: barcodeSchema,
    imageUrl: imageUrlSchema,
    price: priceSchema.optional(),
    costPrice: costPriceSchema,
    stockQuantity: stockQuantitySchema.optional(),
    reorderLevel: reorderLevelSchema,
    taxRate: taxRateSchema,
    isActive: z.boolean().optional(),
    categoryId: categoryIdSchema.optional(),
    aiTags: aiTagsSchema,
  })
  .partial()
  .refine(
    (data) => !data.costPrice || !data.price || data.costPrice <= data.price,
    {
      message: 'Cost price must be less than or equal to selling price',
      path: ['costPrice'],
    }
  );

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Product filter schema
 */
export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  lowStock: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type ProductFiltersInput = z.infer<typeof productFilterSchema>;
