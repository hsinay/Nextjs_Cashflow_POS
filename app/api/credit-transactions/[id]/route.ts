import { logger } from '@/lib/logger';
/**
 * Credit Transaction Detail API Routes
 * GET /api/credit-transactions/[id] - Get transaction details
 * PUT /api/credit-transactions/[id] - Update transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateCreditTransactionSchema } from '@/lib/validations/credit.schema';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Fetch transaction with allocations
    const transaction = await prisma.creditTransaction.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, contactNumber: true } },
        paymentAllocations: true,
        interestEntries: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: unknown) {
    logger.error('[Credit Transaction GET Detail]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check - ADMIN or INVENTORY_MANAGER
    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('INVENTORY_MANAGER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Validate input
    const body = await req.json();
    const validated = updateCreditTransactionSchema.parse(body);

    // Convert amount/balance to Decimal if provided
    const dataToUpdate: any = { ...validated };
    if (dataToUpdate.amount !== undefined) {
      dataToUpdate.amount = new Prisma.Decimal(dataToUpdate.amount);
    }

    // Update transaction
    const updated = await prisma.creditTransaction.update({
      where: { id },
      data: dataToUpdate,
      include: {
        customer: { select: { id: true, name: true } },
      },
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
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }
    }

    logger.error('[Credit Transaction PUT]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
