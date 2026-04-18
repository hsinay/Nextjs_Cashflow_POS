import { logger } from '@/lib/logger';
/**
 * PATCH /api/inventory/products/[id]/stock
 * Update product stock quantity
 */

import { authOptions } from '@/lib/auth';
import { updateProductStock } from '@/services/inventory.service';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

interface UpdateStockRequest {
  quantity: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body: UpdateStockRequest = await request.json();

    // Validate input
    if (typeof body.quantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'quantity must be a number' },
        { status: 400 }
      );
    }

    if (body.quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }

    const productId = params.id;
    const updatedProduct = await updateProductStock(productId, body.quantity);

    return NextResponse.json(
      { success: true, data: updatedProduct },
      { status: 200 }
    );
  } catch (error) {
    logger.error('PATCH /api/inventory/products/[id]/stock error:', error);

    if (error instanceof Error && error.message === 'Product not found') {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update stock';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
