// components/sales-orders/sales-order-table.tsx

'use client';

import { OrderStatusBadge } from '@/components/sales-orders/order-status-badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { SalesOrder } from '@/types/sales-order.types';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface SalesOrderTableProps {
  orders: SalesOrder[];
  onDelete: (id: string) => Promise<void>;
}

export function SalesOrderTable({ orders, onDelete }: SalesOrderTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
            <TableCell>{order.customer?.name || 'N/A'}</TableCell>
            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Link href={`/dashboard/sales-orders/${order.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/sales-orders/${order.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => onDelete(order.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
