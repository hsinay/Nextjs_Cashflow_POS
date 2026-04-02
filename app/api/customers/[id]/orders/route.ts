// app/api/customers/[id]/orders/route.ts

import { requireAuth } from '@/lib/auth-utils';
import { CustomerService } from '@/services/customer.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { status, page = '1', limit = '20' } = Object.fromEntries(request.nextUrl.searchParams.entries());
    const orders = await CustomerService.getCustomerOrders(params.id, { status, page: Number(page), limit: Number(limit) });
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
