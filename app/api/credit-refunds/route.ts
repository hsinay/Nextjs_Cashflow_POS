/**
 * Credit Refunds API Routes
 * GET /api/credit-refunds - List all refunds
 * POST /api/credit-refunds - Create new refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';
import { createCreditRefundSchema } from '@/lib/validations/credit.schema';
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

    // Build filters
    const where: any = {};
    if (customerId) where.customerId = customerId;

    // Fetch refunds
    const [refunds, total] = await Promise.all([
      prisma.creditRefund.findMany({
        where,
        skip,
        take,
        orderBy: { refundDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          approvedByUser: { select: { id: true, username: true } },
        },
      }),
      prisma.creditRefund.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: refunds,
      pagination: { skip, take, total },
    });
  } catch (error: unknown) {
    console.error('[Credit Refunds GET]', error);
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

    // Admin only
    if (!session.user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate input
    const body = await req.json();
    const validated = createCreditRefundSchema.parse(body);

    // Create refund
    const refund = await creditService.createRefund(validated, session.user.id);

    return NextResponse.json(
      { success: true, data: refund },
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

    console.error('[Credit Refunds POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
