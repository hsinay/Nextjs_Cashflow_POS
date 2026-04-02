// app/api/sales-orders/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { updateSalesOrderSchema } from '@/lib/validations/sales-order.schema';
import {
    deleteSalesOrder,
    getSalesOrderById,
    updateSalesOrder,
} from '@/services/sales-order.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/sales-orders/{id}
 * Returns a single sales order
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const order = await getSalesOrderById(params.id);
        if (!order) {
            return NextResponse.json({ success: false, error: 'Sales order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order }, { status: 200 });
    } catch (error) {
        console.error(`GET /api/sales-orders/${params.id} error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/sales-orders/{id}
 * Updates a sales order
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        const validationResult = updateSalesOrderSchema.safeParse(body);
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
        const updatedOrder = await updateSalesOrder(params.id, data);
        
        return NextResponse.json({ success: true, data: updatedOrder }, { status: 200 });

    } catch (error: any) {
        console.error(`PUT /api/sales-orders/${params.id} error:`, error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/sales-orders/{id}
 * Deletes a sales order
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'SALES_MANAGER');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await deleteSalesOrder(params.id);

        return NextResponse.json({ success: true, message: 'Sales order deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error(`DELETE /api/sales-orders/${params.id} error:`, error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
