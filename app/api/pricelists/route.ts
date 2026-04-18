import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getAllPricelists, createPricelist } from '@/services/pricelist.service';
import { createPricelistSchema } from '@/lib/validations/pricelist.schema';

/**
 * GET /api/pricelists
 * Fetch all pricelists
 */
export async function GET() {
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

    const pricelists = await getAllPricelists();

    return NextResponse.json({
      success: true,
      data: pricelists,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pricelists';
    logger.error('Error fetching pricelists:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pricelists
 * Create new pricelist
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
    const hasPermission = session.user.roles.includes('ADMIN');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validated = await createPricelistSchema.parseAsync(body);

    const pricelist = await createPricelist(validated);

    return NextResponse.json(
      { success: true, data: pricelist },
      { status: 201 }
    );
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

    const message = error instanceof Error ? error.message : 'Failed to create pricelist';
    logger.error('Error creating pricelist:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
