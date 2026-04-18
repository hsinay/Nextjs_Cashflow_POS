import { logger } from '@/lib/logger';
// app/api/purchase-orders/[id]/payments/route.ts

import { authOptions } from '@/lib/auth';
import { linkPaymentToPOSchema, unlinkPaymentFromPOSchema } from '@/lib/validations/purchase-order.schema';
import {
    getPurchaseOrderPayments,
    linkPaymentToPurchaseOrder,
    unlinkPaymentFromPurchaseOrder
} from '@/services/purchase-order.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string; // purchaseOrderId
    };
}

/**
 * GET /api/purchase-orders/{id}/payments
 * Returns payments associated with a specific purchase order
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payments = await getPurchaseOrderPayments(params.id);

        return NextResponse.json({ success: true, data: payments }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/purchase-orders/${params.id}/payments error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/purchase-orders/{id}/payments
 * Link a payment to a purchase order
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check authorization - user must have INVENTORY_MANAGER or ADMIN role
        const hasPermission = 
            session.user.roles?.includes('ADMIN') || 
            session.user.roles?.includes('INVENTORY_MANAGER');
        
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validated = linkPaymentToPOSchema.parse(body);

        const updatedPO = await linkPaymentToPurchaseOrder(params.id, validated.paymentId);

        return NextResponse.json({ 
            success: true, 
            data: updatedPO,
            message: 'Payment linked successfully' 
        }, { status: 200 });
    } catch (error: any) {
        logger.error(`POST /api/purchase-orders/${params.id}/payments error:`, error);
        
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: error.message?.includes('not found') ? 404 : 500 }
        );
    }
}

/**
 * DELETE /api/purchase-orders/{id}/payments/{paymentId}
 * Unlink a payment from a purchase order
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check authorization
        const hasPermission = 
            session.user.roles?.includes('ADMIN') || 
            session.user.roles?.includes('INVENTORY_MANAGER');
        
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validated = unlinkPaymentFromPOSchema.parse(body);

        const updatedPO = await unlinkPaymentFromPurchaseOrder(params.id, validated.paymentId);

        return NextResponse.json({ 
            success: true, 
            data: updatedPO,
            message: 'Payment unlinked successfully' 
        }, { status: 200 });
    } catch (error: any) {
        logger.error(`DELETE /api/purchase-orders/${params.id}/payments error:`, error);
        
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: error.message?.includes('not found') ? 404 : 500 }
        );
    }
}
