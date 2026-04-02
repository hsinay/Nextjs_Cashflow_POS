import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedPOSService } from '@/services/advanced-pos.service';
import { refundApprovalSchema } from '@/lib/validations/advanced-pos.schema';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN/ACCOUNTANT can approve refunds
    const allowedRoles = ['ADMIN', 'ACCOUNTANT'];
    if (!session.user.roles?.some((r: string) => allowedRoles.includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status, notes } = refundApprovalSchema.parse({
      refundId: params.id,
      status: body.status,
      notes: body.notes,
    });

    const refund = await advancedPOSService.updateRefundStatus(
      params.id,
      status,
      session.user.id!,
      notes
    );

    return NextResponse.json({
      success: true,
      data: refund,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update refund' },
      { status: 500 }
    );
  }
}
