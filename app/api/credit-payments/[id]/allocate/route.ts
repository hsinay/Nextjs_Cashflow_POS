import { logger } from '@/lib/logger';
/**
 * Payment Allocation API Route
 * POST /api/credit-payments/[id]/allocate - Allocate payment to transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';
import { z } from 'zod';

// Validation schema for allocation
const allocatePaymentSchema = z.object({
  allocations: z.array(
    z.object({
      creditTransactionId: z.string().uuid('Invalid transaction ID'),
      allocatedAmount: z
        .number()
        .positive('Allocated amount must be positive')
        .max(999999.99),
    })
  ),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check
    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('INVENTORY_MANAGER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Validate input
    const body = await req.json();
    const validated = allocatePaymentSchema.parse(body);

    // Allocate payment
    await creditService.allocatePayment(id, validated.allocations);

    return NextResponse.json(
      { success: true, message: 'Payment allocated successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('exceeds outstanding balance')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    logger.error('[Payment Allocate POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
