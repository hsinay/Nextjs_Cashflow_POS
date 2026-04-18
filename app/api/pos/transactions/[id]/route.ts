import { logger } from '@/lib/logger';
// app/api/pos/transactions/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { getTransactionById } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/pos/transactions/{id}
 * Returns a single POS transaction
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const transaction = await getTransactionById(params.id);
        if (!transaction) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: transaction }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/pos/transactions/${params.id} error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
