// app/api/auth/change-password/route.ts

import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { changePasswordSchema } from '@/lib/validations/auth.schema';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 * 
 * Required body:
 * - oldPassword: string (must match current password)
 * - newPassword: string (8+ chars, uppercase, lowercase, number, special char)
 * - confirmPassword: string (must match newPassword)
 * 
 * Returns:
 * - 401 if not authenticated
 * - 400 if validation fails or old password is incorrect
 * - 200 if successful
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { oldPassword, newPassword } = result.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { success: true, message: 'Password changed successfully' },
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

    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
