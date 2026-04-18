import { logger } from '@/lib/logger';
import { authOptions } from '@/lib/auth';
import { posSessionService } from '@/services/pos-session.service';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * GET /api/pos-sessions/[id]/summary
 * Get POS session summary
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

    const summary = await posSessionService.getSessionSummary(params.id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error('Error fetching POS session summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch session summary' },
      { status: error.statusCode || 500 }
    );
  }
}
