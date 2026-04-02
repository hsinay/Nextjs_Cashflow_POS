// app/api/suppliers/[id]/balance/route.ts

import { requireAuth } from '@/lib/auth-utils';
import { SupplierService } from '@/services/supplier.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/suppliers/[id]/balance
 * Get detailed balance breakdown for supplier
 * Authentication required
 */
export async function GET(
  _request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const balance = await SupplierService.getSupplierBalance(params.id);
    
    if (!balance) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: balance }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
