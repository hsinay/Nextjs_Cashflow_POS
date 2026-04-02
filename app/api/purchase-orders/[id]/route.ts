// app/api/purchase-orders/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { updatePurchaseOrderSchema } from '@/lib/validations/purchase-order.schema';
import {
    deletePurchaseOrder,
    getPurchaseOrderById,
    updatePurchaseOrder,
} from '@/services/purchase-order.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/purchase-orders/{id}
 * Returns a single purchase order
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const order = await getPurchaseOrderById(params.id);
        if (!order) {
            return NextResponse.json({ success: false, error: 'Purchase order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order }, { status: 200 });
    } catch (error) {
        console.error(`GET /api/purchase-orders/${params.id} error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/purchase-orders/{id}
 * Updates a purchase order
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        const validationResult = updatePurchaseOrderSchema.safeParse(body);
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
        const updatedOrder = await updatePurchaseOrder(params.id, data);
        
        return NextResponse.json({ success: true, data: updatedOrder }, { status: 200 });

    } catch (error: any) {
        console.error(`PUT /api/purchase-orders/${params.id} error:`, error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/purchase-orders/{id}
 * Deletes a purchase order
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'PURCHASE_MANAGER');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await deletePurchaseOrder(params.id);

        return NextResponse.json({ success: true, message: 'Purchase order deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error(`DELETE /api/purchase-orders/${params.id} error:`, error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
