import { logger } from '@/lib/logger';
// app/api/pos/sessions/[id]/transactions/route.ts

import { authOptions } from '@/lib/auth';
import { getTransactionsBySessionId } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        id: string; // sessionId
    }>;
}

/**
 * GET /api/pos/sessions/{id}/transactions
 * Returns transactions associated with a specific POS session
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const transactions = await getTransactionsBySessionId((await params).id);

        return NextResponse.json({ success: true, data: transactions }, { status: 200 });
    } catch (error) {
        logger.error({ err: error }, `GET /api/pos/sessions/${(await params).id}/transactions error:`);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
