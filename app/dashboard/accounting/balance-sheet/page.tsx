// app/dashboard/accounting/balance-sheet/page.tsx

import { authOptions } from '@/lib/auth';
import { getBalanceSheet } from '@/services/ledger.service';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BalanceSheetPageProps {
    searchParams: {
        date?: string;
    };
}

export default async function BalanceSheetPage({ searchParams }: BalanceSheetPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const date = searchParams.date ? new Date(searchParams.date) : undefined;

    const report = await getBalanceSheet(date);

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
                                defaultValue={searchParams.date}
                                className="w-[180px]"
                            />
                        </div>
                        <Link href={{
                            pathname: '/dashboard/accounting/balance-sheet',
                            query: {
                                date: (document.getElementById('date') as HTMLInputElement)?.value,
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
