/**
 * Customer Credit Management API Routes
 * POST /api/credits - Initialize credit account
 * GET /api/credits?customerId=xxx - Get credit account
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';
import { createCustomerCreditSchema } from '@/lib/validations/credit.schema';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check - ADMIN or INVENTORY_MANAGER
    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('INVENTORY_MANAGER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate input
    const body = await req.json();
    const validated = createCustomerCreditSchema.parse(body);

    // Initialize credit account
    const credit = await creditService.initializeCredit(validated);

    return NextResponse.json(
      { success: true, data: credit },
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

    console.error('[Credits POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customerId from query
    const customerId = req.nextUrl.searchParams.get('customerId');
    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId query parameter required' },
        { status: 400 }
      );
    }

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
    console.error('[Credits GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
