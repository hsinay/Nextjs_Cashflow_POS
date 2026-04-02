// app/dashboard/accounting/page.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AccountingOverviewPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-900">Accounting Dashboard</h1>
                <p className="text-slate-600 mt-2">Manage and view your financial records.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>General Ledger</CardTitle>
                        <CardDescription>View all detailed ledger entries.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/accounting/ledger">
                            <Button>View Ledger</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Trial Balance</CardTitle>
                        <CardDescription>Generate a summary of all ledger accounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/accounting/trial-balance">
                            <Button>View Trial Balance</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Profit & Loss</CardTitle>
                        <CardDescription>Analyze your company's financial performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/accounting/profit-loss">
                            <Button>View P&L</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Balance Sheet</CardTitle>
                        <CardDescription>Get a snapshot of your company's financial position.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/accounting/balance-sheet">
                            <Button>View Balance Sheet</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
