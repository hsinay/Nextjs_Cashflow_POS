// components/pos/pos-transaction-table.tsx

'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Transaction } from '@/types/pos.types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface POSTransactionTableProps {
  transactions: Transaction[];
}

export function POSTransactionTable({ transactions }: POSTransactionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Cashier</TableHead>
          <TableHead>Session ID</TableHead>
          <TableHead className="text-right">Total Amount</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">{transaction.transactionNumber}</TableCell>
            <TableCell>{transaction.customer?.name || 'Walk-in'}</TableCell>
            <TableCell>{transaction.cashier?.username || 'N/A'}</TableCell>
            <TableCell>{transaction.sessionId?.substring(0, 8) || 'N/A'}</TableCell>
            <TableCell className="text-right">{formatCurrency(transaction.totalAmount)}</TableCell>
            <TableCell>
              <Badge>{transaction.paymentMethod.replace('_', ' ')}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'outline'}>
                {transaction.status}
              </Badge>
            </TableCell>
            <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
            <TableCell>
                <Link href={`/dashboard/pos/transactions/${transaction.id}`}>
                    <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" /> View Receipt
                    </Button>
                </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
