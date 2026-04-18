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
  req: Request,
  { params }: { params: { id: string; paymentId: string } }
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

    await deleteOrderPayment(params.paymentId);

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
