// app/dashboard/purchase-orders/[id]/page.tsx

import { PaymentStatusBadge } from '@/components/purchase-orders/payment-status-badge';
import { PurchaseOrderDetailsClient } from '@/components/purchase-orders/purchase-order-details-client';
import { PurchaseOrderStatusBadge } from '@/components/purchase-orders/purchase-order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { getPurchaseOrderById, getPurchaseOrderPayments } from '@/services/purchase-order.service';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

interface PurchaseOrderPageProps {
    params: {
        id: string;
    };
}

export default async function PurchaseOrderPage({ params }: PurchaseOrderPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const order = await getPurchaseOrderById(params.id);

    if (!order) {
        notFound();
    }

    // Fetch linked payments
    const payments = await getPurchaseOrderPayments(params.id);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900">Purchase Order #{order.id.substring(0, 8)}</h1>
                    <p className="text-slate-600">
                        Details for order placed on {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <PurchaseOrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.product?.name || 'N/A'}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong>Name:</strong> {order.supplier?.name}</p>
                            <p><strong>Email:</strong> {order.supplier?.email}</p>
                            <p><strong>Contact:</strong> {order.supplier?.contactNumber}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span>Total Amount</span>
                                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-3">
                                <span>Paid Amount</span>
                                <span className="font-semibold text-green-600">{formatCurrency(order.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Outstanding Balance</span>
                                <span className="font-semibold text-orange-600">{formatCurrency(order.balanceAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-3">
                                <span>Payment Status</span>
                                <PaymentStatusBadge status={order.paymentStatus} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Tracking Section - Client Component */}
            <PurchaseOrderDetailsClient 
                purchaseOrderId={params.id}
                totalAmount={order.totalAmount}
                paidAmount={order.paidAmount}
                initialPayments={payments}
            />
        </div>
    );
}
