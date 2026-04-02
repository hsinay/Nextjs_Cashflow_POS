// components/purchase-orders/purchase-order-table.tsx

'use client';

import { PurchaseOrderStatusBadge } from '@/components/purchase-orders/purchase-order-status-badge';
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
import { PurchaseOrder } from '@/types/purchase-order.types';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
  onDelete: (id: string) => Promise<void>;
}

export function PurchaseOrderTable({ orders, onDelete }: PurchaseOrderTableProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          <TableRow className="hover:bg-slate-50">
            <TableHead className="text-slate-900 font-semibold">Order ID</TableHead>
            <TableHead className="text-slate-900 font-semibold">Supplier</TableHead>
            <TableHead className="text-slate-900 font-semibold">Date</TableHead>
            <TableHead className="text-slate-900 font-semibold">Status</TableHead>
            <TableHead className="text-right text-slate-900 font-semibold">Total</TableHead>
            <TableHead className="text-slate-900 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
              <TableCell className="font-medium text-slate-900">{order.id.substring(0, 8)}</TableCell>
              <TableCell className="text-slate-600">{order.supplier?.name || 'N/A'}</TableCell>
              <TableCell className="text-slate-600">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <PurchaseOrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                <Link href={`/dashboard/purchase-orders/${order.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/purchase-orders/${order.id}/edit`}>
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
  </div>
  );
}