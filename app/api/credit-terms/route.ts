/**
 * Credit Terms Configuration API Route
 * GET /api/credit-terms - Get payment terms and interest configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { creditService } from '@/services/credit.service';

export async function GET(_req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get configuration
    const config = creditService.getTermsConfig();

    // Get all payment terms
    const paymentTerms = [
      'IMMEDIATE',
      'NET_7',
      'NET_15',
      'NET_30',
      'NET_60',
      'END_OF_MONTH',
      'CUSTOM',
    ].map(term => ({
      code: term,
      ...creditService.getPaymentTerm(term),
    }));

    return NextResponse.json({
      success: true,
      data: {
        config,
        paymentTerms,
      },
    });
  } catch (error: unknown) {
    console.error('[Credit Terms GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
