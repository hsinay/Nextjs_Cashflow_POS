// app/dashboard/accounting/profit-loss/page.tsx

import { authOptions } from '@/lib/auth';
import { getProfitAndLossStatement } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProfitLossPageProps {
    searchParams: {
        startDate?: string;
        endDate?: string;
    };
}

export default async function ProfitLossPage({ searchParams }: ProfitLossPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const startDate = searchParams.startDate ? new Date(searchParams.startDate) : undefined;
    const endDate = searchParams.endDate ? new Date(searchParams.endDate) : undefined;

    const report = await getProfitAndLossStatement(startDate, endDate);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
                <p className="text-gray-600 mt-1">Analyze your company's financial performance over a period.</p>
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
                                defaultValue={searchParams.startDate}
                                className="w-[180px]"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="endDate" className="text-sm font-medium mb-1">End Date</label>
                            <Input
                                id="endDate"
                                type="date"
                                defaultValue={searchParams.endDate}
                                className="w-[180px]"
                            />
                        </div>
                        <Link href={{
                            pathname: '/dashboard/accounting/profit-loss',
                            query: {
                                startDate: (document.getElementById('startDate') as HTMLInputElement)?.value,
                                endDate: (document.getElementById('endDate') as HTMLInputElement)?.value,
                            }
                        }}>
                            <Button>Generate Report</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Report Data</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for report data */}
                    <pre>{JSON.stringify(report, null, 2)}</pre>
                </CardContent>
            </Card>
        </div>
    );
}
