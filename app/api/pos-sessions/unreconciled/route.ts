// app/api/pos-sessions/unreconciled/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { posReconciliationService } from '@/services/pos-reconciliation.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const sessions = await posReconciliationService.getUnreconciledSessions(limit);

    return NextResponse.json(
      { success: true, data: sessions, count: sessions.length },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unreconciled sessions' },
      { status: 500 }
    );
  }
}
