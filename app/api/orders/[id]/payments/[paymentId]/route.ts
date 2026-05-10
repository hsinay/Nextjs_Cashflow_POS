import { logger } from '@/lib/logger';
// app/api/orders/[id]/payments/[paymentId]/route.ts

import { authOptions } from '@/lib/auth';
import { deleteOrderPayment } from '@/services/order-payment.service';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/orders/[id]/payments/[paymentId]
 * Delete a payment record (admin only)
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const hasAdminRole = session.user.roles?.includes('ADMIN');
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { paymentId } = await params;
    await deleteOrderPayment(paymentId);

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error deleting payment:');
    const msg = error.message || '';
    if (msg.includes('not found') || msg.includes('Not found')) {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg.includes('not linked')) {
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: msg || 'Internal server error' },
      { status: 500 }
    );
  }
}
