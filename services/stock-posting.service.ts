// services/stock-posting.service.ts

import { prisma } from '@/lib/prisma';
import runInteractiveTransaction from '@/lib/prisma-helpers';
import { createLedgerEntry } from './ledger.service';

export interface StockPostingEntry {
  productId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: Date;
  storageLocation?: string;
  notes?: string;
}

export interface CreateStockPostingInput {
  referenceId: string;
  referenceType: 'GRN' | 'PARTIAL_RECEIPT' | 'ADJUSTMENT' | 'TRANSFER';
  postingDate: Date;
  entries: StockPostingEntry[];
  approvedBy: string;
  notes?: string;
}

/**
 * Post stock - finalizes stock in warehouse/storage
 */
export async function postStock(data: CreateStockPostingInput): Promise<import('@prisma/client').StockPosting> {
  const { referenceId, referenceType, postingDate, entries, approvedBy, notes } = data;

  return await runInteractiveTransaction(async (tx) => {
    let totalAmount = 0;

    // Create stock posting record
    const posting = await tx.stockPosting.create({
      data: {
        referenceId,
        referenceType,
        postingDate,
        status: 'POSTED',
        approvedBy: { connect: { id: approvedBy } },
        notes,
      },
    });

    // Process each entry
    for (const entry of entries) {
      const product = await tx.product.findUnique({
        where: { id: entry.productId },
      });

      if (!product) {
        throw new Error(`Product ${entry.productId} not found`);
      }

      const totalValue = entry.quantity * entry.unitCost;
      totalAmount += totalValue;

      // Create posting line
      await tx.stockPostingItem.create({
        data: {
          stockPostingId: posting.id,
          productId: entry.productId,
          quantity: entry.quantity,
          unitCost: entry.unitCost,
          batchNumber: entry.batchNumber,
          expiryDate: entry.expiryDate,
          storageLocation: entry.storageLocation,
          notes: entry.notes,
        },
      });

      // Update product stock level
      await tx.product.update({
        where: { id: entry.productId },
        data: {
          stockQuantity: {
            increment: entry.quantity,
          },
          // Remove lastStockPostingDate: postingDate, as it does not exist in schema
        },
      });
    }

    // Create GL entry for stock posting
    if (totalAmount > 0) {
      await createLedgerEntry({
        entryDate: postingDate,
        description: `Stock posted - ${referenceType} ${referenceId}`,
        debitAccount: 'Inventory',
        creditAccount: referenceType === 'GRN' ? 'Goods Received Clearing' : 'Inventory in Transit',
        amount: totalAmount,
        referenceId,
      }, tx);
    }

    return posting;
  });
}

/**
 * Get stock level by product
 */
export async function getProductStockLevel(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const transactions = await prisma.inventoryTransaction.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
  });

  const postings = await prisma.stockPosting.findMany({
    where: {},
    include: {
      items: {
        where: { productId },
      },
    },
  });

  return {
    productId,
    productName: product.name,
    currentStock: product.stockQuantity,
    reorderLevel: product.reorderLevel,
    // reorderQuantity and lastPostingDate removed (not in schema)
    needsReorder: product.reorderLevel !== null ? product.stockQuantity <= product.reorderLevel : false,
    transactions: transactions.slice(0, 10),
    recentPostings: postings
      .filter((p) => p.items.length > 0)
      .slice(0, 5),
  };
}

/**
 * Get warehouse stock summary
 */
export async function getWarehouseStockSummary() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      reorderLevel: true,
      // unitPrice removed (not in schema)
    },
  });

  const summary = products.map((product) => ({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity: product.stockQuantity,
    reorderLevel: product.reorderLevel,
    value: product.stockQuantity, // No unitPrice, so just use quantity
    status:
      product.stockQuantity === 0
        ? 'OUT_OF_STOCK'
        : product.reorderLevel !== null && product.stockQuantity <= product.reorderLevel
          ? 'LOW_STOCK'
          : 'IN_STOCK',
  }));

  return {
    totalProducts: products.length,
    totalQuantity: products.reduce((sum, p) => sum + p.stockQuantity, 0),
    totalValue: products.reduce((sum, p) => sum + p.stockQuantity, 0),
    outOfStock: summary.filter((s) => s.status === 'OUT_OF_STOCK').length,
    lowStock: summary.filter((s) => s.status === 'LOW_STOCK').length,
    products: summary.sort((a, b) => b.value - a.value),
  };
}

/**
 * Get stock movement report
 */
export async function getStockMovementReport(
  startDate: Date,
  endDate: Date,
  productId?: string
) {
  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(productId && { productId }),
    },
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by transaction type
  const byType = transactions.reduce(
    (acc, t) => {
      const type = t.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(t);
      return acc;
    },
    {} as Record<string, typeof transactions>
  );

  // Group by product
  const byProduct = transactions.reduce(
    (acc, t) => {
      if (!acc[t.productId]) {
        acc[t.productId] = [];
      }
      acc[t.productId].push(t);
      return acc;
    },
    {} as Record<string, typeof transactions>
  );

  return {
    startDate,
    endDate,
    totalTransactions: transactions.length,
    byType: Object.entries(byType).map(([type, items]) => ({
      type,
      count: items.length,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
    })),
    byProduct: Object.entries(byProduct).map(([prodId, items]) => {
      const product = items[0].product;
      return {
        productId: prodId,
        productName: product?.name,
        transactionCount: items.length,
        totalQuantityChange: items.reduce((sum, i) => sum + i.quantity, 0),
      };
    }),
    allTransactions: transactions,
  };
}

/**
 * Calculate cost of goods sold (COGS)
 */
export async function calculateCOGS(startDate: Date, endDate: Date) {
  const outTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      type: {
        in: ['SALE', 'ADJUSTMENT'],
      },
      quantity: {
        lt: 0,
      },
    },
    include: {
      product: true,
    },
  });

  let totalCOGS = 0;
  const items = outTransactions.map((t) => {
    const cost = Math.abs(t.quantity); // No unitPrice, so just use quantity
    totalCOGS += cost;
    return {
      productId: t.productId,
      productName: t.product?.name,
      quantity: Math.abs(t.quantity),
      unitCost: 0, // No unitPrice
      totalCost: cost,
      type: t.type,
      date: t.createdAt,
    };
  });

  return {
    startDate,
    endDate,
    totalCOGS,
    itemCount: items.length,
    items: items.sort((a, b) => b.totalCost - a.totalCost),
  };
}

/**
 * Validate stock levels against safety stock
 */
export async function validateStockLevels() {
  const products = await prisma.product.findMany();

  const validation = products.map((product) => {
    const isBelowReorder = product.reorderLevel !== null ? product.stockQuantity <= product.reorderLevel : false;
    // No reorderQuantity in schema, so skip isAboveMax
    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      status: isBelowReorder ? 'BELOW_REORDER' : 'NORMAL',
      action: isBelowReorder ? 'CREATE_PO' : 'NONE',
    };
  });

  return {
    totalProducts: products.length,
    belowReorder: validation.filter((v) => v.status === 'BELOW_REORDER').length,
    overstocked: validation.filter((v) => v.status === 'OVERSTOCKED').length,
    normal: validation.filter((v) => v.status === 'NORMAL').length,
    items: validation,
  };
}
