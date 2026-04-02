// app/api/inventory/stock-posting/route.ts

import { authOptions } from '@/lib/auth';
import {
    calculateCOGS,
    getProductStockLevel,
    getStockMovementReport,
    getWarehouseStockSummary,
    postStock,
    validateStockLevels,
} from '@/services/stock-posting.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const postStockSchema = z.object({
  referenceId: z.string(),
  referenceType: z.enum(['GRN', 'PARTIAL_RECEIPT', 'ADJUSTMENT', 'TRANSFER']),
  postingDate: z.string().datetime(),
  entries: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitCost: z.number().positive(),
      batchNumber: z.string().optional(),
      expiryDate: z.string().datetime().optional(),
      storageLocation: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  approvedBy: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('INVENTORY_MANAGER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = postStockSchema.parse(body);

    const result = await postStock({
      referenceId: validated.referenceId,
      referenceType: validated.referenceType,
      postingDate: new Date(validated.postingDate),
      entries: validated.entries.map((e) => ({
        ...e,
        expiryDate: e.expiryDate ? new Date(e.expiryDate) : undefined,
      })),
      approvedBy: validated.approvedBy,
      notes: validated.notes,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (endpoint === 'warehouse-summary') {
      const summary = await getWarehouseStockSummary();
      return NextResponse.json({ success: true, data: summary });
    }

    if (endpoint === 'product-level' && productId) {
      const level = await getProductStockLevel(productId);
      return NextResponse.json({ success: true, data: level });
    }

    if (endpoint === 'movement-report' && startDate && endDate) {
      const report = await getStockMovementReport(
        new Date(startDate),
        new Date(endDate),
        productId || undefined
      );
      return NextResponse.json({ success: true, data: report });
    }

    if (endpoint === 'cogs' && startDate && endDate) {
      const cogs = await calculateCOGS(new Date(startDate), new Date(endDate));
      return NextResponse.json({ success: true, data: cogs });
    }

    if (endpoint === 'validate-levels') {
      const validation = await validateStockLevels();
      return NextResponse.json({ success: true, data: validation });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid endpoint' },
      { status: 400 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    );
  }
}
