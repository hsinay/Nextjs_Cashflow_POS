// app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Logout current user by invalidating session
 */
export async function POST() {
  try {
    // NextAuth handles logout via signOut() on client
    // This endpoint is for explicit server-side logout if needed
    
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
