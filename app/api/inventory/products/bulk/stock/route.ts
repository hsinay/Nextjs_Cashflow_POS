/**
 * PATCH /api/inventory/products/bulk/stock
 * Update stock for multiple products at once
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

interface BulkUpdateRequest {
  updates: Array<{
    productId: string;
    quantity: number;
  }>;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions - only ADMIN and INVENTORY_MANAGER
    const roles = ((session.user as unknown) as { roles?: string[] }).roles || [];
    const hasPermission = roles.includes('ADMIN') || roles.includes('INVENTORY_MANAGER');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body: BulkUpdateRequest = await request.json();

    // Validate input
    if (!Array.isArray(body.updates) || body.updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'updates must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate all updates
    for (const update of body.updates) {
      if (typeof update.quantity !== 'number' || update.quantity < 0) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for product ${update.productId}` },
          { status: 400 }
        );
      }
    }

    // Process updates
    const results = [];
    const errors = [];

    for (const update of body.updates) {
      try {
        // Get current stock
        const currentProduct = await prisma.product.findUnique({
          where: { id: update.productId },
          select: { stockQuantity: true },
        });

        if (!currentProduct) {
          errors.push({
            productId: update.productId,
            error: 'Product not found'
          });
          continue;
        }

        const oldQuantity = currentProduct.stockQuantity;
        const difference = update.quantity - oldQuantity;

        // Update product
        const updatedProduct = await prisma.product.update({
          where: { id: update.productId },
          data: { stockQuantity: update.quantity },
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        });

        // Create transaction
        await prisma.inventoryTransaction.create({
          data: {
            productId: update.productId,
            type: 'ADJUSTMENT',
            quantity: difference,
            notes: `Bulk stock update: from ${oldQuantity} to ${update.quantity}`,
          },
        });

        results.push({
          id: updatedProduct.id,
          name: updatedProduct.name,
          stockQuantity: updatedProduct.stockQuantity,
          categoryName: updatedProduct.category.name
        });
      } catch (error) {
        errors.push({
          productId: update.productId,
          error: error instanceof Error ? error.message : 'Update failed'
        });
      }
    }

    return NextResponse.json(
      {
        success: errors.length === 0,
        message: `Updated ${results.length} products${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
        data: {
          updated: results,
          failed: errors
        }
      },
      { status: errors.length === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error('PATCH /api/inventory/products/bulk/stock error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update stocks';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
