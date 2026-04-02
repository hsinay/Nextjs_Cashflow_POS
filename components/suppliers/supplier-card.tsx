// components/suppliers/supplier-card.tsx

import { formatCurrency } from '@/lib/currency';
import { Supplier } from '@/types/supplier.types';
import Link from 'next/link';
import { CreditStatusBadge } from './credit-status-badge';

interface SupplierCardProps {
  supplier: Supplier;
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{supplier.name}</h3>
          <p className="text-sm text-gray-600">{supplier.email || '-'}</p>
        </div>
        <CreditStatusBadge 
          outstandingBalance={supplier.outstandingBalance || 0} 
          creditLimit={supplier.creditLimit} 
        />
      </div>

      {supplier.contactNumber && (
        <div className="text-sm text-gray-600">{supplier.contactNumber}</div>
      )}

      <div className="bg-gray-50 rounded p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Credit Limit:</span>
          <span className="font-medium">{formatCurrency(supplier.creditLimit)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">We Owe:</span>
          <span className="font-medium text-red-600">{formatCurrency(supplier.outstandingBalance || 0)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`/dashboard/suppliers/${supplier.id}`} className="flex-1">
          <button className="btn btn-sm btn-primary w-full">View</button>
        </Link>
        <Link href={`/dashboard/suppliers/${supplier.id}/edit`} className="flex-1">
          <button className="btn btn-sm btn-secondary w-full">Edit</button>
        </Link>
      </div>
    </div>
  );
}
