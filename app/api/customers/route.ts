// app/api/customers/route.ts

import { requireAuth, requireRole } from '@/lib/auth-utils';
import { CustomerService } from '@/services/customer.service';
import { CustomerSegment } from '@/types/customer.types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { search, segment, highRisk, creditIssues, page = '1', limit = '20' } = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = {
      search: search || undefined,
      segment: (segment as CustomerSegment) || undefined,
      highRisk: highRisk === 'true',
      creditIssues: creditIssues === 'true',
      page: Number(page),
      limit: Number(limit),
    };
    const result = await CustomerService.getAllCustomers(filters);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await requireRole(['ADMIN', 'SALES_MANAGER']);
    const body = await request.json();
    const customer = await CustomerService.createCustomer(body);
    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
