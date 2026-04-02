// app/api/payments/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { createPaymentSchema, paymentFilterSchema } from '@/lib/validations/payment.schema';
import {
    createPayment,
    getAllPayments,
} from '@/services/payment.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payments
 * Returns paginated payments with filters
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
            payerType: searchParams.get('payerType') || undefined,
            payerId: searchParams.get('payerId') || undefined,
            paymentMethod: searchParams.get('paymentMethod') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validationResult = paymentFilterSchema.safeParse(filterParams);
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
        const result = await getAllPayments(filters);

        return NextResponse.json(
            {
                success: true,
                data: result.payments,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/payments error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/payments
 * Create new payment
 */
export async function POST(request: NextRequest) {
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
        const validationResult = createPaymentSchema.safeParse(body);
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
        const payment = await createPayment(data);

        return NextResponse.json(
            {
                success: true,
                message: 'Payment created successfully',
                data: payment,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('POST /api/payments error:', error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
