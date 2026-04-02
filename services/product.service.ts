// services/product.service.ts

import { prisma } from '@/lib/prisma';
import { PaginatedProducts, Product, ProductFilters } from '@/types/product.types';
import { Prisma } from '@prisma/client';

/**
 * Convert Decimal to number for JSON serialization
 */
function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object' && '_bsontype' in value) {
    // Prisma Decimal
    return parseFloat((value as { toString(): string }).toString());
  }
  return value;
}

/**
 * Generate SKU if not provided
 * Format: PROD-{categoryCode}-{timestamp}
 */
async function generateSku(categoryId: string): Promise<string> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  const categoryCode = category?.name.substring(0, 4).toUpperCase() || 'GEN';
  const timestamp = Date.now().toString().slice(-6);
  return `PROD-${categoryCode}-${timestamp}`;
}

/**
 * Get all products with filtering, searching, and pagination
 */
export async function getAllProducts(filters: ProductFilters): Promise<PaginatedProducts> {
  const {
    search = '',
    categoryId,
    isActive = true,
    lowStock = false,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive: isActive !== undefined ? isActive : true,
    ...(categoryId && { categoryId }),
  };

  // Add search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.product.count({ where });

  // Build additional filters for low stock
  let products = await prisma.product.findMany({
    where,
    include: { category: true },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  // Filter low stock items if requested
  if (lowStock) {
    products = products.filter(
      (p) => p.reorderLevel && p.stockQuantity <= p.reorderLevel
    );
  }

  // Convert to Product type and add calculated fields
  const convertedProducts: Product[] = products.map((p) => ({
    ...p,
    price: convertToNumber(p.price),
    costPrice: p.costPrice ? convertToNumber(p.costPrice) : null,
    taxRate: p.taxRate ? convertToNumber(p.taxRate) : null,
  }));

  const pages = Math.ceil(total / limit);

  return {
    products: convertedProducts,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}

/**
 * Get single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) return null;

  return {
    ...product,
    price: convertToNumber(product.price),
    costPrice: product.costPrice ? convertToNumber(product.costPrice) : null,
    taxRate: product.taxRate ? convertToNumber(product.taxRate) : null,
  };
}

/**
 * Create new product
 */
export async function createProduct(data: any): Promise<Product> {
  // Generate SKU if not provided
  let sku = data.sku;
  if (!sku) {
    sku = await generateSku(data.categoryId);
  }

  // Check if SKU already exists
  if (sku) {
    const existing = await prisma.product.findUnique({
      where: { sku },
    });
    if (existing) {
      throw new Error(`SKU '${sku}' is already in use`);
    }
  }

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    throw new Error(`Category with ID '${data.categoryId}' not found`);
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      sku: sku || null,
      barcode: data.barcode || null,
      imageUrl: data.imageUrl || null,
      price: new Prisma.Decimal(data.price),
      costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
      stockQuantity: data.stockQuantity || 0,
      reorderLevel: data.reorderLevel || null,
      taxRate: data.taxRate ? new Prisma.Decimal(data.taxRate) : null,
      isActive: data.isActive !== false,
      categoryId: data.categoryId,
      aiTags: data.aiTags || [],
    },
    include: { category: true },
  });

  return {
    ...product,
    price: convertToNumber(product.price),
    costPrice: product.costPrice ? convertToNumber(product.costPrice) : null,
    taxRate: product.taxRate ? convertToNumber(product.taxRate) : null,
  };
}

/**
 * Update product
 */
export async function updateProduct(id: string, data: any): Promise<Product> {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product) {
    throw new Error(`Product with ID '${id}' not found`);
  }

  // If changing SKU, check if it's unique
  if (data.sku && data.sku !== product.sku) {
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existing) {
      throw new Error(`SKU '${data.sku}' is already in use`);
    }
  }

  // If changing category, check if it exists
  if (data.categoryId && data.categoryId !== product.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new Error(`Category with ID '${data.categoryId}' not found`);
    }
  }

  const updateData: Prisma.ProductUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.barcode !== undefined) updateData.barcode = data.barcode;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
  if (data.costPrice !== undefined) {
    updateData.costPrice = data.costPrice ? new Prisma.Decimal(data.costPrice) : null;
  }
  if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
  if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
  if (data.taxRate !== undefined) {
    updateData.taxRate = data.taxRate ? new Prisma.Decimal(data.taxRate) : null;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
  if (data.aiTags !== undefined) updateData.aiTags = data.aiTags;

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return {
    ...updated,
    price: convertToNumber(updated.price),
    costPrice: updated.costPrice ? convertToNumber(updated.costPrice) : null,
    taxRate: updated.taxRate ? convertToNumber(updated.taxRate) : null,
  };
}

/**
 * Soft delete product (set isActive to false)
 */
export async function deleteProduct(id: string): Promise<Product> {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product) {
    throw new Error(`Product with ID '${id}' not found`);
  }

  // Check if product is used in any active transactions/orders
  const activeTransactions = await prisma.transactionItem.count({
    where: {
      productId: id,
      transaction: {
        status: {
          in: ['PENDING', 'COMPLETED'],
        },
      },
    },
  });

  const activeSalesOrders = await prisma.salesOrderItem.count({
    where: {
      productId: id,
      salesOrder: {
        status: {
          in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID'],
        },
      },
    },
  });

  const activePurchaseOrders = await prisma.purchaseOrderItem.count({
    where: {
      productId: id,
      purchaseOrder: {
        status: {
          in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED'],
        },
      },
    },
  });

  if (activeTransactions > 0) {
    throw new Error(
      `Cannot delete product. It is used in ${activeTransactions} active transaction(s).`
    );
  }

  if (activeSalesOrders > 0) {
    throw new Error(
      `Cannot delete product. It is used in ${activeSalesOrders} active sales order(s).`
    );
  }

  if (activePurchaseOrders > 0) {
    throw new Error(
      `Cannot delete product. It is used in ${activePurchaseOrders} active purchase order(s).`
    );
  }

  const deleted = await prisma.product.update({
    where: { id },
    data: { isActive: false },
    include: { category: true },
  });

  return {
    ...deleted,
    price: convertToNumber(deleted.price),
    costPrice: deleted.costPrice ? convertToNumber(deleted.costPrice) : null,
    taxRate: deleted.taxRate ? convertToNumber(deleted.taxRate) : null,
  };
}

/**
 * Get products below reorder level
 */
export async function checkLowStock(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      reorderLevel: { not: null },
    },
    include: { category: true },
    orderBy: { stockQuantity: 'asc' },
  });

  // Filter in memory where stockQuantity <= reorderLevel
  const lowStock = products.filter((p) => p.reorderLevel && p.stockQuantity <= p.reorderLevel);

  return lowStock.map((p) => ({
    ...p,
    price: convertToNumber(p.price),
    costPrice: p.costPrice ? convertToNumber(p.costPrice) : null,
    taxRate: p.taxRate ? convertToNumber(p.taxRate) : null,
  }));
}

/**
 * Search products by name, SKU, or barcode
 */
export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: { category: true },
    take: limit,
  });

  return products.map((p) => ({
    ...p,
    price: convertToNumber(p.price),
    costPrice: p.costPrice ? convertToNumber(p.costPrice) : null,
    taxRate: p.taxRate ? convertToNumber(p.taxRate) : null,
  }));
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categoryId: string,
  filters?: Partial<ProductFilters>
): Promise<PaginatedProducts> {
  return getAllProducts({
    ...filters,
    categoryId,
  });
}
