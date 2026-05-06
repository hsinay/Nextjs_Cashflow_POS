'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface BalanceSheetReport {
  [key: string]: any;
}

export default function BalanceSheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState('');
  const [report, setReport] = useState<BalanceSheetReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reportDate = searchParams.get('date') || '';
    setDate(reportDate);

    const fetchReport = async () => {
      try {
        const params = new URLSearchParams();
        if (reportDate) params.append('date', reportDate);

        const response = await fetch(`/api/accounting/balance-sheet?${params}`);
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Failed to fetch balance sheet:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [searchParams]);

  const handleGenerateReport = () => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    router.push(`/dashboard/accounting/balance-sheet?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Balance Sheet</h1>
        <p className="text-gray-600 mt-1">A snapshot of your company's assets, liabilities, and equity at a specific point in time.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select a date for the report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="date" className="text-sm font-medium mb-1">Date</label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-600">Loading report...</p>
          ) : report ? (
            <pre>{JSON.stringify(report, null, 2)}</pre>
          ) : (
            <p className="text-gray-600">No report data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
