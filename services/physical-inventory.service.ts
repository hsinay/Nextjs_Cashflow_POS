/**
 * Physical Inventory Service
 * Core business logic for physical inventory operations
 */

import { prisma } from '@/lib/prisma';
import runInteractiveTransaction from '@/lib/prisma-helpers';
import {
    AddCountLineInput,
    CreatePhysicalInventoryInput,
    PhysicalInventory,
    PhysicalInventoryLine,
    VarianceReport,
} from '@/types/physical-inventory.types';
import { Prisma } from '@prisma/client';

/**
 * Generate reference number for physical inventory
 * Format: PI-LOCATION_CODE-YYYYMMDD-SEQUENCE
 */
async function generateReferenceNumber(locationCode: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Count inventories created today
  const todayStart = new Date(year, now.getMonth(), now.getDate());
  const todayEnd = new Date(year, now.getMonth(), now.getDate() + 1);

  const countToday = await prisma.physicalInventory.count({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
  });

  const sequence = String(countToday + 1).padStart(3, '0');
  return `PI-${locationCode}-${year}${month}${day}-${sequence}`;
}

/**
 * Create a new physical inventory session
 */
export async function createPhysicalInventory(
  data: CreatePhysicalInventoryInput,
  userId: string
): Promise<PhysicalInventory> {
  // Validate location exists
  const location = await prisma.location.findUnique({
    where: { id: data.locationId },
  });

  if (!location) {
    throw new Error('Location not found');
  }

  // Generate reference number
  const referenceNumber = await generateReferenceNumber(location.code);

  return await runInteractiveTransaction(async (tx) => {
    // Create physical inventory record
    const pi = await tx.physicalInventory.create({
      data: {
        referenceNumber,
        locationId: data.locationId,
        countDate: data.countDate,
        countMethod: data.countMethod,
        notes: data.notes,
        createdById: userId,
        status: 'DRAFT',
      },
      include: {
        location: true,
        createdBy: { select: { id: true, username: true } },
        lines: {
          include: { product: true },
        },
      },
    });

    // Determine which products to count
    let productsToCount: Array<{ productId: string; quantity: number }> = [];

    if (data.countMethod === 'FULL_COUNT') {
      // Get all products with stock in this location
      productsToCount = await tx.stockLevel.findMany({
        where: { locationId: data.locationId },
        select: { productId: true, quantity: true },
      });
    } else if (data.countMethod === 'PARTIAL_COUNT' && data.productIds?.length) {
      // Get specified products in this location
      productsToCount = await tx.stockLevel.findMany({
        where: {
          locationId: data.locationId,
          productId: { in: data.productIds },
        },
        select: { productId: true, quantity: true },
      });
    }

    // Create count lines for products
    if (productsToCount.length > 0) {
      const lineData = productsToCount.map((stk) => ({
        physicalInventoryId: pi.id,
        productId: stk.productId,
        systemQuantity: stk.quantity,
        physicalQuantity: null,
        variance: null,
      }));

      await tx.physicalInventoryLine.createMany({
        data: lineData,
      });
    }

    return pi as PhysicalInventory;
  });
}

/**
 * Get a physical inventory with all details
 */
export async function getPhysicalInventory(id: string): Promise<PhysicalInventory | null> {
  const pi = await prisma.physicalInventory.findUnique({
    where: { id },
    include: {
      location: true,
      createdBy: { select: { id: true, username: true } },
      confirmedBy: { select: { id: true, username: true } },
      lines: {
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return pi as PhysicalInventory | null;
}

/**
 * List physical inventories with filters
 */
export async function listPhysicalInventories(filters: {
  locationId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}): Promise<{
  inventories: PhysicalInventory[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { locationId, status, startDate, endDate, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.PhysicalInventoryWhereInput = {};

  if (locationId) where.locationId = locationId;
  if (status) where.status = status as any;

  if (startDate || endDate) {
    where.countDate = {};
    if (startDate) (where.countDate as any).gte = startDate;
    if (endDate) (where.countDate as any).lte = endDate;
  }

  const [inventories, total] = await Promise.all([
    prisma.physicalInventory.findMany({
      where,
      skip,
      take: limit,
      include: {
        location: true,
        createdBy: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.physicalInventory.count({ where }),
  ]);

  return {
    inventories: inventories as PhysicalInventory[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Add or update a count line
 */
export async function addCountLine(
  data: AddCountLineInput,
  userId: string
): Promise<PhysicalInventoryLine> {
  // Validate physical inventory exists and is in DRAFT state
  const pi = await prisma.physicalInventory.findUnique({
    where: { id: data.physicalInventoryId },
  });

  if (!pi) throw new Error('Physical inventory not found');
  if (pi.status !== 'DRAFT') throw new Error('Can only add counts to DRAFT inventories');

  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) throw new Error('Product not found');

  // Check if line already exists
  const existingLine = await prisma.physicalInventoryLine.findFirst({
    where: {
      physicalInventoryId: data.physicalInventoryId,
      productId: data.productId,
      batchNumber: data.batchNumber || null,
    },
  });

  const variance = data.physicalQuantity - pi.systemQuantity; // Will be updated with actual system qty

  if (existingLine) {
    // Update existing line
    const newVariance = data.physicalQuantity - existingLine.systemQuantity;
    return await prisma.physicalInventoryLine.update({
      where: { id: existingLine.id },
      data: {
        physicalQuantity: data.physicalQuantity,
        variance: newVariance,
        notes: data.notes,
        countedBy: userId,
        countedAt: new Date(),
      },
      include: { product: true },
    }) as PhysicalInventoryLine;
  } else {
    // Create new line
    const systemQty = product.stockQuantity || 0;
    const newVariance = data.physicalQuantity - systemQty;
    
    return await prisma.physicalInventoryLine.create({
      data: {
        physicalInventoryId: data.physicalInventoryId,
        productId: data.productId,
        systemQuantity: systemQty, // Capture current stock at time of count
        physicalQuantity: data.physicalQuantity,
        variance: newVariance,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        notes: data.notes,
        countedBy: userId,
        countedAt: new Date(),
      },
      include: { product: true },
    }) as PhysicalInventoryLine;
  }
}

/**
 * Update a count line
 */
export async function updateCountLine(
  lineId: string,
  updates: {
    physicalQuantity?: number;
    notes?: string;
    isVerified?: boolean;
  }
): Promise<PhysicalInventoryLine> {
  const line = await prisma.physicalInventoryLine.findUnique({
    where: { id: lineId },
    include: { physicalInventory: true },
  });

  if (!line) throw new Error('Count line not found');
  if (line.physicalInventory.status !== 'DRAFT') {
    throw new Error('Can only update lines in DRAFT inventories');
  }

  const newVariance =
    updates.physicalQuantity !== undefined
      ? updates.physicalQuantity - line.systemQuantity
      : line.variance;

  return await prisma.physicalInventoryLine.update({
    where: { id: lineId },
    data: {
      physicalQuantity: updates.physicalQuantity,
      variance: newVariance,
      notes: updates.notes,
      isVerified: updates.isVerified,
    },
    include: { product: true },
  }) as PhysicalInventoryLine;
}

/**
 * Delete a count line
 */
export async function deleteCountLine(lineId: string): Promise<void> {
  const line = await prisma.physicalInventoryLine.findUnique({
    where: { id: lineId },
    include: { physicalInventory: true },
  });

  if (!line) throw new Error('Count line not found');
  if (line.physicalInventory.status !== 'DRAFT') {
    throw new Error('Can only delete lines in DRAFT inventories');
  }

  await prisma.physicalInventoryLine.delete({
    where: { id: lineId },
  });
}

/**
 * Confirm physical inventory (move to CONFIRMED state)
 */
export async function confirmPhysicalInventory(
  piId: string,
  userId: string
): Promise<PhysicalInventory> {
  const pi = await prisma.physicalInventory.findUnique({
    where: { id: piId },
    include: { lines: true },
  });

  if (!pi) throw new Error('Physical inventory not found');
  if (pi.status !== 'DRAFT') throw new Error('Can only confirm DRAFT inventories');

  // Calculate statistics
  const countedLines = pi.lines.filter((l) => l.physicalQuantity !== null);
  const totalVariance = pi.lines.reduce((sum, line) => sum + (line.variance || 0), 0);
  const completionPercent = pi.lines.length > 0 ? (countedLines.length / pi.lines.length) * 100 : 0;

  return await prisma.physicalInventory.update({
    where: { id: piId },
    data: {
      status: 'CONFIRMED',
      confirmedById: userId,
      confirmedAt: new Date(),
      totalVariance,
      variancePercentage: new Prisma.Decimal(Math.round(completionPercent * 100) / 100),
    },
    include: {
      location: true,
      createdBy: { select: { id: true, username: true } },
      confirmedBy: { select: { id: true, username: true } },
      lines: { include: { product: true } },
    },
  }) as PhysicalInventory;
}

/**
 * Complete physical inventory and auto-adjust stock
 */
export async function completePhysicalInventory(
  piId: string,
  autoAdjust: boolean = true
): Promise<PhysicalInventory> {
  return await runInteractiveTransaction(async (tx) => {
    const pi = await tx.physicalInventory.findUnique({
      where: { id: piId },
      include: { lines: true, location: true },
    });

    if (!pi) throw new Error('Physical inventory not found');
    if (pi.status !== 'CONFIRMED') throw new Error('Can only complete CONFIRMED inventories');

    if (autoAdjust) {
      // Process each line with variance
      for (const line of pi.lines) {
        if (line.variance !== null && line.variance !== 0) {
          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              productId: line.productId,
              type: 'ADJUSTMENT',
              quantity: Math.abs(line.variance),
              referenceId: piId,
              notes: `Physical count adjustment - ${line.variance > 0 ? 'Excess' : 'Shortage'} from ${pi.referenceNumber}`,
            },
          });

          // Update stock level
          await tx.stockLevel.upsert({
            where: {
              productId_locationId: {
                productId: line.productId,
                locationId: pi.locationId,
              },
            },
            create: {
              productId: line.productId,
              locationId: pi.locationId,
              quantity: line.physicalQuantity || 0,
            },
            update: {
              quantity: {
                increment: line.variance,
              },
            },
          });

          // Update product stock
          await tx.product.update({
            where: { id: line.productId },
            data: {
              stockQuantity: {
                increment: line.variance,
              },
            },
          });
        }
      }
    }

    // Mark as done
    return await tx.physicalInventory.update({
      where: { id: piId },
      data: { status: 'DONE' },
      include: {
        location: true,
        lines: { include: { product: true } },
        createdBy: { select: { id: true, username: true } },
      },
    }) as PhysicalInventory;
  });
}

/**
 * Get variance report for physical inventory
 */
export async function getVarianceReport(piId: string): Promise<VarianceReport> {
  const pi = await prisma.physicalInventory.findUnique({
    where: { id: piId },
    include: {
      location: true,
      lines: {
        include: { product: true },
      },
    },
  });

  if (!pi) throw new Error('Physical inventory not found');

  const countedLines = pi.lines.filter((l) => l.physicalQuantity !== null);
  const highVarianceItems = pi.lines
    .filter((l) => l.variance && Math.abs(l.variance) > 0)
    .sort((a, b) => Math.abs((b.variance || 0) - (a.variance || 0)))
    .slice(0, 10);

  const missingItems = pi.lines.filter((l) => l.physicalQuantity === null);
  const excessItems = pi.lines.filter((l) => l.variance && l.variance > 0);

  const completionPercent = pi.lines.length > 0 ? (countedLines.length / pi.lines.length) * 100 : 0;

  return {
    referenceNumber: pi.referenceNumber,
    locationId: pi.locationId,
    countDate: pi.countDate,
    totalProductsCount: pi.lines.length,
    countedProductsCount: countedLines.length,
    uncountedProductsCount: missingItems.length,
    totalVariance: pi.totalVariance,
    accuracyPercentage: Number(pi.variancePercentage) || Math.round(completionPercent * 100) / 100,
    completionStatus: `${countedLines.length}/${pi.lines.length} items counted`,
    highVarianceItems: highVarianceItems.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.product?.name || 'N/A',
      sku: l.product?.sku || null,
      systemQty: l.systemQuantity,
      physicalQty: l.physicalQuantity,
      variance: l.variance,
      variancePercent: l.variance && l.systemQuantity ? (l.variance / l.systemQuantity) * 100 : null,
    })),
    missingItems: missingItems.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.product?.name || 'N/A',
      systemQty: l.systemQuantity,
    })),
    excessItems: excessItems.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.product?.name || 'N/A',
      physicalQty: l.physicalQuantity || 0,
    })),
  };
}

/**
 * Get count lines for a physical inventory
 */
export async function getCountLines(
  piId: string,
  filters?: { productId?: string; isVerified?: boolean; page?: number; limit?: number }
): Promise<{
  lines: PhysicalInventoryLine[];
  pagination: { page: number; limit: number; total: number };
}> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.PhysicalInventoryLineWhereInput = {
    physicalInventoryId: piId,
  };

  if (filters?.productId) where.productId = filters.productId;
  if (filters?.isVerified !== undefined) where.isVerified = filters.isVerified;

  const [lines, total] = await Promise.all([
    prisma.physicalInventoryLine.findMany({
      where,
      skip,
      take: limit,
      include: { product: true },
    }),
    prisma.physicalInventoryLine.count({ where }),
  ]);

  return {
    lines: lines as PhysicalInventoryLine[],
    pagination: { page, limit, total },
  };
}
