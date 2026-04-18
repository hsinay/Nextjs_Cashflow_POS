import { logger } from '@/lib/logger';
import { authOptions } from '@/lib/auth';
import { posSessionService } from '@/services/pos-session.service';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * GET /api/pos-sessions/active
 * Get active POS session for current user
 */
export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeSession = await posSessionService.getActiveSession(session.user.id);

    if (!activeSession) {
      return NextResponse.json(
        { success: true, data: null, message: 'No active session' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activeSession,
    });
  } catch (error: any) {
    logger.error('Error fetching active POS session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch active session' },
      { status: error.statusCode || 500 }
    );
  }
}
