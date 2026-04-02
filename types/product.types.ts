// types/product.types.ts

import { Category } from './category.types';

export type { Category } from './category.types';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  price: number; // Decimal from Prisma, converted to number
  costPrice: number | null;
  stockQuantity: number;
  reorderLevel: number | null;
  taxRate: number | null;
  isActive: boolean;
  categoryId: string;
  aiTags: string[];
  visionEmbedding: any | null;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  reorderLevel?: number;
  taxRate?: number;
  isActive?: boolean;
  categoryId: string;
  aiTags?: string[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  sku?: string;
  barcode?: string | null;
  imageUrl?: string | null;
  price?: number;
  costPrice?: number | null;
  stockQuantity?: number;
  reorderLevel?: number | null;
  taxRate?: number | null;
  isActive?: boolean;
  categoryId?: string;
  aiTags?: string[];
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductListItem extends Product {
  // For list views
  profitMargin?: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
}
