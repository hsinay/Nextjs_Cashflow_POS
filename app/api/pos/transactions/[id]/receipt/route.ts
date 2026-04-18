import { logger } from '@/lib/logger';
// app/api/pos/transactions/[id]/receipt/route.ts

import { authOptions } from '@/lib/auth';
import { getTransactionById } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string; // transactionId
    };
}

/**
 * GET /api/pos/transactions/{id}/receipt
 * Returns transaction data formatted as a simulated receipt.
 * Actual receipt rendering/printing would happen on the client.
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

        // In a real application, this would render a nice HTML/PDF receipt
        // For now, we return the transaction data directly.
        return NextResponse.json({ success: true, data: transaction, message: "Simulated receipt data" }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/pos/transactions/${params.id}/receipt error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
