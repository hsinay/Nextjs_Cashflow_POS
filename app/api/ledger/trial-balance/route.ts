// app/api/ledger/trial-balance/route.ts

import { authOptions } from '@/lib/auth';
import { getTrialBalance } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/ledger/trial-balance
 * Returns trial balance report
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;

        const report = await getTrialBalance(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );

        return NextResponse.json({ success: true, data: report }, { status: 200 });
    } catch (error) {
        console.error('GET /api/ledger/trial-balance error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
