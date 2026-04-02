// components/inventory/inventory-transaction-table.tsx

'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { InventoryTransaction } from '@/types/inventory.types';

interface InventoryTransactionTableProps {
  transactions: InventoryTransaction[];
}

export function InventoryTransactionTable({ transactions }: InventoryTransactionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead className="text-right">Unit Cost</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Reference ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">{transaction.product?.name || 'N/A'}</TableCell>
            <TableCell>{transaction.type.replace('_', ' ')}</TableCell>
            <TableCell>{transaction.quantity}</TableCell>
            <TableCell className="text-right">N/A</TableCell>
            <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>{transaction.notes || 'N/A'}</TableCell>
            <TableCell>{transaction.referenceId || 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
