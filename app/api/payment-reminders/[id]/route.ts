import { logger } from '@/lib/logger';
/**
 * Payment Reminder Detail API Routes
 * GET /api/payment-reminders/[id] - Get reminder details
 * PUT /api/payment-reminders/[id] - Update reminder status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateReminderSchema } from '@/lib/validations/credit.schema';
import { prisma } from '@/lib/prisma';

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

    // Fetch reminder
    const reminder = await prisma.paymentReminder.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, contactNumber: true } },
        customerCredit: { select: { id: true, outstandingAmount: true } },
        createdByUser: { select: { id: true, username: true } },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: reminder });
  } catch (error: unknown) {
    logger.error('[Payment Reminder GET Detail]', error);
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
    const validated = updateReminderSchema.parse(body);

    // Update reminder
    const updated = await prisma.paymentReminder.update({
      where: { id },
      data: validated,
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
          { error: 'Reminder not found' },
          { status: 404 }
        );
      }
    }

    logger.error('[Payment Reminder PUT]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
