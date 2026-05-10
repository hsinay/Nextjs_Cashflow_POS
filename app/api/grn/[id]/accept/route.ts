// app/api/grn/[id]/accept/route.ts

import { authOptions } from '@/lib/auth';
import { acceptGRN } from '@/services/grn.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const acceptGRNSchema = z.object({
  acceptedBy: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    acceptGRNSchema.parse(body);

    await acceptGRN((await params).id);

    return NextResponse.json({ success: true, message: 'GRN accepted' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes('not found')) {
        return NextResponse.json({ success: false, error: msg }, { status: 404 });
      }
      if (msg.includes('must be') || msg.includes('already')) {
        return NextResponse.json({ success: false, error: msg }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    );
  }
}
