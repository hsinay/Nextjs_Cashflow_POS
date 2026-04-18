import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { Decimal } from '@prisma/client/runtime/library';
import { authOptions } from '@/lib/auth';
import { updatePricelistRuleSchema } from '@/lib/validations/pricelist.schema';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    pricelistId: string;
    ruleId: string;
  };
}

/**
 * GET /api/pricelists/[pricelistId]/rules/[ruleId]
 * Fetch a specific pricing rule
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rule = await prisma.pricelistRule.findUnique({
      where: { id: params.ruleId },
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!rule || rule.pricelistId !== params.pricelistId) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rule';
    logger.error('Error fetching rule:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/pricelists/[pricelistId]/rules/[ruleId]
 * Update a pricing rule
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = session.user.roles.includes('ADMIN');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify rule belongs to pricelist
    const rule = await prisma.pricelistRule.findUnique({
      where: { id: params.ruleId },
    });

    if (!rule || rule.pricelistId !== params.pricelistId) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate update data
    const validated = await updatePricelistRuleSchema.parseAsync(body);

    // Build update data with Decimal conversion
    const updateData: any = {};

    Object.entries(validated).forEach(([key, value]) => {
      if (value === undefined) return;

      // Convert numeric fields to Decimal
      if (['discountPercentage', 'fixedPrice', 'fixedDiscount', 'formulaMargin', 'formulaMarkup'].includes(key)) {
        updateData[key] = value !== null ? new Decimal(value) : null;
      } else {
        updateData[key] = value;
      }
    });

    // Update rule
    const updatedRule = await prisma.pricelistRule.update({
      where: { id: params.ruleId },
      data: updateData,
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updatedRule });
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

    const message = error instanceof Error ? error.message : 'Failed to update rule';
    logger.error('Error updating rule:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/pricelists/[pricelistId]/rules/[ruleId]
 * Delete a pricing rule
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = session.user.roles.includes('ADMIN');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify rule belongs to pricelist
    const rule = await prisma.pricelistRule.findUnique({
      where: { id: params.ruleId },
    });

    if (!rule || rule.pricelistId !== params.pricelistId) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Delete rule
    await prisma.pricelistRule.delete({
      where: { id: params.ruleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete rule';
    logger.error('Error deleting rule:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
