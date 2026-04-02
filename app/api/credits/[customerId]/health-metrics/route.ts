/**
 * Credit Health Metrics API Route
 * GET /api/credits/[customerId]/health-metrics - Get credit health metrics and risk score
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

    // Get health metrics
    const metrics = await creditService.getHealthMetrics(customerId);

    return NextResponse.json({ success: true, data: metrics });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Credit account not found' },
        { status: 404 }
      );
    }

    console.error('[Health Metrics GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
