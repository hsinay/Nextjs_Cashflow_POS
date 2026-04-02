import { authOptions } from '@/lib/auth';
import { updateSessionTotalsSchema } from '@/lib/validations/pos-session.schema';
import { posSessionService } from '@/services/pos-session.service';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * POST /api/pos-sessions/[id]/update-totals
 * Update session payment totals
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateSessionTotalsSchema.parse(body);

    const posSession = await posSessionService.getSessionById(params.id);

    if (!posSession) {
      return NextResponse.json(
        { error: 'POS session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (posSession.cashierId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate session is open
    if (posSession.status !== 'OPEN') {
      return NextResponse.json(
        { error: `Cannot update closed session (status: ${posSession.status})` },
        { status: 409 }
      );
    }

    // Update totals
    await posSessionService.updateSessionTotals(
      params.id,
      validated.paymentMethod,
      validated.amount
    );

    return NextResponse.json({
      success: true,
      message: 'Session totals updated',
    });
  } catch (error: any) {
    console.error('Error updating POS session totals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update session totals' },
      { status: error.statusCode || 500 }
    );
  }
}
