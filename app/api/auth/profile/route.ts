import { authOptions } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validations/profile.schema';
import { getUserProfile, updateProfile } from '@/services/profile.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserProfile(session.user.id);
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const user = await updateProfile(session.user.id, validated);
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: unknown[]; message?: string };
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
