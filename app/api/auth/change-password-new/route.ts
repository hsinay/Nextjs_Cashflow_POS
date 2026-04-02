import { authOptions } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validations/profile.schema';
import { changePassword } from '@/services/profile.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = changePasswordSchema.parse(body);

    const result = await changePassword(session.user.id, validated);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: unknown[]; message?: string };
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    const errorMessage = err.message || 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
