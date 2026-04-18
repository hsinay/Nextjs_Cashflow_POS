import { logger } from '@/lib/logger';
// app/api/ledger/route.ts

import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { createLedgerEntrySchema, ledgerFilterSchema } from '@/lib/validations/ledger.schema';
import {
    createLedgerEntry,
    getAllLedgerEntries,
} from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/ledger
 * Returns paginated ledger entries with filters
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filterParams = {
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            account: searchParams.get('account') || undefined,
            referenceId: searchParams.get('referenceId') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validationResult = ledgerFilterSchema.safeParse(filterParams);
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
        const result = await getAllLedgerEntries(filters);

        return NextResponse.json(
            {
                success: true,
                data: result.entries,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('GET /api/ledger error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/ledger
 * Create new manual ledger entry
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
        const validationResult = createLedgerEntrySchema.safeParse(body);
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
        const ledgerEntry = await createLedgerEntry(data);

        return NextResponse.json(
            {
                success: true,
                message: 'Ledger entry created successfully',
                data: ledgerEntry,
            },
            { status: 201 }
        );
    } catch (error: any) {
        logger.error('POST /api/ledger error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
