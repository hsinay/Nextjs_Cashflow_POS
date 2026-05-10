import { logger } from '@/lib/logger';
// app/api/orders/[id]/payments/route.ts

import { authOptions } from '@/lib/auth';
import { createOrderPaymentSchema } from '@/lib/validations/order-payment.schema';
import {
    createOrderPayment,
    getOrderPayments,
    getOrderPaymentSummary,
} from '@/services/order-payment.service';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/orders/[id]/payments
 * Get all payments for a sales order
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const summary = await getOrderPaymentSummary(id);

    return NextResponse.json({
      success: true,
      data: { payments: summary.payments, summary },
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error fetching payments:');
    const msg = error.message || '';
    if (msg.includes('not found')) {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: msg || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/[id]/payments
 * Create a new payment for a sales order
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = await params;

    const validated = createOrderPaymentSchema.parse({
      ...body,
      salesOrderId: id,
    });

    const payment = await createOrderPayment(validated);

    return NextResponse.json(
      { success: true, data: payment },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error({ err: error }, 'Error creating payment:');

    if (error.errors) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const msg = error.message || '';
    if (msg.includes('not found') || msg.includes('Not found')) {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg.includes('exceeds') || msg.includes('balance') || msg.includes('credit')) {
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }

    return NextResponse.json(
      { success: false, error: msg || 'Internal server error' },
      { status: 500 }
    );
  }
}
