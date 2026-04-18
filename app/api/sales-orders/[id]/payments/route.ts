import { logger } from '@/lib/logger';
// app/api/sales-orders/[id]/payments/route.ts

import { authOptions } from '@/lib/auth';
import { getAllPayments } from '@/services/payment.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string; // salesOrderId
    };
}

/**
 * GET /api/sales-orders/{id}/payments
 * Returns payments associated with a specific sales order
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payments = await getAllPayments({ referenceOrderId: params.id });

        return NextResponse.json({ success: true, data: payments.payments }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/sales-orders/${params.id}/payments error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
