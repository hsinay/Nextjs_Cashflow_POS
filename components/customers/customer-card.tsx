// components/customers/customer-card.tsx

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { Customer } from '@/types/customer.types';
import Link from 'next/link';
import { CreditStatusBadge } from './credit-status-badge';
import { LoyaltyBadge } from './loyalty-badge';
import { SegmentBadge } from './segment-badge';

interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-semibold text-base text-slate-900">{customer.name}</h3>
          <p className="text-sm text-slate-600">{customer.email || '-'}</p>
        </div>
        <CreditStatusBadge outstandingBalance={Number(customer.outstandingBalance)} creditLimit={Number(customer.creditLimit)} />
      </div>
      
      <div className="text-sm space-y-2 py-3 border-t border-slate-200">
        <p className="text-slate-600">
          <span className="font-medium text-slate-900">Phone:</span> {customer.contactNumber || '-'}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-900">Credit Limit:</span> {formatCurrency(Number(customer.creditLimit))}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-900">Outstanding:</span> {formatCurrency(Number(customer.outstandingBalance))}
        </p>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <LoyaltyBadge points={customer.loyaltyPoints || 0} />
        <SegmentBadge segment={customer.aiSegment} />
      </div>
      
      <div className="flex gap-2 pt-2 border-t border-slate-200">
        <Link href={`/dashboard/customers/${customer.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View
          </Button>
        </Link>
        <Link href={`/dashboard/customers/${customer.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Edit
          </Button>
        </Link>
      </div>
    </div>
  );
}
