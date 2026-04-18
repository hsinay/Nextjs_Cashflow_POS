import { logger } from '@/lib/logger';
import { authOptions } from '@/lib/auth';
import { closePOSSessionSchema } from '@/lib/validations/pos-session.schema';
import { posSessionService } from '@/services/pos-session.service';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * GET /api/pos-sessions/[id]
 * Get POS session details
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json({
      success: true,
      data: posSession,
    });
  } catch (error: any) {
    logger.error('Error fetching POS session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch POS session' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/pos-sessions/[id]
 * Close POS session
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = closePOSSessionSchema.parse(body);

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

    const closedSession = await posSessionService.closeSession(params.id, {
      closingCashAmount: validated.closingCashAmount,
      notes: validated.notes,
    });

    return NextResponse.json({
      success: true,
      data: closedSession,
    });
  } catch (error: any) {
    logger.error('Error closing POS session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to close POS session' },
      { status: error.statusCode || 500 }
    );
  }
}
