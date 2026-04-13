// services/sales-order.service.ts

import { prisma } from '@/lib/prisma';
import {
  CreateSalesOrderInput,
  PaginatedSalesOrders,
  SalesOrder,
  SalesOrderFilters,
  UpdateSalesOrderInput,
} from '@/types/sales-order.types';
import { Prisma } from '@prisma/client';
import { createInventoryTransaction } from './inventory.service'; // Import inventory service
import { createLedgerEntry } from './ledger.service'; // Import ledger service
import { createPayment } from './payment.service'; // Import payment service

/**
 * Convert Decimal to number for JSON serialization
 */
function convertToNumber(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

function getSalesOrderFinancialState(totalAmount: Prisma.Decimal, paidAmount: Prisma.Decimal) {
  const normalizedPaidAmount = paidAmount.greaterThan(totalAmount) ? totalAmount : paidAmount;
  const balanceAmount = totalAmount.minus(normalizedPaidAmount);
  const paymentStatus =
    normalizedPaidAmount.lessThanOrEqualTo(0)
      ? 'UNPAID'
      : balanceAmount.lessThanOrEqualTo(0)
        ? 'PAID'
        : 'PARTIALLY_PAID';
  const status =
    paymentStatus === 'PAID'
      ? 'PAID'
      : paymentStatus === 'PARTIALLY_PAID'
        ? 'PARTIALLY_PAID'
        : 'CONFIRMED';

  return {
    paidAmount: normalizedPaidAmount,
    balanceAmount,
    paymentStatus,
    status,
  };
}


/**
 * Get all sales orders with filtering, searching, and pagination
 */
export async function getAllSalesOrders(filters: SalesOrderFilters): Promise<PaginatedSalesOrders> {
  // TODO: Implement filtering and pagination
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const orders = await prisma.salesOrder.findMany({
    include: {
      customer: true,
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

  const total = await prisma.salesOrder.count();
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
    })) as unknown as SalesOrder[],
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}

/**
 * Get single sales order by ID
 */
export async function getSalesOrderById(id: string): Promise<SalesOrder | null> {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
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
  } as unknown as SalesOrder;
}

/**
 * Create new sales order
 */
export async function createSalesOrder(data: CreateSalesOrderInput): Promise<SalesOrder> {
  const { customerId, orderDate, status, items } = data;

  // 1. Validate customer
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new Error('Customer not found');
  }

  // 2. Process order items and calculate totals
  let totalAmount = new Prisma.Decimal(0);
  const orderItemsData = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Not enough stock for product ${product.name}`);
      }

      const unitPrice = new Prisma.Decimal(item.unitPrice || convertToNumber(product.price));
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
        taxAmount: new Prisma.Decimal(0), // TODO: Implement tax calculation
      };
    })
  );

  // 3. Create SalesOrder and SalesOrderItems in a transaction
  const salesOrder = await prisma.salesOrder.create({
    data: {
      customer: { connect: { id: customerId } },
      orderDate: orderDate || new Date(),
      status: status || 'DRAFT',
      totalAmount: totalAmount,
      paidAmount: new Prisma.Decimal(0),
      paymentStatus: 'UNPAID',
      balanceAmount: totalAmount, // Initially, balance is the total amount
      items: {
        create: orderItemsData,
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // 4. Update product stock and create inventory transactions
  await Promise.all(
    items.map(async (item) => {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
      await createInventoryTransaction({
          productId: item.productId,
          transactionType: 'SALE',
          quantity: item.quantity,
          referenceId: salesOrder.id,
      });
    })
  );

  // 5. Create Ledger Entry for Sales Order
  await createLedgerEntry({
      entryDate: salesOrder.createdAt,
      description: `Sales Order #${salesOrder.id.substring(0,8)} from ${customer.name}`,
      debitAccount: 'Accounts Receivable',
      creditAccount: 'Sales Revenue',
      amount: convertToNumber(salesOrder.totalAmount),
      referenceId: salesOrder.id,
  });
  
  return getSalesOrderById(salesOrder.id).then(order => order!);
}


/**
 * Update sales order
 */
export async function updateSalesOrder(id: string, data: UpdateSalesOrderInput): Promise<SalesOrder> {
    // Extract payment data before transaction to avoid timeout
    const { payment, ...updateData } = data as any;

    const updatedOrder = await prisma.$transaction(
        async (tx) => {
            const existingOrder = await tx.salesOrder.findUnique({
                where: { id },
                include: { items: true },
            });

            if (!existingOrder) {
                throw new Error('Sales order not found');
            }

            // Revert stock changes from the original order and create inventory adjustments
            for (const item of existingOrder.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { increment: item.quantity } },
                });
                await createInventoryTransaction({
                    productId: item.productId,
                    transactionType: 'ADJUSTMENT',
                    quantity: item.quantity,
                    referenceId: existingOrder.id,
                    notes: `Stock restored from Sales Order ${existingOrder.id} update`,
                });
            }

            const { items, ...orderData } = updateData;
            let totalAmount = new Prisma.Decimal(0);
            const itemOperations = [];

        // Process item creations, updates, and deletions
        if (items) {
            // Deletions
            if (items.delete) {
                itemOperations.push(tx.salesOrderItem.deleteMany({ where: { id: { in: items.delete } } }));
            }

            // Updates
            if (items.update) {
                for (const item of items.update) {
                    const existingItem = existingOrder.items.find(i => i.id === item.id);
                    if (!existingItem) continue;

                    const product = await tx.product.findUnique({ where: { id: existingItem.productId } });
                    if (!product) throw new Error('Product not found');
                    
                    const quantity = item.quantity || existingItem.quantity;
                    const unitPrice = new Prisma.Decimal(item.unitPrice || convertToNumber(existingItem.unitPrice));
                    const discount = new Prisma.Decimal(item.discount || convertToNumber(existingItem.discount));
                    const subtotal = unitPrice.times(quantity).minus(discount);
                    totalAmount = totalAmount.plus(subtotal);

                    itemOperations.push(tx.salesOrderItem.update({
                        where: { id: item.id },
                        data: {
                            quantity,
                            unitPrice,
                            discount,
                            subtotal
                        }
                    }));

                    await tx.product.update({
                        where: { id: existingItem.productId },
                        data: { stockQuantity: { decrement: quantity } },
                    });
                    await createInventoryTransaction({
                        productId: existingItem.productId,
                        transactionType: 'SALE',
                        quantity: quantity,
                        referenceId: existingOrder.id,
                    });
                }
            }

            // Creations
            if (items.create) {
                for (const item of items.create) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) throw new Error('Product not found');

                    const unitPrice = new Prisma.Decimal(item.unitPrice || convertToNumber(product.price));
                    const quantity = item.quantity;
                    const discount = new Prisma.Decimal(item.discount || 0);
                    const subtotal = unitPrice.times(quantity).minus(discount);
                    totalAmount = totalAmount.plus(subtotal);
                    
                    itemOperations.push(tx.salesOrderItem.create({
                        data: {
                            salesOrderId: id,
                            productId: item.productId,
                            quantity,
                            unitPrice,
                            discount,
                            subtotal
                        }
                    }));

                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { decrement: quantity } },
                    });
                    await createInventoryTransaction({
                        productId: item.productId,
                        transactionType: 'SALE',
                        quantity: quantity,
                        referenceId: existingOrder.id,
                    });
                }
            }
        }

        // Recalculate total amount for items that were not created/updated/deleted
        const currentItems = await tx.salesOrderItem.findMany({
            where: {
                salesOrderId: id,
                NOT: { id: { in: (items?.update?.map((i: any) => i.id) || []).concat(items?.delete || []) } }
            }
        });
        
        for (const item of currentItems) {
            totalAmount = totalAmount.plus(item.subtotal);
        }


        // Update order data
        itemOperations.push(tx.salesOrder.update({
            where: { id },
            data: {
                ...orderData,
                totalAmount,
                ...getSalesOrderFinancialState(totalAmount, existingOrder.paidAmount),
            },
        }));

        await Promise.all(itemOperations);

        // Update Ledger Entry for Sales Order
        await createLedgerEntry({
            entryDate: new Date(),
            description: `Sales Order #${id.substring(0,8)} updated`,
            debitAccount: 'Accounts Receivable',
            creditAccount: 'Sales Revenue',
            amount: convertToNumber(totalAmount),
            referenceId: id,
        }, tx);
        
        const updatedOrder = await getSalesOrderById(id);
        if (!updatedOrder) {
            throw new Error("Failed to retrieve updated order");
        }
        return updatedOrder;
        },
        { maxWait: 10000, timeout: 10000 } // Increase timeout from default 5000ms
    );

    // Create payment AFTER transaction completes (outside transaction)
    if (payment && (updateData.status === 'PAID' || updateData.status === 'PARTIALLY_PAID')) {
        try {
            await createPayment({
                payerId: updatedOrder.customerId,
                payerType: 'CUSTOMER',
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                referenceOrderId: id,
                paymentDate: payment.paymentDate || new Date(),
                notes: payment.notes || `Payment for Sales Order #${id.substring(0, 8)}`,
                status: 'COMPLETED',
            });
        } catch (err) {
            console.error('Error creating payment for sales order:', err);
            // Don't throw - order is already updated successfully
        }
    }

    return updatedOrder;
}

/**
 * Delete sales order
 */
export async function deleteSalesOrder(id: string): Promise<void> {
    const order = await prisma.salesOrder.findUnique({
        where: { id },
        include: { items: true },
    });

    if (!order) {
        throw new Error('Sales order not found');
    }

    // Restore stock and create inventory adjustments
    await Promise.all(
        order.items.map(async (item) => {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: {
                        increment: item.quantity,
                    },
                },
            });
            await createInventoryTransaction({
                productId: item.productId,
                transactionType: 'ADJUSTMENT', // or RETURN, depending on policy
                quantity: item.quantity,
                referenceId: order.id,
                notes: `Stock restored from deleted Sales Order ${order.id}`,
            });
        })
    );

    // Reverse Ledger Entry for Sales Order
    await createLedgerEntry({
        entryDate: new Date(),
        description: `Sales Order #${order.id.substring(0,8)} deleted (reversal)`,
        debitAccount: 'Sales Revenue',
        creditAccount: 'Accounts Receivable',
        amount: convertToNumber(order.totalAmount),
        referenceId: order.id,
    });

    await prisma.salesOrder.delete({ where: { id } });
}
