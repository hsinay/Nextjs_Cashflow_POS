import { authOptions } from '@/lib/auth';
import { getBalanceSheet } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date')
      ? new Date(searchParams.get('date')!)
      : undefined;

    const report = await getBalanceSheet(date);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance sheet' },
      { status: 500 }
    );
  }
}
