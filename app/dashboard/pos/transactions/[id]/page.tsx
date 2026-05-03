import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import { formatCurrency } from '@/lib/currency';
import { getTransactionById } from '@/services/pos.service';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface POSTransactionPageProps {
  params: {
    id: string;
  };
}

export default async function POSTransactionPage({
  params,
}: POSTransactionPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const transaction = await getTransactionById(params.id);

  if (!transaction) {
    notFound();
  }

  const subtotal =
    transaction.items?.reduce((sum, item) => sum + item.totalPrice, 0) ??
    transaction.totalAmount - transaction.taxAmount;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/pos/history">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to POS History
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              POS Transaction #{transaction.transactionNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Recorded on {new Date(transaction.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">
            {transaction.sessionId && (
              <Link href={`/dashboard/pos/sessions/${transaction.sessionId}`}>
                <Button variant="outline">View Session</Button>
              </Link>
            )}
            <Link href={`/api/pos/transactions/${transaction.id}/receipt`}>
              <Button variant="outline">Receipt Data</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name || 'Product'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.discountApplied)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.taxAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.totalPrice + item.taxAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.paymentDetails?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paymentMethod.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{payment.referenceNumber || 'N/A'}</TableCell>
                      <TableCell>{payment.status}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Customer</span>
                <span>{transaction.customer?.name || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier</span>
                <span>{transaction.cashier?.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span>{transaction.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span>{transaction.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(transaction.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{formatCurrency(transaction.discountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {transaction.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{transaction.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
