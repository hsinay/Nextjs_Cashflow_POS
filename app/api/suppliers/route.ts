// app/api/suppliers/route.ts

import { requireAuth, requireRole } from '@/lib/auth-utils';
import { createSupplierSchema } from '@/lib/validations/supplier.schema';
import { SupplierService } from '@/services/supplier.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/suppliers
 * Returns paginated suppliers with filters
 * Query params: search, creditIssues, isActive, page, limit
 * Authentication required
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { search, creditIssues, isActive, page = '1', limit = '20' } = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    
    const filters = {
      search,
      creditIssues: creditIssues === 'true',
      isActive: isActive !== 'false',
      page: Number(page),
      limit: Number(limit),
    };
    
    const result = await SupplierService.getAllSuppliers(filters);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/suppliers
 * Create new supplier
 * Requires ADMIN or PURCHASE_MANAGER role
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await requireRole(['ADMIN', 'PURCHASE_MANAGER']);
    
    const body = await request.json();
    const data = createSupplierSchema.parse(body);
    const supplier = await SupplierService.createSupplier(data);
    
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
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
