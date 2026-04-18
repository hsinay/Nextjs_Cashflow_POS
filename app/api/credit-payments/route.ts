import { logger } from '@/lib/logger';
/**
 * Credit Payments API Routes
 * GET /api/credit-payments - List all credit payments
 * POST /api/credit-payments - Record new payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';
import { createCreditPaymentSchema } from '@/lib/validations/credit.schema';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse pagination & filters
    const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0');
    const take = parseInt(req.nextUrl.searchParams.get('take') || '20');
    const customerId = req.nextUrl.searchParams.get('customerId');
    const status = req.nextUrl.searchParams.get('status');

    // Build filters
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    // Fetch payments
    const [payments, total] = await Promise.all([
      prisma.creditPayment.findMany({
        where,
        skip,
        take,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          paymentAllocations: {
            include: { creditTransaction: true },
          },
        },
      }),
      prisma.creditPayment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: { skip, take, total },
    });
  } catch (error: unknown) {
    logger.error('[Credit Payments GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Validate input
    const body = await req.json();
    const validated = createCreditPaymentSchema.parse(body);

    // Record payment
    const payment = await creditService.recordPayment(
      validated,
      session.user.id
    );

    return NextResponse.json(
      { success: true, data: payment },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    logger.error('[Credit Payments POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
