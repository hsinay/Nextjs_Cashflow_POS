import { logger } from '@/lib/logger';
// app/api/sales-orders/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { createSalesOrderSchema, salesOrderFilterSchema } from '@/lib/validations/sales-order.schema';
import {
    createSalesOrder,
    getAllSalesOrders,
} from '@/services/sales-order.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sales-orders
 * Returns paginated sales orders with filters
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filterParams = {
            search: searchParams.get('search') || undefined,
            customerId: searchParams.get('customerId') || undefined,
            status: searchParams.get('status') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validationResult = salesOrderFilterSchema.safeParse(filterParams);
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
        const result = await getAllSalesOrders(filters);

        return NextResponse.json(
            {
                success: true,
                data: result.orders,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('GET /api/sales-orders error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/sales-orders
 * Create new sales order
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'SALES_MANAGER');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = createSalesOrderSchema.safeParse(body);
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
        const salesOrder = await createSalesOrder(data);

        return NextResponse.json(
            {
                success: true,
                message: 'Sales order created successfully',
                data: salesOrder,
            },
            { status: 201 }
        );
    } catch (error: any) {
        logger.error('POST /api/sales-orders error:', error);
        if (error.message?.includes('Not enough stock')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 409 });
        }
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
