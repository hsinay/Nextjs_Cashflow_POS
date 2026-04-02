// app/api/suppliers/[id]/route.ts

import { requireAuth, requireRole } from '@/lib/auth-utils';
import { updateSupplierSchema } from '@/lib/validations/supplier.schema';
import { SupplierService } from '@/services/supplier.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/suppliers/[id]
 * Get single supplier with calculated balance
 * Authentication required
 */
export async function GET(
  _request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const supplier = await SupplierService.getSupplierById(params.id);
    
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: supplier }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/suppliers/[id]
 * Update supplier
 * Requires ADMIN or PURCHASE_MANAGER role
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    await requireRole(['ADMIN', 'PURCHASE_MANAGER']);
    
    const body = await request.json();
    const data = updateSupplierSchema.parse(body);
    const supplier = await SupplierService.updateSupplier(params.id, data);
    
    return NextResponse.json({ success: true, data: supplier }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Soft delete supplier (set isActive = false)
 * Requires ADMIN role
 */
export async function DELETE(
  _request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    await requireRole(['ADMIN']);
    
    await SupplierService.deleteSupplier(params.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'HAS_ORDERS') {
      return NextResponse.json({ success: false, error: 'Supplier has purchase orders.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
