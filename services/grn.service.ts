// services/grn.service.ts

import { prisma } from '@/lib/prisma';
import { createInventoryTransaction } from './inventory.service';
import { createLedgerEntry } from './ledger.service';

export interface GRNItem {
  purchaseOrderItemId: string;
  quantityReceived: number;
  quantityInspected?: number;
  quantityRejected?: number;
  batchNumber?: string;
  expiryDate?: Date;
  notes?: string;
}

export interface CreateGRNInput {
  purchaseOrderId: string;
  grnDate: Date;
  items: GRNItem[];
  receivedBy: string;
  inspectionNotes?: string;
  totalQuantity?: number;
}

export interface GRNRecord {
  id: string;
  purchaseOrderId: string;
  grnNumber: string;
  grnDate: Date;
  status: 'DRAFT' | 'RECEIVED' | 'INSPECTED' | 'ACCEPTED' | 'REJECTED';
  totalQuantityReceived: number;
  totalQuantityInspected: number;
  totalQuantityRejected: number;
  receivedBy: string;
  inspectionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string;
    productName?: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityInspected?: number;
    quantityRejected?: number;
    batchNumber?: string;
    expiryDate?: Date;
  }[];
}

/**
 * Create Goods Received Note
 */
export async function createGRN(data: CreateGRNInput): Promise<GRNRecord> {
  const { purchaseOrderId, grnDate, items, receivedBy, inspectionNotes } = data;

  // Validate PO exists
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  if (po.status !== 'CONFIRMED') {
    throw new Error('Purchase order must be CONFIRMED to receive goods');
  }

  return await prisma.$transaction(async (tx) => {
    // Generate GRN number
    // const count = await tx.goodsReceivedNote.count();

    // Create GRN record
    const grn = await tx.goodsReceivedNote.create({
      data: {
        purchaseOrderId,
        receivedById: receivedBy,
        receivedDate: grnDate,
        status: 'PENDING',
        notes: inspectionNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create GRN items and inventory transactions
    for (const item of items) {
      // Find PO item by matching purchaseOrderItemId
      const poItem = po.items.find((i: { id: string }) => i.id === item.purchaseOrderItemId);
      if (!poItem) {
        throw new Error(`Purchase order item for id ${item.purchaseOrderItemId} not found`);
      }

      await tx.gRNItem.create({
        data: {
          goodsReceivedNoteId: grn.id,
          productId: poItem.productId,
          quantityReceived: item.quantityReceived,
          quantityRejected: item.quantityRejected || 0,
          unitPrice: poItem.unitPrice,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create inventory transaction for received quantity
      if (item.quantityReceived > 0) {
        await createInventoryTransaction({
          productId: poItem.productId,
          transactionType: 'PURCHASE',
          quantity: item.quantityReceived,
          referenceId: grn.id,
          notes: `Goods received - GRN for PO ${purchaseOrderId}`,
        });
      }
    }

    // Create GL entry for goods receipt
    await createLedgerEntry({
      entryDate: grnDate,
      description: `Goods received - GRN for PO ${purchaseOrderId}`,
      debitAccount: 'Inventory',
      creditAccount: 'Goods Received Clearing',
      amount: Number(po.totalAmount),
      referenceId: purchaseOrderId,
    });

    // Return created GRN with items
    // Pass the correct Prisma client type for tx
    return getGRNById(grn.id, prisma);
  });
}

/**
 * Get GRN by ID
 */
export async function getGRNById(grnId: string, tx?: typeof prisma): Promise<GRNRecord> {
  const database = tx ?? prisma;
  const grn = await database.goodsReceivedNote.findUnique({
    where: { id: grnId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      receivedBy: true,
      purchaseOrder: true,
    },
  });

  if (!grn) {
    throw new Error('GRN not found');
  }

  return {
    id: grn.id,
    purchaseOrderId: grn.purchaseOrderId,
    grnNumber: '',
    grnDate: grn.receivedDate,
    status: grn.status as GRNRecord['status'],
    totalQuantityReceived: grn.items.reduce((sum: number, i: { quantityReceived: number }) => sum + i.quantityReceived, 0),
    totalQuantityInspected: 0,
    totalQuantityRejected: grn.items.reduce((sum: number, i: { quantityRejected: number }) => sum + i.quantityRejected, 0),
    receivedBy: grn.receivedById,
    inspectionNotes: grn.notes ?? undefined,
    createdAt: grn.createdAt,
    updatedAt: grn.updatedAt,
    items: grn.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name,
      quantityOrdered: 0,
      quantityReceived: item.quantityReceived,
      quantityInspected: 0,
      quantityRejected: item.quantityRejected,
      batchNumber: item.batchNumber ?? undefined,
      expiryDate: item.expiryDate ?? undefined,
    })),
  };
}

/**
 * Accept GRN - moves inventory to stock
 */
export async function acceptGRN(grnId: string): Promise<void> {
  const grn = await prisma.goodsReceivedNote.findUnique({
    where: { id: grnId },
  });

  if (!grn) {
    throw new Error('GRN not found');
  }

  return await prisma.$transaction(async (tx) => {
    // Update GRN status
    await tx.goodsReceivedNote.update({
      where: { id: grnId },
      data: {
        status: 'ACCEPTED',
      },
    });

    // Update PO status if all items received
    const po = await tx.purchaseOrder.findUnique({
      where: { id: grn.purchaseOrderId },
    });

    if (po) {
      await tx.purchaseOrder.update({
        where: { id: grn.purchaseOrderId },
        data: {
          status: 'RECEIVED',
        },
      });

      // Create GL entry for goods acceptance
      await createLedgerEntry({
        entryDate: new Date(),
        description: `Goods accepted - GRN for PO ${grn.purchaseOrderId}`,
        debitAccount: 'Inventory',
        creditAccount: 'Goods Received Clearing',
        amount: Number(po.totalAmount),
        referenceId: grnId,
      }, tx);
    }
  });
}

/**
 * Reject GRN item - reverse inventory transaction
 */
export async function rejectGRNItem(grnItemId: string, reason: string): Promise<void> {
  const grnItem = await prisma.gRNItem.findUnique({
    where: { id: grnItemId },
    include: { goodsReceivedNote: true },
  });

  if (!grnItem) {
    throw new Error('GRN item not found');
  }

    return await prisma.$transaction(async () => {
    // Create reverse inventory transaction
    await createInventoryTransaction({
      productId: grnItem.productId,
      transactionType: 'ADJUSTMENT',
      quantity: -grnItem.quantityRejected,
      referenceId: grnItem.goodsReceivedNoteId,
      notes: `Goods rejected - Reason: ${reason}`,
    });

    // Update GRN item
    // No updatable field for rejection reason or status in GRNItem schema
    // Optionally, log or handle rejection elsewhere
    // Optionally update parent GRN or perform other logic here
  });
}

/**
 * Get GRNs for purchase order
 */
export async function getGRNsForPO(purchaseOrderId: string) {
  const grns = await prisma.goodsReceivedNote.findMany({
    where: { purchaseOrderId },
    include: { items: true },
    orderBy: { receivedDate: 'desc' },
  });

  return grns;
}

/**
 * Get receiving status for PO
 */
export async function getPOReceivingStatus(purchaseOrderId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  const grns = await getGRNsForPO(purchaseOrderId);
  let totalReceived = 0;
  let totalRejected = 0;

  for (const grn of grns) {
    const items = await prisma.gRNItem.findMany({
      where: { goodsReceivedNoteId: grn.id },
    });

    for (const item of items) {
      totalReceived += item.quantityReceived;
      totalRejected += item.quantityRejected;
    }
  }

  const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    purchaseOrderId,
    totalOrdered,
    totalReceived,
    totalRejected,
    pendingReceipt: totalOrdered - totalReceived,
    receivingStatus:
      totalReceived === 0
        ? 'NOT_STARTED'
        : totalReceived < totalOrdered
          ? 'PARTIAL'
          : 'COMPLETE',
    grnCount: grns.length,
  };
}
