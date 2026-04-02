// app/api/suppliers/[id]/aging/route.ts

import { authOptions } from '@/lib/auth';
import { calculateSupplierAging } from '@/services/payment-reconciliation.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/suppliers/{id}/aging
 * Get aging analysis for supplier
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const aging = await calculateSupplierAging(params.id);

    return NextResponse.json({ success: true, data: aging }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}
