// app/api/ledger/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { getLedgerEntryById } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/ledger/{id}
 * Returns a single ledger entry
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const ledgerEntry = await getLedgerEntryById(params.id);
        if (!ledgerEntry) {
            return NextResponse.json({ success: false, error: 'Ledger entry not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: ledgerEntry }, { status: 200 });
    } catch (error) {
        console.error(`GET /api/ledger/${params.id} error:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
