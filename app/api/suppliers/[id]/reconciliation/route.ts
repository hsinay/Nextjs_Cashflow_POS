// app/api/suppliers/[id]/reconciliation/route.ts

import { authOptions } from '@/lib/auth';
import { reconcilePayments } from '@/services/payment-reconciliation.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/suppliers/{id}/reconciliation
 * Get payment reconciliation report for supplier
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const report = await reconcilePayments(
      params.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({ success: true, data: report }, { status: 200 });
  } catch (error: unknown) {
    let message = 'Internal server error';
    let status = 500;
    if (error instanceof Error) {
      message = error.message;
      if (error.message?.includes('not found')) status = 404;
    }
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
