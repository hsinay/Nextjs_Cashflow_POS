// app/api/auth/me/route.ts

import { requireAuth } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 * 
 * Returns:
 * - User data including roles and permissions
 * - 401 if not authenticated
 */
export async function GET() {
  try {
    const session = await requireAuth();

    return NextResponse.json(
      {
        success: true,
        data: session.user,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as { status?: number };
    if (err?.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
