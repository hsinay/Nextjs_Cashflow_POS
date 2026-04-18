import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { Decimal } from '@prisma/client/runtime/library';
import { authOptions } from '@/lib/auth';
import { createPricelistRule } from '@/services/pricelist.service';
import { createPricelistRuleSchema } from '@/lib/validations/pricelist.schema';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    pricelistId: string;
  };
}

/**
 * POST /api/pricelists/[pricelistId]/rules
 * Create a new pricing rule for a pricelist
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = session.user.roles.includes('ADMIN');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify pricelist exists
    const pricelist = await prisma.pricelist.findUnique({
      where: { id: params.pricelistId },
    });

    if (!pricelist) {
      return NextResponse.json(
        { error: 'Pricelist not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate rule data
    const validated = await createPricelistRuleSchema.parseAsync(body);

    // Create rule
    const rule = await createPricelistRule(params.pricelistId, validated);

    return NextResponse.json(
      { success: true, data: rule },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: (error as any).errors,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to create rule';
    logger.error('Error creating rule:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
