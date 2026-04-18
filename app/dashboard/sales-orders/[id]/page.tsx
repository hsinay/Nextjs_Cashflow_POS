// app/dashboard/sales-orders/[id]/page.tsx

import { OrderStatusBadge } from '@/components/sales-orders/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import { getSalesOrderById } from '@/services/sales-order.service';
import { formatCurrency } from '@/lib/currency';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

interface SalesOrderPageProps {
    params: {
        id: string;
    };
}

export default async function SalesOrderPage({ params }: SalesOrderPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const order = await getSalesOrderById(params.id);

    if (!order) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Sales Order #{order.id.substring(0, 8)}</h1>
                    <p className="text-gray-600 mt-1">
                        Details for order placed on {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                </div>
                <OrderStatusBadge status={order.status} />
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
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong>Name:</strong> {order.customer?.name}</p>
                            <p><strong>Email:</strong> {order.customer?.email}</p>
                            <p><strong>Contact:</strong> {order.customer?.contactNumber}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>{formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
