import { authOptions } from '@/lib/auth';
import { shiftCloseSchema } from '@/lib/validations/advanced-pos.schema';
import { advancedPOSService } from '@/services/advanced-pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { closingBalance, notes } = shiftCloseSchema.parse({
      shiftId: params.id,
      closingBalance: body.closingBalance,
      notes: body.notes,
    });

    const shift = await advancedPOSService.closeShift(params.id, closingBalance, notes);

    return NextResponse.json({
      success: true,
      data: shift,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to close shift' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shift = { id: params.id, status: 'CLOSED', notes: '' };

    return NextResponse.json({
      success: true,
      data: shift,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Shift not found' },
      { status: 404 }
    );
  }
}
