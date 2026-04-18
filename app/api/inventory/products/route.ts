import { logger } from '@/lib/logger';
/**
 * GET /api/inventory/products
 * Fetch all products with stock quantities for inventory management
 */

import { authOptions } from '@/lib/auth';
import { getProductsForInventory } from '@/services/inventory.service';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const products = await getProductsForInventory();

    return NextResponse.json(
      { success: true, data: products },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    logger.error('GET /api/inventory/products error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
