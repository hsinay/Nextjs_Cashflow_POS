// app/api/inventory-transactions/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { createInventoryTransactionSchema, inventoryTransactionFilterSchema } from '@/lib/validations/inventory.schema';
import {
    createInventoryTransaction,
    getAllInventoryTransactions,
} from '@/services/inventory.service';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/inventory-transactions
 * Returns paginated inventory transactions with filters
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filterParams = {
            productId: searchParams.get('productId') || undefined,
            transactionType: searchParams.get('transactionType') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validationResult = inventoryTransactionFilterSchema.safeParse(filterParams);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid filters',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const filters = validationResult.data;
        const result = await getAllInventoryTransactions(filters);

        return NextResponse.json(
            {
                success: true,
                data: result.transactions,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/inventory-transactions error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/inventory-transactions
 * Create new manual inventory adjustment
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'INVENTORY_MANAGER');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = createInventoryTransactionSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Manually adjust product stock
        await prisma.product.update({
            where: { id: data.productId },
            data: {
                stockQuantity: {
                    increment: data.quantity * (data.transactionType === 'ADJUSTMENT' ? 1 : (data.transactionType === 'RETURN' ? 1 : -1)),
                },
            },
        });

        const transaction = await createInventoryTransaction(data);

        return NextResponse.json(
            {
                success: true,
                message: 'Inventory adjustment created successfully',
                data: transaction,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('POST /api/inventory-transactions error:', error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
