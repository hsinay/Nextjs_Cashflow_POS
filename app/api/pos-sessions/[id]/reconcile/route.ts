// app/api/pos-sessions/[id]/reconcile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { posReconciliationService } from '@/services/pos-reconciliation.service';
import { z } from 'zod';

const reconcileSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = reconcileSchema.parse(body);

    const reconciled = await posReconciliationService.markReconciled(
      params.id,
      session.user.id || '',
      validated.notes
    );

    return NextResponse.json(
      { success: true, data: reconciled },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reconcile session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pos-sessions/[id]/reconcile
 * Get reconciliation data for a session
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reconciliation = await posReconciliationService.calculateReconciliation(params.id);

    return NextResponse.json(
      { success: true, data: reconciliation },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reconciliation' },
      { status: 500 }
    );
  }
}
