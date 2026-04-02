import { prisma } from '@/lib/prisma';
import {
  CreatePurchaseOrderInput,
  PaginatedPurchaseOrders,
  PurchaseOrder,
  PurchaseOrderFilters,
  UpdatePurchaseOrderInput,
} from '@/types/purchase-order.types';
import { Prisma } from '@prisma/client';
import { createInventoryTransaction } from './inventory.service'; // Import inventory service
import { createLedgerEntry } from './ledger.service'; // Import ledger service

function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

export async function getAllPurchaseOrders(filters: PurchaseOrderFilters): Promise<PaginatedPurchaseOrders> {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const orders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.purchaseOrder.count();
  const pages = Math.ceil(total / limit);

  return {
    orders: orders.map(o => ({
        ...o,
        totalAmount: convertToNumber(o.totalAmount),
        balanceAmount: convertToNumber(o.balanceAmount),
        items: o.items.map(i => ({
            ...i,
            unitPrice: convertToNumber(i.unitPrice),
            discount: convertToNumber(i.discount),
            taxAmount: convertToNumber(i.taxAmount),
            subtotal: convertToNumber(i.subtotal),
        }))
    })) as unknown as PurchaseOrder[],
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    totalAmount: convertToNumber(order.totalAmount),
    balanceAmount: convertToNumber(order.balanceAmount),
    items: order.items.map(i => ({
        ...i,
        unitPrice: convertToNumber(i.unitPrice),
        discount: convertToNumber(i.discount),
        taxAmount: convertToNumber(i.taxAmount),
        subtotal: convertToNumber(i.subtotal),
    }))
  } as unknown as PurchaseOrder;
}

export async function createPurchaseOrder(data: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const { supplierId, orderDate, status, items } = data;

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  let totalAmount = new Prisma.Decimal(0);
  const orderItemsData = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }

      const unitPrice = new Prisma.Decimal(item.unitPrice || convertToNumber(product.costPrice) || 0);
      const quantity = new Prisma.Decimal(item.quantity);
      const discount = new Prisma.Decimal(item.discount || 0);
      
      const subtotal = unitPrice.times(quantity).minus(discount);
      totalAmount = totalAmount.plus(subtotal);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice,
        discount: discount,
        subtotal: subtotal,
        taxAmount: new Prisma.Decimal(0),
      };
    })
  );

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      supplier: { connect: { id: supplierId } },
      orderDate: orderDate || new Date(),
      status: status || 'DRAFT',
      totalAmount: totalAmount,
      balanceAmount: totalAmount,
      items: {
        create: orderItemsData,
      },
    },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Create inventory transactions for purchase order items
  await Promise.all(
    items.map(async (item) => {
      await createInventoryTransaction({
        productId: item.productId,
        transactionType: 'PURCHASE',
        quantity: item.quantity,
        referenceId: purchaseOrder.id,
        notes: `Purchase Order ${purchaseOrder.id} item expected`,
      });
    })
  );

  // Create Ledger Entry for Purchase Order
  await createLedgerEntry({
      entryDate: purchaseOrder.createdAt,
      description: `Purchase Order #${purchaseOrder.id.substring(0,8)} from ${supplier.name}`,
      debitAccount: 'Inventory', // Or Purchase Clearing
      creditAccount: 'Accounts Payable',
      amount: convertToNumber(purchaseOrder.totalAmount),
      referenceId: purchaseOrder.id,
  });
  
  return getPurchaseOrderById(purchaseOrder.id).then(order => order!);
}

export async function updatePurchaseOrder(id: string, data: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
  return prisma.$transaction(async (tx) => {
      const existingOrder = await tx.purchaseOrder.findUnique({
          where: { id },
          include: { items: true },
      });

      if (!existingOrder) {
          throw new Error('Purchase order not found');
      }

      const { items, ...orderData } = data;
      let totalAmount = new Prisma.Decimal(0);

      // Process item updates
      if (items) {
          // Delete items
          if (items.delete) {
              await tx.purchaseOrderItem.deleteMany({
                  where: { id: { in: items.delete } },
              });
              // Create adjustment for removed items
              for (const itemId of items.delete) {
                  const item = existingOrder.items.find(i => i.id === itemId);
                  if (item) {
                      await createInventoryTransaction({
                          productId: item.productId,
                          transactionType: 'ADJUSTMENT',
                          quantity: -item.quantity, // Negative quantity for removal
                          referenceId: existingOrder.id,
                          notes: `Item removed from Purchase Order ${existingOrder.id}`,
                      });
                  }
              }
          }

          // Update items
          if (items.update) {
              for (const itemData of items.update) {
                  const item = await tx.purchaseOrderItem.findUnique({ where: { id: itemData.id } });
                  if (!item) continue;
                  const product = await tx.product.findUnique({ where: { id: item.productId }});
                  if (!product) continue;

                  const quantityDiff = itemData.quantity ? itemData.quantity - item.quantity : 0;
                  
                  const quantity = itemData.quantity || item.quantity;
                  const unitPrice = new Prisma.Decimal(itemData.unitPrice || convertToNumber(item.unitPrice));
                  const discount = new Prisma.Decimal(itemData.discount || convertToNumber(item.discount));
                  const subtotal = unitPrice.times(quantity).minus(discount);
                  
                  await tx.purchaseOrderItem.update({
                      where: { id: itemData.id },
                      data: {
                          quantity,
                          unitPrice,
                          discount,
                          subtotal,
                      },
                  });

                  if (quantityDiff !== 0) {
                      await createInventoryTransaction({
                          productId: item.productId,
                          transactionType: 'ADJUSTMENT',
                          quantity: quantityDiff,
                          referenceId: existingOrder.id,
                          notes: `Quantity updated in Purchase Order ${existingOrder.id}`,
                      });
                  }
              }
          }

          // Create new items
          if (items.create) {
              for (const itemData of items.create) {
                  const product = await tx.product.findUnique({ where: { id: itemData.productId } });
                  if (!product) throw new Error(`Product with id ${itemData.productId} not found`);

                  const unitPrice = new Prisma.Decimal(itemData.unitPrice || convertToNumber(product.costPrice) || 0);
                  const quantity = itemData.quantity;
                  const discount = new Prisma.Decimal(itemData.discount || 0);
                  const subtotal = unitPrice.times(quantity).minus(discount);

                  await tx.purchaseOrderItem.create({
                      data: {
                          purchaseOrderId: id,
                          productId: itemData.productId,
                          quantity,
                          unitPrice,
                          discount,
                          subtotal,
                      },
                  });

                  await createInventoryTransaction({
                      productId: itemData.productId,
                      transactionType: 'PURCHASE',
                      quantity: quantity,
                      referenceId: id,
                      notes: `New item added to Purchase Order ${id}`,
                  });
              }
          }
      }

      // Recalculate total amount
      const allItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
      totalAmount = allItems.reduce((acc, item) => acc.plus(item.subtotal), new Prisma.Decimal(0));

      // Update order
      await tx.purchaseOrder.update({
          where: { id },
          data: {
              ...orderData,
              totalAmount,
              balanceAmount: totalAmount, // TODO: Adjust balance based on payments
          },
      });

      // Create Ledger Entry for Purchase Order Update
      await createLedgerEntry({
          entryDate: new Date(),
          description: `Purchase Order #${id.substring(0,8)} updated`,
          debitAccount: 'Inventory', // Or Purchase Clearing
          creditAccount: 'Accounts Payable',
          amount: convertToNumber(totalAmount),
          referenceId: id,
      }, tx);

      const updatedOrder = await getPurchaseOrderById(id);
      if (!updatedOrder) {
          throw new Error('Failed to retrieve updated purchase order');
      }
      return updatedOrder;
  });
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
  });

  if (!order) {
      throw new Error('Purchase order not found');
  }

  // Create adjustment for items no longer expected
  await Promise.all(
    order.items.map(async (item) => {
        await createInventoryTransaction({
            productId: item.productId,
            transactionType: 'ADJUSTMENT',
            quantity: -item.quantity, // Negative quantity as they are no longer expected
            referenceId: order.id,
            notes: `Items no longer expected due to deleted Purchase Order ${order.id}`,
        });
    })
  );

  // Reverse Ledger Entry for Purchase Order
  await createLedgerEntry({
      entryDate: new Date(),
      description: `Purchase Order #${order.id.substring(0,8)} deleted (reversal)`,
      debitAccount: 'Accounts Payable',
      creditAccount: 'Inventory', // Or Purchase Clearing
      amount: convertToNumber(order.totalAmount),
      referenceId: order.id,
  });

  await prisma.purchaseOrder.delete({ where: { id } });
}

// ============================================
// PHASE 2: Payment Tracking & Balance Management
// ============================================

/**
 * Helper function to calculate payment status based on paid vs total amount
 */
export function calculatePaymentStatus(
  totalAmount: number,
  paidAmount: number
): 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'OVERPAID' {
  if (paidAmount === 0) return 'PENDING';
  if (paidAmount < totalAmount) return 'PARTIALLY_PAID';
  if (paidAmount === totalAmount) return 'FULLY_PAID';
  return 'OVERPAID';
}

/**
 * Helper function to calculate balance amount
 */
export function calculateBalance(totalAmount: number, paidAmount: number): number {
  return Math.max(0, totalAmount - paidAmount);
}

/**
 * Get all payments linked to a purchase order
 */
export async function getPurchaseOrderPayments(purchaseOrderId: string) {
  const payments = await prisma.payment.findMany({
    where: { referenceOrderId: purchaseOrderId },
    orderBy: { paymentDate: 'desc' },
  });

  return payments.map(p => ({
    ...p,
    amount: convertToNumber(p.amount),
    transactionFee: convertToNumber(p.transactionFee),
    netAmount: convertToNumber(p.netAmount),
  }));
}

/**
 * Link a payment to a purchase order and update payment status
 */
export async function linkPaymentToPurchaseOrder(
  purchaseOrderId: string,
  paymentId: string
): Promise<PurchaseOrder> {
  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Validate PO exists
    const po = await tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { supplier: true, items: true },
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    // Validate Payment exists
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if payment is already linked
    if (payment.referenceOrderId === purchaseOrderId) {
      throw new Error('Payment is already linked to this purchase order');
    }

    // Update payment to link it to this PO
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        referenceOrderId: purchaseOrderId,
      },
    });

    // Recalculate PO paid amount
    const linkedPayments = await tx.payment.findMany({
      where: { referenceOrderId: purchaseOrderId },
    });

    const paidAmount = linkedPayments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0)
    );

    const totalAmount = new Prisma.Decimal(convertToNumber(po.totalAmount));
    const balanceAmount = totalAmount.minus(paidAmount);
    const paymentStatus = calculatePaymentStatus(
      convertToNumber(totalAmount),
      convertToNumber(paidAmount)
    );

    // Update PO with new payment status and amounts
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        paidAmount,
        balanceAmount: balanceAmount.lessThan(0) ? new Prisma.Decimal(0) : balanceAmount,
        paymentStatus,
      },
    });

    // Create GL entry for payment received
    await createLedgerEntry({
      entryDate: payment.paymentDate,
      description: `Payment received for PO #${purchaseOrderId.substring(0, 8)} - ${payment.paymentMethod}`,
      debitAccount: 'Bank Account', // Or specific bank based on payment method
      creditAccount: 'Accounts Payable',
      amount: convertToNumber(payment.amount),
      referenceId: purchaseOrderId,
    }, tx);

    // Update supplier balance
    await updateSupplierBalance(po.supplierId, tx);

    // Return updated PO
    return getPurchaseOrderById(purchaseOrderId);
  });
}

/**
 * Unlink a payment from a purchase order
 */
export async function unlinkPaymentFromPurchaseOrder(
  purchaseOrderId: string,
  paymentId: string
): Promise<PurchaseOrder> {
  return await prisma.$transaction(async (tx) => {
    // Validate PO exists
    const po = await tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { supplier: true },
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    // Validate Payment exists and is linked to this PO
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.referenceOrderId !== purchaseOrderId) {
      throw new Error('Payment is not linked to this purchase order');
    }

    // Unlink payment
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        referenceOrderId: null,
      },
    });

    // Recalculate PO amounts
    const linkedPayments = await tx.payment.findMany({
      where: { referenceOrderId: purchaseOrderId },
    });

    const paidAmount = linkedPayments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0)
    );

    const totalAmount = new Prisma.Decimal(convertToNumber(po.totalAmount));
    const balanceAmount = totalAmount.minus(paidAmount);
    const paymentStatus = calculatePaymentStatus(
      convertToNumber(totalAmount),
      convertToNumber(paidAmount)
    );

    // Update PO
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        paidAmount,
        balanceAmount: balanceAmount.lessThan(0) ? new Prisma.Decimal(0) : balanceAmount,
        paymentStatus,
      },
    });

    // Reverse GL entry
    await createLedgerEntry({
      entryDate: new Date(),
      description: `Payment reversed for PO #${purchaseOrderId.substring(0, 8)} - ${payment.paymentMethod}`,
      debitAccount: 'Accounts Payable',
      creditAccount: 'Bank Account',
      amount: convertToNumber(payment.amount),
      referenceId: purchaseOrderId,
    }, tx);

    // Update supplier balance
    await updateSupplierBalance(po.supplierId, tx);

    return getPurchaseOrderById(purchaseOrderId);
  });
}

/**
 * Update supplier outstanding balance
 * Called after PO confirmation, cancellation, or payment operations
 */
export async function updateSupplierBalance(
  supplierId: string,
  tx?: any
): Promise<void> {
  const database = tx || prisma;

  try {
    // Get all CONFIRMED purchase orders for this supplier
    const confirmedPOs = await database.purchaseOrder.findMany({
      where: {
        supplierId,
        status: 'CONFIRMED',
      },
    });

    // Sum total amount of confirmed POs
    const totalConfirmedAmount = confirmedPOs.reduce(
      (sum, po) => sum.plus(po.totalAmount),
      new Prisma.Decimal(0)
    );

    // Get all payments for this supplier's purchase orders
    const poIds = confirmedPOs.map(po => po.id);
    const payments = await database.payment.findMany({
      where: {
        referenceOrderId: { in: poIds },
      },
    });

    // Sum all payments
    const totalPaidAmount = payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0)
    );

    // Calculate outstanding balance
    const outstandingBalance = totalConfirmedAmount.minus(totalPaidAmount);

    // Update supplier balance
    await database.supplier.update({
      where: { id: supplierId },
      data: {
        outstandingBalance: outstandingBalance.lessThan(0) ? new Prisma.Decimal(0) : outstandingBalance,
      },
    });
  } catch (error) {
    console.error('Error updating supplier balance:', error);
    throw new Error('Failed to update supplier balance');
  }
}

/**
 * Get supplier outstanding balance breakdown by PO status
 */
export async function getSupplierBalanceDetails(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Get all POs for supplier
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { supplierId },
    include: { items: true },
  });

  // Calculate breakdown by status
  const breakdown = {
    draft: {
      count: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
    },
    confirmed: {
      count: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
    },
    received: {
      count: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
    },
    cancelled: {
      count: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
    },
  };

  for (const po of purchaseOrders) {
    const status = po.status.toLowerCase() as keyof typeof breakdown;
    if (status in breakdown) {
      breakdown[status].count++;
      breakdown[status].totalAmount += convertToNumber(po.totalAmount);
      breakdown[status].paidAmount += convertToNumber(po.paidAmount);
      breakdown[status].balanceAmount += convertToNumber(po.balanceAmount);
    }
  }

  return {
    supplierId,
    supplierName: supplier.name,
    outstandingBalance: convertToNumber(supplier.outstandingBalance),
    creditLimit: convertToNumber(supplier.creditLimit),
    availableCredit: convertToNumber(supplier.creditLimit) - convertToNumber(supplier.outstandingBalance),
    breakdown,
  };
}
