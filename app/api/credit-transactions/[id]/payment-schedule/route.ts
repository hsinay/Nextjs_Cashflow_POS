/**
 * Payment Schedule API Route
 * GET /api/credit-transactions/[id]/payment-schedule - Get payment installment schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Parse query for number of installments
    const numberOfInstallments = parseInt(
      req.nextUrl.searchParams.get('installments') || '1'
    );

    if (numberOfInstallments < 1 || numberOfInstallments > 12) {
      return NextResponse.json(
        { error: 'Installments must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Get payment schedule
    const schedule = await creditService.getPaymentSchedule(
      id,
      numberOfInstallments
    );

    const summary = {
      totalAmount: schedule.reduce((sum, s) => sum + s.amount, 0),
      numberOfInstallments: schedule.length,
      totalPending: schedule.filter(s => s.status === 'PENDING').length,
      totalPaid: schedule.filter(s => s.status === 'PAID').length,
      nextDueDate: schedule.find(s => s.daysToDue > 0)?.dueDate || null,
      daysToNextPayment:
        schedule.find(s => s.daysToDue > 0)?.daysToDue || null,
    };

    return NextResponse.json({
      success: true,
      data: { schedule, summary },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    console.error('[Payment Schedule GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
