// services/inventory.service.ts

import { prisma } from '@/lib/prisma';
import { CreateInventoryTransactionInput, InventoryTransaction } from '@/types/inventory.types';
import { Prisma } from '@prisma/client';

function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

export async function createInventoryTransaction(data: CreateInventoryTransactionInput): Promise<InventoryTransaction> {
    const { productId, transactionType, quantity, referenceId, notes } = data;

    // Create transaction record
    const transaction = await prisma.inventoryTransaction.create({
        data: {
            product: { connect: { id: productId } },
            type: transactionType,
            quantity,
            referenceId,
            notes,
        },
        include: {
            product: true,
        },
    });

    // Update product stock quantity based on transaction type
    if (transactionType === 'PURCHASE') {
        // Add to stock for purchase orders
        await prisma.product.update({
            where: { id: productId },
            data: {
                stockQuantity: {
                    increment: quantity,
                },
            },
        });
    } else if (transactionType === 'SALES' || transactionType === 'SALES_RETURN') {
        // Subtract from stock for sales
        await prisma.product.update({
            where: { id: productId },
            data: {
                stockQuantity: {
                    decrement: quantity,
                },
            },
        });
    }

    return transaction as any;
}

export async function getInventoryHistoryForProduct(productId: string): Promise<InventoryTransaction[]> {
    const transactions = await prisma.inventoryTransaction.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        include: { product: true },
    });

    return transactions.map(t => {
        const product = {
            ...t.product,
            price: convertToNumber(t.product.price),
            costPrice: t.product.costPrice ? convertToNumber(t.product.costPrice) : null,
            taxRate: t.product.taxRate ? convertToNumber(t.product.taxRate) : null,
            predictedDemandImpact: t.product.predictedDemandImpact 
                ? convertToNumber(t.product.predictedDemandImpact) 
                : null,
        };
        return {
            ...t,
            product,
        } as any;
    });
}

export async function getAllInventoryTransactions(filters: any): Promise<any> {
    const { productId, transactionType, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {};

    if (productId) {
        where.productId = productId;
    }
    if (transactionType) {
        where.type = transactionType;
    }
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            (where.createdAt as any).gte = startDate;
        }
        if (endDate) {
            (where.createdAt as any).lte = endDate;
        }
    }

    const transactions = await prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: true },
    });

    const total = await prisma.inventoryTransaction.count({ where });
    const pages = Math.ceil(total / limit);

    return {
        transactions: transactions.map(t => {
            const product = {
                ...t.product,
                price: convertToNumber(t.product.price),
                costPrice: t.product.costPrice ? convertToNumber(t.product.costPrice) : null,
                taxRate: t.product.taxRate ? convertToNumber(t.product.taxRate) : null,
                predictedDemandImpact: t.product.predictedDemandImpact 
                    ? convertToNumber(t.product.predictedDemandImpact) 
                    : null,
            };
            return { ...t, product } as any;
        }),
        pagination: {
            page,
            limit,
            total,
            pages,
        },
    };
}

/**
 * Product with inventory info for displaying in stock table
 */
export interface ProductInventory {
  id: string;
  name: string;
  sku: string | null;
  stockQuantity: number;
  reorderLevel: number | null;
  price: number;
  costPrice: number | null;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
}

/**
 * Get all active products grouped by category with stock info
 */
export async function getProductsForInventory(): Promise<ProductInventory[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Convert Decimal to number and map to our interface
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      price: parseFloat(product.price.toString()),
      costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
      isActive: product.isActive,
      categoryId: product.categoryId,
      categoryName: product.category.name,
    }));
  } catch (error) {
    console.error('Error fetching products for inventory:', error);
    throw new Error('Failed to fetch products');
  }
}

/**
 * Get single product with current stock
 */
export async function getProductInventory(productId: string): Promise<ProductInventory | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      price: parseFloat(product.price.toString()),
      costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
      isActive: product.isActive,
      categoryId: product.categoryId,
      categoryName: product.category.name,
    };
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    throw new Error('Failed to fetch product');
  }
}

/**
 * Update product stock and create audit transaction
 * @param productId - Product ID to update
 * @param newQuantity - New stock quantity
 * @returns Updated product inventory
 */
export async function updateProductStock(
  productId: string,
  newQuantity: number
): Promise<ProductInventory> {
  try {
    // Validation: Check quantity is within acceptable range
    if (!Number.isInteger(newQuantity)) {
      throw new Error('Stock quantity must be a whole number');
    }

    if (newQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    if (newQuantity > 999999) {
      throw new Error('Stock quantity cannot exceed 999,999');
    }

    // Get current stock for audit trail
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true, isActive: true },
    });

    if (!currentProduct) {
      throw new Error('Product not found');
    }

    if (!currentProduct.isActive) {
      throw new Error('Cannot update stock for inactive product');
    }

    const oldQuantity = currentProduct.stockQuantity;
    const MAX_CHANGE = 50000; // Maximum quantity change per transaction

    // Check for unusually large changes
    if (Math.abs(newQuantity - oldQuantity) > MAX_CHANGE) {
      throw new Error(`Quantity change exceeds maximum allowed (${MAX_CHANGE}). Please break into smaller updates.`);
    }

    const difference = newQuantity - oldQuantity;

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    // Create inventory transaction for audit trail
    await prisma.inventoryTransaction.create({
      data: {
        productId,
        type: 'ADJUSTMENT',
        quantity: difference,
        notes: `Stock adjusted from ${oldQuantity} to ${newQuantity} units`,
      },
    });

    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      sku: updatedProduct.sku,
      stockQuantity: updatedProduct.stockQuantity,
      reorderLevel: updatedProduct.reorderLevel,
      price: parseFloat(updatedProduct.price.toString()),
      costPrice: updatedProduct.costPrice
        ? parseFloat(updatedProduct.costPrice.toString())
        : null,
      isActive: updatedProduct.isActive,
      categoryId: updatedProduct.categoryId,
      categoryName: updatedProduct.category.name,
    };
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}
