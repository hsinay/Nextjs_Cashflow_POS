// lib/validations/category.schema.ts

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  parentCategoryId: z
    .string()
    .uuid('Invalid parent category ID')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
