import { logger } from '@/lib/logger';
/**
 * GET /api/payments
 * POST /api/payments
 * 
 * Clean architecture:
 * - Input validation via Zod
 * - Service layer for business logic
 * - Repository pattern for data access
 * - Minimal coupling between layers
 */

import { getPaymentService } from '@/lib/api-init';
import { authOptions } from '@/lib/auth';
import { createPaymentSchema, paymentFilterSchema } from '@/lib/validations/payment.schema';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payments
 * Fetch payments with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = paymentFilterSchema.safeParse(searchParams);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid filters', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Use service (clean, loosely coupled)
    const paymentService = getPaymentService();
    const result = await paymentService.getAllPayments(validationResult.data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * Create a new payment
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check
    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('ACCOUNTANT');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createPaymentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Use service (clean, loosely coupled)
    const paymentService = getPaymentService();
    const payment = await paymentService.createPayment(validationResult.data);

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
