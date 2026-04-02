// app/api/purchase-orders/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { createPurchaseOrderSchema, purchaseOrderFilterSchema } from '@/lib/validations/purchase-order.schema';
import {
    createPurchaseOrder,
    getAllPurchaseOrders,
} from '@/services/purchase-order.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/purchase-orders
 * Returns paginated purchase orders with filters
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
            supplierId: searchParams.get('supplierId') || undefined,
            status: searchParams.get('status') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validationResult = purchaseOrderFilterSchema.safeParse(filterParams);
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
        const result = await getAllPurchaseOrders(filters);

        return NextResponse.json(
            {
                success: true,
                data: result.orders,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/purchase-orders error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/purchase-orders
 * Create new purchase order
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'PURCHASE_MANAGER');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = createPurchaseOrderSchema.safeParse(body);
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
        const purchaseOrder = await createPurchaseOrder(data);

        return NextResponse.json(
            {
                success: true,
                message: 'Purchase order created successfully',
                data: purchaseOrder,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('POST /api/purchase-orders error:', error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
