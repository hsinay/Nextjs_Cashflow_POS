import { logger } from '@/lib/logger';
import { authOptions } from '@/lib/auth';
import { reportService } from '@/services/report.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Missing report type parameter' },
        { status: 400 }
      );
    }

    // Date range parsed but using generic report retrieval
    new Date(id.split('_')[0]);
    new Date(id.split('_')[1]);

    let reportData;

    switch (type) {
      case 'SESSION_SUMMARY':
        reportData = await reportService.generateSessionSummaryReport(id);
        break;

      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        type,
        data: reportData,
        generatedAt: new Date(),
      },
    });
  } catch (error: any) {
    logger.error('Report retrieval error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}
