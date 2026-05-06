'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface TrialBalanceReport {
  [key: string]: any;
}

export default function TrialBalancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<TrialBalanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const start = searchParams.get('startDate') || '';
    const end = searchParams.get('endDate') || '';
    setStartDate(start);
    setEndDate(end);

    const fetchReport = async () => {
      try {
        const params = new URLSearchParams();
        if (start) params.append('startDate', start);
        if (end) params.append('endDate', end);

        const response = await fetch(`/api/accounting/trial-balance?${params}`);
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Failed to fetch trial balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [searchParams]);

  const handleGenerateReport = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    router.push(`/dashboard/accounting/trial-balance?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trial Balance</h1>
        <p className="text-gray-600 mt-1">A summary of all debits and credits in the ledger.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date range for the report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="startDate" className="text-sm font-medium mb-1">Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endDate" className="text-sm font-medium mb-1">End Date</label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
