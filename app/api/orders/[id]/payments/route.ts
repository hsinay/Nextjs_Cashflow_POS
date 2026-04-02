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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await getOrderPayments(params.id);
    const summary = await getOrderPaymentSummary(params.id);

    return NextResponse.json({
      success: true,
      data: { payments, summary },
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    const validated = createOrderPaymentSchema.parse({
      ...body,
      salesOrderId: params.id,
    });

    const payment = await createOrderPayment(validated);

    return NextResponse.json(
      { success: true, data: payment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment:', error);
    
    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
