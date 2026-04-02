import { authOptions } from '@/lib/auth';
import { reportService } from '@/services/report.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, startDate, endDate } = body;

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: type, startDate, endDate' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let reportData;

    switch (type) {
      case 'DAILY_CASHFLOW':
        reportData = await reportService.generateDailyCashflowReport(start, end);
        break;

      case 'VARIANCE_ANALYSIS':
        reportData = await reportService.generateVarianceAnalysis(start, end);
        break;

      case 'TREND_ANALYSIS':
        const granularity = body.granularity || 'DAILY';
        reportData = await reportService.generateTrendAnalysis(start, end, granularity);
        break;

      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        period: { startDate, endDate },
        generatedAt: new Date(),
        data: reportData,
      },
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
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

    // Get list of available report types
    return NextResponse.json({
      success: true,
      data: {
        availableReports: [
          'DAILY_CASHFLOW',
          'VARIANCE_ANALYSIS',
          'TREND_ANALYSIS',
          'SESSION_SUMMARY',
          'PAYMENT_BREAKDOWN',
          'SALES_REPORT',
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
