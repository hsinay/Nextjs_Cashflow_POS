// app/api/purchase-orders/[id]/partial-receipt/route.ts

import { authOptions } from '@/lib/auth';
import {
    createPartialReceipt,
    getPartialReceiptsForPO,
    getReceivingSchedule,
} from '@/services/partial-receipt.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createPartialReceiptSchema = z.object({
  receiptNumber: z.string().min(1),
  receiptDate: z.string().datetime(),
  items: z.array(
    z.object({
      purchaseOrderItemId: z.string().uuid(),
      quantityReceived: z.number().int().positive(),
      quantityRejected: z.number().int().optional(),
    })
  ),
  supplierNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint === 'schedule') {
      const schedule = await getReceivingSchedule(params.id);
      return NextResponse.json({ success: true, data: schedule });
    }

    const receipts = await getPartialReceiptsForPO(params.id);
    return NextResponse.json({ success: true, data: receipts });
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

    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('INVENTORY_MANAGER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = createPartialReceiptSchema.parse(body);

    const receipt = await createPartialReceipt({
      purchaseOrderId: params.id,
      receiptDate: new Date(validated.receiptDate),
      items: validated.items,
      supplierNotes: validated.supplierNotes,
      internalNotes: validated.internalNotes,
      receivedById: session.user.id,
    });

    return NextResponse.json({ success: true, data: receipt }, { status: 201 });
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
