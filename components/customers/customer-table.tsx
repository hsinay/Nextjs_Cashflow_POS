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
import { Customer } from '@/types/customer.types';
import Link from 'next/link';
import { CreditStatusBadge } from './credit-status-badge';
import { LoyaltyBadge } from './loyalty-badge';
import { SegmentBadge } from './segment-badge';

interface CustomerTableProps {
  customers: Customer[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function CustomerTable({ customers, pagination: _pagination }: CustomerTableProps) {
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
            <TableHead className="text-slate-900 font-semibold">Status</TableHead>
            <SortableTableHead field="loyaltyPoints" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-slate-900 font-semibold">Loyalty</SortableTableHead>
            <SortableTableHead field="aiSegment" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-slate-900 font-semibold">Segment</SortableTableHead>
            <TableHead className="text-slate-900 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            customers.map((c) => (
              <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                <TableCell className="text-slate-600">{c.email || '-'}</TableCell>
                <TableCell className="text-slate-600">{c.contactNumber || '-'}</TableCell>
                <TableCell className="text-right text-slate-900 font-medium">{formatCurrency(Number(c.creditLimit))}</TableCell>
                <TableCell className="text-right text-slate-900 font-medium">{formatCurrency(Number(c.outstandingBalance))}</TableCell>
                <TableCell><CreditStatusBadge outstandingBalance={Number(c.outstandingBalance)} creditLimit={Number(c.creditLimit)} /></TableCell>
                <TableCell><LoyaltyBadge points={c.loyaltyPoints || 0} /></TableCell>
                <TableCell><SegmentBadge segment={c.aiSegment} /></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/customers/${c.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Link href={`/dashboard/customers/${c.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
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
