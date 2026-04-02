/**
 * Apply Late Fees API Route
 * POST /api/credits/[customerId]/apply-late-fees - Calculate and apply late fees to overdue transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin only
    if (!session.user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customerId } = params;

    // Apply late fees
    const totalFeesApplied = await creditService.applyLateFees(
      customerId,
      session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          totalFeesApplied,
          message: `Late fees applied: Rs. ${totalFeesApplied.toFixed(2)}`,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Credit account not found' },
        { status: 404 }
      );
    }

    console.error('[Apply Late Fees POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
