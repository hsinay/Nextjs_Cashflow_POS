import { authOptions } from '@/lib/auth';
import { getProfitAndLossStatement } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    const report = await getProfitAndLossStatement(startDate, endDate);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching profit and loss statement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profit and loss statement' },
      { status: 500 }
    );
  }
}
