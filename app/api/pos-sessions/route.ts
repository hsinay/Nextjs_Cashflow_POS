import { logger } from '@/lib/logger';
import { authOptions } from '@/lib/auth';
import {
    createPOSSessionSchema,
    listPOSSessionsSchema,
} from '@/lib/validations/pos-session.schema';
import { posSessionService } from '@/services/pos-session.service';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * POST /api/pos-sessions
 * Create a new POS session
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createPOSSessionSchema.parse(body);

    const posSession = await posSessionService.createSession({
      cashierId: session.user.id,
      terminalId: validated.terminalId,
      openingCashAmount: validated.openingCashAmount,
      notes: validated.notes,
    });

    return NextResponse.json(
      { success: true, data: posSession },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating POS session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create POS session' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * GET /api/pos-sessions
 * List POS sessions for current user
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';

    const validated = listPOSSessionsSchema.parse({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const sessions = await posSessionService.listSessions(
      session.user.id,
      validated.status as any,
      validated.limit
    );

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    logger.error('Error listing POS sessions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list POS sessions' },
      { status: error.statusCode || 500 }
    );
  }
}
