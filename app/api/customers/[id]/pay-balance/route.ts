import { logger } from '@/lib/logger';
// app/api/customers/[id]/pay-balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/services/customer.service';
import { z } from 'zod';

const payBalanceSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    const body = await req.json();
    const { amount, paymentMethod } = payBalanceSchema.parse(body);

    const payment = await CustomerService.payBalance(
      customerId,
      amount,
      paymentMethod
    );

    return NextResponse.json({
      message: 'Payment successful',
      payment,
    });
  } catch (error: any) {
    logger.error('Error paying balance:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}
