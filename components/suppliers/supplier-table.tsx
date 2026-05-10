'use client';

import { SortableTableHead } from '@/components/ui/sortable-table-head';
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
import { useUrlSort } from '@/lib/use-url-sort';
import { Supplier } from '@/types/supplier.types';
import Link from 'next/link';
import { CreditStatusBadge } from './credit-status-badge';

interface SupplierTableProps {
  suppliers: Supplier[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function SupplierTable({ suppliers }: SupplierTableProps) {
  const { sortField, sortDir, handleSort } = useUrlSort();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-200">
            <SortableTableHead field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-slate-900 font-semibold">Name</SortableTableHead>
            <SortableTableHead field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-slate-900 font-semibold">Email</SortableTableHead>
            <SortableTableHead field="contactNumber" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-slate-900 font-semibold">Phone</SortableTableHead>
            <SortableTableHead field="creditLimit" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right text-slate-900 font-semibold">Credit Limit</SortableTableHead>
            <SortableTableHead field="outstandingBalance" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right text-slate-900 font-semibold">Outstanding</SortableTableHead>
            <TableHead className="text-center text-slate-900 font-semibold">Status</TableHead>
            <TableHead className="text-center text-slate-900 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                No suppliers found.
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((s) => (
              <TableRow key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <TableCell className="font-medium text-slate-900">{s.name}</TableCell>
                <TableCell className="text-sm text-slate-600">{s.email || '-'}</TableCell>
                <TableCell className="text-sm text-slate-600">{s.contactNumber || '-'}</TableCell>
                <TableCell className="text-right font-medium text-slate-900">{formatCurrency(s.creditLimit)}</TableCell>
                <TableCell className="text-right font-medium text-slate-900">{formatCurrency(s.outstandingBalance || 0)}</TableCell>
                <TableCell className="text-center">
                  <CreditStatusBadge outstandingBalance={s.outstandingBalance || 0} creditLimit={s.creditLimit} />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <Link href={`/dashboard/suppliers/${s.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Link href={`/dashboard/suppliers/${s.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/dashboard/suppliers/${s.id}/orders`}>
                      <Button variant="outline" size="sm">Orders</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
