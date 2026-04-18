import { logger } from '@/lib/logger';
/**
 * Payment Reminders API Routes
 * GET /api/payment-reminders - List all reminders
 * POST /api/payment-reminders - Create new reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createReminderSchema } from '@/lib/validations/credit.schema';
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

    // Fetch reminders
    const [reminders, total] = await Promise.all([
      prisma.paymentReminder.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledDate: 'asc' },
        include: {
          customer: { select: { id: true, name: true, email: true, contactNumber: true } },
          createdByUser: { select: { id: true, username: true } },
        },
      }),
      prisma.paymentReminder.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reminders,
      pagination: { skip, take, total },
    });
  } catch (error: unknown) {
    logger.error('[Payment Reminders GET]', error);
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
    const validated = createReminderSchema.parse(body);

    // Get customer credit account
    const creditAccount = await prisma.customerCredit.findUnique({
      where: { customerId: validated.customerId },
    });

    if (!creditAccount) {
      return NextResponse.json(
        { error: 'Credit account not found for customer' },
        { status: 404 }
      );
    }

    // Create reminder
    const reminder = await prisma.paymentReminder.create({
      data: {
        customerId: validated.customerId,
        customerCreditId: creditAccount.id,
        createdByUserId: session.user.id,
        reminderType: validated.reminderType,
        scheduledDate: validated.scheduledDate,
        channel: validated.channel,
        message: validated.message,
        notes: validated.notes,
        status: 'CREATED',
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: reminder },
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

    logger.error('[Payment Reminders POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
