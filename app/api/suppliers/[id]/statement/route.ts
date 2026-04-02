// app/api/suppliers/[id]/statement/route.ts

import { authOptions } from '@/lib/auth';
import { generateSupplierStatement } from '@/services/payment-reconciliation.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/suppliers/{id}/statement
 * Generate supplier statement for period
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate parameters required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const statement = await generateSupplierStatement(params.id, startDate, endDate);

    return NextResponse.json({ success: true, data: statement }, { status: 200 });
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
