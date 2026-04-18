import { logger } from '@/lib/logger';
// app/api/payments/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { updatePaymentSchema } from '@/lib/validations/payment.schema';
import { deletePayment, getPaymentById, updatePayment } from '@/services/payment.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/payments/{id}
 * Returns a single payment
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payment = await getPaymentById(params.id);
        if (!payment) {
            return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: payment }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/payments/${params.id} error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/payments/{id}
 * Updates a payment
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'ACCOUNTANT');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = updatePaymentSchema.safeParse(body);
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

        const payment = await updatePayment(params.id, validationResult.data);

        return NextResponse.json(
            { success: true, message: 'Payment updated successfully', data: payment },
            { status: 200 }
        );
    } catch (error: any) {
        logger.error(`PUT /api/payments/${params.id} error:`, error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        if (
            error.message?.includes('exceeds') ||
            error.message?.includes('not supported safely') ||
            error.message?.includes('does not match')
        ) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/payments/{id}
 * Deletes a payment
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'ACCOUNTANT');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await deletePayment(params.id);

        return NextResponse.json({ success: true, message: 'Payment deleted successfully' }, { status: 200 });
    } catch (error: any) {
        logger.error(`DELETE /api/payments/${params.id} error:`, error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
