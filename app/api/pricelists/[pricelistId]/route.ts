import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createInvalidIDError, isValidUUID } from '@/lib/validation-utils';
import { createPricelistRuleSchema, updatePricelistSchema } from '@/lib/validations/pricelist.schema';
import {
    createPricelistRule,
    deletePricelist,
    getPricelistById,
    updatePricelist,
} from '@/services/pricelist.service';
import { Decimal } from '@prisma/client/runtime/library';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    pricelistId: string;
  };
}

/**
 * GET /api/pricelists/[pricelistId]
 * Fetch specific pricelist
 */
export async function GET(
  _request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pricelist = await getPricelistById(params.pricelistId);
    if (!pricelist) {
      return NextResponse.json(
        { error: 'Pricelist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pricelist,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pricelist';
    console.error('Error fetching pricelist:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pricelists/[pricelistId]
 * Update pricelist
 */
export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasPermission = session.user.roles.includes('ADMIN');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rules, ...pricelistData } = body;

    // Validate pricelist data with schema
    const validatedData = await updatePricelistSchema.parseAsync(pricelistData);

    // Update pricelist
    const pricelist = await updatePricelist(params.pricelistId, validatedData);

    // Handle rules separately if provided
    if (rules && Array.isArray(rules)) {
      // Get existing rules for this pricelist
      const existingRules = await prisma.pricelistRule.findMany({
        where: { pricelistId: params.pricelistId },
      });
      const existingRuleIds = new Set(existingRules.map((r) => r.id));

      // Determine which rules to delete
      const newRuleIds = new Set(
        rules
          .filter((r: any) => r.id && !r.id.startsWith('rule-'))
          .map((r: any) => r.id)
      );

      // Delete removed rules
      for (const ruleId of existingRuleIds) {
        if (!newRuleIds.has(ruleId)) {
          await prisma.pricelistRule.delete({ where: { id: ruleId } });
        }
      }

      // Create or update rules
      for (const rule of rules) {
        // Validate rule data with schema
        const validatedRule = await createPricelistRuleSchema.parseAsync(rule);

        if (!rule.id || rule.id.startsWith('rule-')) {
          // New rule - create it
          await createPricelistRule(params.pricelistId, validatedRule);
        } else {
          // Existing rule - update it
          await prisma.pricelistRule.update({
            where: { id: rule.id },
            data: {
              name: validatedRule.name,
              priority: validatedRule.priority,
              minQuantity: validatedRule.minQuantity,
              maxQuantity: validatedRule.maxQuantity,
              appliedTo: validatedRule.appliedTo,
              productId: validatedRule.productId,
              categoryId: validatedRule.categoryId,
              customerGroupId: validatedRule.customerGroupId,
              calculationType: validatedRule.calculationType,
              discountPercentage: validatedRule.discountPercentage ? 
                new Decimal(validatedRule.discountPercentage) 
                : null,
              fixedPrice: validatedRule.fixedPrice ? 
                new Decimal(validatedRule.fixedPrice) 
                : null,
              fixedDiscount: validatedRule.fixedDiscount ? 
                new Decimal(validatedRule.fixedDiscount) 
                : null,
              formulaMargin: validatedRule.formulaMargin ? 
                new Decimal(validatedRule.formulaMargin) 
                : null,
              formulaMarkup: validatedRule.formulaMarkup ? 
                new Decimal(validatedRule.formulaMarkup) 
                : null,
              isActive: validatedRule.isActive,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: pricelist,
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

    const message = error instanceof Error ? error.message : 'Failed to update pricelist';
    console.error('Error updating pricelist:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pricelists/[pricelistId]
 * Delete pricelist
 */
export async function DELETE(
  _request: Request,
  { params }: RouteParams
) {
  try {
    // Validate UUID format
    if (!isValidUUID(params.pricelistId)) {
      const error = createInvalidIDError('pricelistId');
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasPermission = session.user.roles.includes('ADMIN');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await deletePricelist(params.pricelistId);

    return NextResponse.json({
      success: true,
      message: 'Pricelist deleted',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete pricelist';
    console.error('Error deleting pricelist:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
