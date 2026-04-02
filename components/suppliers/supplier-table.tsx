// components/suppliers/supplier-table.tsx

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { Supplier } from '@/types/supplier.types';
import Link from 'next/link';
import { CreditStatusBadge } from './credit-status-badge';

interface SupplierTableProps {
  suppliers: Supplier[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function SupplierTable({ suppliers }: SupplierTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Name</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Email</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Phone</th>
              <th className="text-right py-4 px-6 font-semibold text-slate-900">Credit Limit</th>
              <th className="text-right py-4 px-6 font-semibold text-slate-900">Outstanding</th>
              <th className="text-center py-4 px-6 font-semibold text-slate-900">Status</th>
              <th className="text-center py-4 px-6 font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="py-4 px-6 font-medium text-slate-900">{s.name}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{s.email || '-'}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{s.contactNumber || '-'}</td>
                  <td className="py-4 px-6 text-right font-medium text-slate-900">{formatCurrency(s.creditLimit)}</td>
                  <td className="py-4 px-6 text-right font-medium text-slate-900">{formatCurrency(s.outstandingBalance || 0)}</td>
                  <td className="py-4 px-6 text-center">
                    <CreditStatusBadge 
                      outstandingBalance={s.outstandingBalance || 0} 
                      creditLimit={s.creditLimit} 
                    />
                  </td>
                  <td className="py-4 px-6 text-center">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
