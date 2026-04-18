import { logger } from '@/lib/logger';
/**
 * Credit Calculate Interest API Route
 * POST /api/credits/[customerId]/calculate-interest - Calculate and apply interest
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: { customerId: string } }
) {
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

    const { customerId } = params;

    // Calculate and apply interest
    await creditService.calculateAndApplyInterest(customerId, session.user.id);

    return NextResponse.json(
      { success: true, message: 'Interest calculated and applied' },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('[Calculate Interest POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
