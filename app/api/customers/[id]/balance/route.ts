// app/api/customers/[id]/balance/route.ts

import { requireAuth } from '@/lib/auth-utils';
import { CustomerService } from '@/services/customer.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const balance = await CustomerService.getCustomerBalance(params.id);
    return NextResponse.json({ success: true, data: balance }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
