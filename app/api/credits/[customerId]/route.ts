import { logger } from '@/lib/logger';
/**
 * Customer Credit Detail API Routes
 * GET /api/credits/[customerId] - Get credit account
 * PUT /api/credits/[customerId] - Update credit limit/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';
import { updateCustomerCreditSchema } from '@/lib/validations/credit.schema';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = params;

    // Get account summary
    const summary = await creditService.getAccountSummary(customerId);
    if (!summary) {
      return NextResponse.json(
        { error: 'Credit account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: summary });
  } catch (error: unknown) {
    logger.error('[Credits GET Detail]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin only
    if (!session.user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customerId } = params;

    // Validate input
    const body = await req.json();
    const validated = updateCustomerCreditSchema.parse(body);

    // Update credit account
    const updated = await prisma.customerCredit.update({
      where: { customerId },
      data: validated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('record not found')) {
        return NextResponse.json(
          { error: 'Credit account not found' },
          { status: 404 }
        );
      }
    }

    logger.error('[Credits PUT]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
