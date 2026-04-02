// app/api/pos/sessions/[id]/transactions/route.ts

import { authOptions } from '@/lib/auth';
import { getTransactionsBySessionId } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string; // sessionId
    };
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

        const transactions = await getTransactionsBySessionId(params.id);

        return NextResponse.json({ success: true, data: transactions }, { status: 200 });
    } catch (error) {
        console.error(`GET /api/pos/sessions/${params.id}/transactions error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
