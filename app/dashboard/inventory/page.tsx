// app/dashboard/inventory/page.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function InventoryOverviewPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-900">Inventory Management</h1>
                <p className="text-slate-600 mt-2">Manage and track your product inventory.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>View Transactions</CardTitle>
                        <CardDescription>Browse all inventory movement history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/inventory/transactions">
                            <Button>View Transactions</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Manual Adjustment</CardTitle>
                        <CardDescription>Perform manual stock adjustments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/inventory/adjustments">
                            <Button>Create Adjustment</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Physical Inventory</CardTitle>
                        <CardDescription>Manage inventory counts and track variance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/inventory/physical-inventory">
                            <Button>View Counts</Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Potentially add more cards for reports, low stock alerts, etc. */}
            </div>
        </div>
    );
}
