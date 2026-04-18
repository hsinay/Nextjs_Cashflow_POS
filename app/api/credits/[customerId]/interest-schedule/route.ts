import { logger } from '@/lib/logger';
/**
 * Interest Schedule API Route
 * GET /api/credits/[customerId]/interest-schedule - Get interest and late fee schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = params;

    // Get interest schedule
    const interestSchedule = await creditService.calculateInterestSchedule(
      customerId
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalInterestCharges: interestSchedule.totalInterest,
          transactionsWithInterest: interestSchedule.appliedCount,
          message: `${interestSchedule.appliedCount} transactions have accrued ${interestSchedule.totalInterest.toFixed(2)} in interest`,
        },
        schedule: interestSchedule.transactions,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Credit account not found' },
        { status: 404 }
      );
    }

    logger.error('[Interest Schedule GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
