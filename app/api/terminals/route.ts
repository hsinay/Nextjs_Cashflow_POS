import { authOptions } from '@/lib/auth';
import { terminalSchema } from '@/lib/validations/advanced-pos.schema';
import { advancedPOSService } from '@/services/advanced-pos.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can register terminals
    if (!session.user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = terminalSchema.parse(body);

    const terminal = await advancedPOSService.registerTerminal(data);

    return NextResponse.json(
      { success: true, data: terminal },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register terminal' },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const terminals = await advancedPOSService.getAllTerminals();

    return NextResponse.json({
      success: true,
      data: terminals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
