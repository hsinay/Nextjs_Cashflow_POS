'use client';

import { DailyCashflowReportComponent } from '@/components/reports/daily-cashflow-report';
import { TrendAnalysisComponent } from '@/components/reports/trend-analysis-report';
import { VarianceAnalysisComponent } from '@/components/reports/variance-analysis-report';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Download, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

type ReportType = 'DAILY_CASHFLOW' | 'VARIANCE_ANALYSIS' | 'TREND_ANALYSIS';

export function ReportsPageClient() {
  const [reportType, setReportType] = useState<ReportType>('DAILY_CASHFLOW');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<unknown>(null);
  const [granularity, setGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          granularity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      setReportData(result.data.data);

      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // PDF export would require a backend service
      toast({
        title: 'Info',
        description: 'PDF export coming soon',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and view detailed business reports</p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>

        {/* Report Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { type: 'DAILY_CASHFLOW', label: 'Daily Cashflow', icon: '💰' },
            { type: 'VARIANCE_ANALYSIS', label: 'Variance Analysis', icon: '📊' },
            { type: 'TREND_ANALYSIS', label: 'Trend Analysis', icon: '📈' },
          ].map(option => (
            <button
              key={option.type}
              onClick={() => setReportType(option.type as ReportType)}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === option.type
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <p className="text-sm font-semibold text-gray-900 mt-2">{option.label}</p>
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Granularity for Trend Analysis */}
        {reportType === 'TREND_ANALYSIS' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Granularity</label>
            <div className="grid grid-cols-3 gap-2">
              {['DAILY', 'WEEKLY', 'MONTHLY'].map(g => (
                <button
                  key={g}
                  onClick={() => setGranularity(g as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold ${
                    granularity === g
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={!reportData || loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <>
          {reportType === 'DAILY_CASHFLOW' && (
            <DailyCashflowReportComponent data={reportData} />
          )}
          {reportType === 'VARIANCE_ANALYSIS' && (
            <VarianceAnalysisComponent data={reportData} />
          )}
          {reportType === 'TREND_ANALYSIS' && (
            <TrendAnalysisComponent data={reportData} />
          )}
        </>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Select a report type and date range, then click &quot;Generate Report&quot; to view analytics
          </p>
        </div>
      )}
    </div>
  );
}
