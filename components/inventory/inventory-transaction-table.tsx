'use client';

import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useUrlSort } from '@/lib/use-url-sort';
import { InventoryTransaction } from '@/types/inventory.types';

interface InventoryTransactionTableProps {
  transactions: InventoryTransaction[];
}

export function InventoryTransactionTable({ transactions }: InventoryTransactionTableProps) {
  const { sortField, sortDir, handleSort } = useUrlSort();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead field="product.name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Product</SortableTableHead>
          <SortableTableHead field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Type</SortableTableHead>
          <SortableTableHead field="quantity" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Quantity</SortableTableHead>
          <TableHead className="text-right">Unit Cost</TableHead>
          <SortableTableHead field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Date</SortableTableHead>
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
