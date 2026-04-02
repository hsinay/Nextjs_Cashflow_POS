// app/dashboard/pos/reports/page.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function POSReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">POS Reports</h1>
                <p className="text-gray-600 mt-1">
                    Generate and view various Point of Sale reports.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Session History</CardTitle>
                        <CardDescription>Review past POS sessions and their summaries.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/pos/sessions">
                            <Button>View Sessions</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Browse detailed records of all transactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/pos/history">
                            <Button>View Transactions</Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Potentially add more report types here */}
            </div>
        </div>
    );
}
