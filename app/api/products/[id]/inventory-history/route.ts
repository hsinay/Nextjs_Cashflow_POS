import { logger } from '@/lib/logger';
// app/api/products/[id]/inventory-history/route.ts

import { authOptions } from '@/lib/auth';
import { getInventoryHistoryForProduct } from '@/services/inventory.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string; // productId
    };
}

/**
 * GET /api/products/{id}/inventory-history
 * Returns inventory transaction history for a single product
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const history = await getInventoryHistoryForProduct(params.id);

        return NextResponse.json({ success: true, data: history }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/products/${params.id}/inventory-history error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
