// app/api/purchase-orders/[id]/grn/route.ts

import { authOptions } from '@/lib/auth';
import { createGRN, getGRNsForPO, getPOReceivingStatus } from '@/services/grn.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating GRN
const createGRNSchema = z.object({
  grnDate: z.string().datetime(),
  items: z.array(
    z.object({
      purchaseOrderItemId: z.string().uuid(),
      quantityReceived: z.number().int().positive(),
      quantityInspected: z.number().int().optional(),
      quantityRejected: z.number().int().optional(),
      batchNumber: z.string().optional(),
      expiryDate: z.string().datetime().optional(),
      notes: z.string().optional(),
    })
  ),
  receivedBy: z.string().min(1),
  inspectionNotes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint === 'status') {
      const status = await getPOReceivingStatus(params.id);
      return NextResponse.json({ success: true, data: status });
    }

    const grns = await getGRNsForPO(params.id);
    return NextResponse.json({ success: true, data: grns });
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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('INVENTORY_MANAGER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = createGRNSchema.parse(body);

    const grn = await createGRN({
      purchaseOrderId: params.id,
      grnDate: new Date(validated.grnDate),
      items: validated.items.map((item) => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        quantityReceived: item.quantityReceived,
        quantityInspected: item.quantityInspected,
        quantityRejected: item.quantityRejected,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        notes: item.notes,
      })),
      receivedBy: validated.receivedBy,
      inspectionNotes: validated.inspectionNotes,
    });

    return NextResponse.json({ success: true, data: grn }, { status: 201 });
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
