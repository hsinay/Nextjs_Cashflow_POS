// app/api/suppliers/[id]/orders/route.ts

import { requireAuth } from '@/lib/auth-utils';
import { SupplierService } from '@/services/supplier.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/suppliers/[id]/orders
 * Get paginated list of supplier's purchase orders
 * Query params: status, page, limit
 * Authentication required
 */
export async function GET(
  _request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { status, page = '1', limit = '20' } = Object.fromEntries(_request.nextUrl.searchParams.entries());
    
    const result = await SupplierService.getSupplierOrders(params.id, {
      status,
      page: Number(page),
      limit: Number(limit),
    });
    
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
