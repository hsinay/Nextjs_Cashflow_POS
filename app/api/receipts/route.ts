import { authOptions } from '@/lib/auth';
import { receiptSchema } from '@/lib/validations/advanced-pos.schema';
import { advancedPOSService } from '@/services/advanced-pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = receiptSchema.parse(body);

    const receipt = await advancedPOSService.generateReceipt(data);

    return NextResponse.json(
      { success: true, data: receipt },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
