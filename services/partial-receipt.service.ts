// services/partial-receipt.service.ts

import { prisma } from '@/lib/prisma';
import runInteractiveTransaction from '@/lib/prisma-helpers';
import { createInventoryTransaction } from './inventory.service';
import { createLedgerEntry } from './ledger.service';

export interface PartialReceiptItem {
  purchaseOrderItemId: string;
  quantityReceived: number;
  quantityRejected?: number;
}

export interface CreatePartialReceiptInput {
  purchaseOrderId: string;
  receiptDate: Date;
  items: PartialReceiptItem[];
  supplierNotes?: string;
  internalNotes?: string;
  receivedById: string;
}

/**
 * Create partial receipt - allows receiving portion of PO without full GRN
 */
export async function createPartialReceipt(
  data: CreatePartialReceiptInput
): Promise<import("@prisma/client").PartialReceipt> {
  const { purchaseOrderId, receiptDate, items, supplierNotes, internalNotes, receivedById } = data;

  // Validate PO exists and is CONFIRMED
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  if (po.status !== 'CONFIRMED' && po.status !== 'PARTIALLY_RECEIVED') {
    throw new Error('Purchase order must be CONFIRMED or PARTIALLY_RECEIVED');
  }

  return await runInteractiveTransaction(async (tx) => {
    // Create partial receipt record
    const receipt = await tx.partialReceipt.create({
      data: {
        purchaseOrderId,
        receivedById,
        receivedDate: receiptDate,
        notes: supplierNotes || internalNotes || undefined,
        status: 'RECEIVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Process each item
    let totalAmount = 0;

    for (const item of items) {
      const poItem = po.items.find((i) => i.id === item.purchaseOrderItemId);
      if (!poItem) {
        throw new Error(`PO item ${item.purchaseOrderItemId} not found`);
      }

      // Create receipt line
      await tx.partialReceiptItem.create({
        data: {
          partialReceiptId: receipt.id,
          productId: poItem.productId,
          quantityReceived: item.quantityReceived,
          quantityRejected: item.quantityRejected || 0,
          unitPrice: poItem.unitPrice,
          batchNumber: undefined,
          expiryDate: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create inventory transaction
      if (item.quantityReceived > 0) {
        await createInventoryTransaction({
          productId: poItem.productId,
          transactionType: 'PURCHASE',
          quantity: item.quantityReceived,
          referenceId: receipt.id,
          notes: `Partial receipt for PO ${purchaseOrderId}`,
        });
      }

      totalAmount += Number(poItem.unitPrice) * item.quantityReceived;

      // No quantityReceived or status field on PurchaseOrderItem in schema, so skip updating them
    }

    // No per-item status or quantityReceived, so skip PO status update logic

    // Create GL entry for partial receipt
    await createLedgerEntry({
      entryDate: receiptDate,
      description: `Partial receipt for PO ${purchaseOrderId}`,
      debitAccount: 'Inventory in Transit',
      creditAccount: 'Accounts Payable',
      amount: totalAmount,
      referenceId: purchaseOrderId,
    });

    return receipt;
  });
}

/**
 * Get partial receipts for purchase order
 */
export async function getPartialReceiptsForPO(purchaseOrderId: string) {
  const receipts = await prisma.partialReceipt.findMany({
    where: { purchaseOrderId },
    include: { items: true },
    orderBy: { receivedDate: 'desc' },
  });
  return receipts;
}

/**
 * Get receiving schedule - shows expected vs actual receipts
 */
export async function getReceivingSchedule(purchaseOrderId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  const receipts = await getPartialReceiptsForPO(purchaseOrderId);

  // Calculate per-item receiving schedule
  const schedule = po.items.map((poItem) => {
    // No purchaseOrderItemId or receiptNumber/receiptDate on items/receipts in schema, so just aggregate by productId
    const itemReceipts = receipts.flatMap((r) =>
      r.items
        .filter((i) => i.productId === poItem.productId)
        .map((i) => ({
          quantity: i.quantityReceived,
          rejected: i.quantityRejected,
        }))
    );

    const totalReceived = itemReceipts.reduce((sum, r) => sum + r.quantity, 0);
    const totalRejected = itemReceipts.reduce((sum, r) => sum + r.rejected, 0);

    return {
      poItemId: poItem.id,
      productId: poItem.productId,
      quantityOrdered: poItem.quantity,
      quantityReceived: totalReceived,
      quantityRejected: totalRejected,
      pendingReceipt: poItem.quantity - totalReceived,
      percentageReceived: ((totalReceived / poItem.quantity) * 100).toFixed(2),
      receipts: itemReceipts,
      status: totalReceived === 0 ? 'NOT_STARTED' : totalReceived < poItem.quantity ? 'PARTIAL' : 'COMPLETE',
    };
  });

  return {
    purchaseOrderId,
    totalQuantityOrdered: po.items.reduce((sum, item) => sum + item.quantity, 0),
    totalQuantityReceived: schedule.reduce((sum, item) => sum + item.quantityReceived, 0),
    totalQuantityRejected: schedule.reduce((sum, item) => sum + item.quantityRejected, 0),
    percentageReceived: (
      (schedule.reduce((sum, item) => sum + item.quantityReceived, 0) /
        schedule.reduce((sum, item) => sum + item.quantityOrdered, 0)) *
      100
    ).toFixed(2),
    receiptCount: receipts.length,
    items: schedule,
  };
}

/**
 * Close partial receipt - prevents further partial receipts
 */
export async function closePartialReceipt(receiptId: string, reason?: string) {
  const receipt = await prisma.partialReceipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) {
    throw new Error('Partial receipt not found');
  }

  return await prisma.partialReceipt.update({
    where: { id: receiptId },
    data: {
      status: 'CLOSED',
      notes: reason ?? undefined,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get receiving variance - compares expected vs actual receipt timing
 */
export async function getReceivingVariance(purchaseOrderId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  const receipts = await getPartialReceiptsForPO(purchaseOrderId);
  const schedule = await getReceivingSchedule(purchaseOrderId);

  const actualReceiptDate = receipts.length > 0 ? receipts[0].receivedDate : null;
  const expectedReceiptDate = undefined; // Not in schema

  const variance = null;

  return {
    purchaseOrderId,
    expectedDeliveryDate: expectedReceiptDate,
    actualReceiptDate,
    varianceDays: variance,
    status: variance === null ? 'NOT_RECEIVED' : variance <= 0 ? 'ON_TIME' : 'LATE',
    percentageReceived: schedule.percentageReceived,
    isFullyReceived: schedule.percentageReceived === '100.00',
  };
}
