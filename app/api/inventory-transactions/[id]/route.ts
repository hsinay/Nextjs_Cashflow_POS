import { logger } from '@/lib/logger';
// app/api/inventory-transactions/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/inventory-transactions/{id}
 * Returns a single inventory transaction
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const transaction = await prisma.inventoryTransaction.findUnique({
            where: { id: params.id },
            include: { product: true },
        });

        if (!transaction) {
            return NextResponse.json({ success: false, error: 'Inventory transaction not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: transaction }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/inventory-transactions/${params.id} error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
