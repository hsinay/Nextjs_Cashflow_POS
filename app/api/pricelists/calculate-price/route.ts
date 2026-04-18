import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { calculateProductPrice } from '@/services/pricelist.service';
import { calculatePriceSchema } from '@/lib/validations/pricelist.schema';

/**
 * POST /api/pricelists/calculate-price
 * Calculate product price based on quantity and pricelists
 * 
 * Request body:
 * {
 *   productId: string (uuid),
 *   quantity: number (positive integer),
 *   customerId?: string (uuid),
 *   categoryId?: string (uuid)
 * }
 * 
 * Authentication: Required (session-based)
 * Roles: ADMIN, INVENTORY_MANAGER
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    const hasPermission =
      session.user.roles.includes('ADMIN') ||
      session.user.roles.includes('INVENTORY_MANAGER') ||
      session.user.roles.includes('CASHIER');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validated = await calculatePriceSchema.parseAsync(body);

    const priceResult = await calculateProductPrice({
      productId: validated.productId,
      quantity: validated.quantity,
      pricelistId: validated.pricelistId ?? null,
      customerId: validated.customerId,
      categoryId: validated.categoryId,
    });

    return NextResponse.json({
      success: true,
      data: priceResult,
    });
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: (error as any).errors,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to calculate price';
    logger.error('Price calculation error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
