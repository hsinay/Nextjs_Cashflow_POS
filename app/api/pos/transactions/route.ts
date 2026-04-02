// app/api/pos/transactions/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { createTransactionSchema, transactionFilterSchema } from '@/lib/validations/pos.schema';
import { ApiError } from '@/lib/errors';
import {
    createTransaction,
    getAllTransactions,
} from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/pos/transactions
 * Returns paginated POS transactions with filters
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
            cashierId: searchParams.get('cashierId') || undefined,
            sessionId: searchParams.get('sessionId') || undefined,
            status: searchParams.get('status') || undefined,
            paymentMethod: searchParams.get('paymentMethod') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validationResult = transactionFilterSchema.safeParse(filterParams);
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
        const result = await getAllTransactions(filters);

        return NextResponse.json(
            {
                success: true,
                data: result.transactions,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/pos/transactions error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/pos/transactions
 * Create new POS transaction
 */
export async function POST(request: NextRequest) {
    let body;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'CASHIER');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        body = await request.json();
        const validationResult = createTransactionSchema.safeParse(body);
        if (!validationResult.success) {
            throw new z.ZodError(validationResult.error.errors);
        }

        const data = validationResult.data;
        const transaction = await createTransaction(data);

        return NextResponse.json(
            {
                success: true,
                message: 'Transaction created successfully',
                data: transaction,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('POST /api/pos/transactions error:', {
            error: error.message,
            stack: error.stack,
            requestBody: body,
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        if (error instanceof ApiError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
