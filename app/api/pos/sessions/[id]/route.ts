import { logger } from '@/lib/logger';
// app/api/pos/sessions/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { updatePOSSessionSchema } from '@/lib/validations/pos.schema';
import {
    closePOSSession,
    getPOSSessionById,
} from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/pos/sessions/{id}
 * Returns a single POS session
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const posSession = await getPOSSessionById(params.id);
        if (!posSession) {
            return NextResponse.json({ success: false, error: 'POS Session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: posSession }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/pos/sessions/${params.id} error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/pos/sessions/{id}
 * Close POS session
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        const validationResult = updatePOSSessionSchema.safeParse(body);
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
        const closedSession = await closePOSSession(params.id, data);

        return NextResponse.json(
            {
                success: true,
                message: 'POS session closed successfully',
                data: closedSession,
            },
            { status: 200 }
        );
    } catch (error: any) {
        logger.error(`PUT /api/pos/sessions/${params.id} error:`, error);
        if (error.message?.includes('not found') || error.message?.includes('already closed')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
