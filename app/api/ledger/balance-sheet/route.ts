import { logger } from '@/lib/logger';
// app/api/ledger/balance-sheet/route.ts

import { authOptions } from '@/lib/auth';
import { getBalanceSheet } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/ledger/balance-sheet
 * Returns balance sheet report
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date') || undefined;

        const report = await getBalanceSheet(
            date ? new Date(date) : undefined
        );

        return NextResponse.json({ success: true, data: report }, { status: 200 });
    } catch (error) {
        logger.error('GET /api/ledger/balance-sheet error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
