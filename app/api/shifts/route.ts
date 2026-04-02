import { authOptions } from '@/lib/auth';
import { shiftSchema } from '@/lib/validations/advanced-pos.schema';
import { advancedPOSService } from '@/services/advanced-pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = shiftSchema.parse(body);

    const shift = await advancedPOSService.openShift(data, session.user.id!);

    return NextResponse.json(
      { success: true, data: shift },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to open shift' },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shifts for current user
    // Shift model not yet implemented in Prisma schema
    const shifts: any[] = [];

    return NextResponse.json({
      success: true,
      data: shifts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
