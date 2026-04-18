import { logger } from '@/lib/logger';
// app/api/pos/sessions/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { createPOSSessionSchema, posSessionFilterSchema } from '@/lib/validations/pos.schema';
import {
    getAllPOSSessions,
    openPOSSession,
} from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/pos/sessions
 * Returns paginated POS sessions with filters
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filterParams = {
            cashierId: searchParams.get('cashierId') || undefined,
            status: searchParams.get('status') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validationResult = posSessionFilterSchema.safeParse(filterParams);
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
        const result = await getAllPOSSessions(filters);

        return NextResponse.json(
            {
                success: true,
                data: result.sessions,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('GET /api/pos/sessions error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/pos/sessions
 * Open new POS session
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hasPermission = hasRole(session.user, 'ADMIN') || hasRole(session.user, 'CASHIER');
        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        
        // If no cashierId provided, use the logged-in user's ID
        if (!body.cashierId) {
            body.cashierId = session.user.id;
        }
        
        const validationResult = createPOSSessionSchema.safeParse(body);
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
        const posSession = await openPOSSession(data);

        return NextResponse.json(
            {
                success: true,
                message: 'POS session opened successfully',
                data: posSession,
            },
            { status: 201 }
        );
    } catch (error: any) {
        logger.error('POST /api/pos/sessions error:', error);
        if (error.message?.includes('not found')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
