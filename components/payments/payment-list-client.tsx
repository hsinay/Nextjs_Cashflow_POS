// components/payments/payment-list-client.tsx

'use client';

import { Payment } from '@/types/payment.types';
import { Customer } from '@/types/customer.types';
import { Supplier } from '@/types/supplier.types';
import { PaymentTable } from './payment-table';
import { PaymentSearchFilters } from './payment-search-filters';

interface PaymentListClientProps {
  initialSearch: string;
  initialPayerType: string;
  initialPayerId: string;
  initialPaymentMethod: string;
  initialStartDate: string;
  initialEndDate: string;
  customers: Customer[];
  suppliers: Supplier[];
  payments: Payment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function PaymentListClient({
  initialSearch,
  initialPayerType,
  initialPayerId,
  initialPaymentMethod,
  initialStartDate,
  initialEndDate,
  customers,
  suppliers,
  payments,
  pagination,
}: PaymentListClientProps) {
  return (
    <div className="space-y-4">
      <PaymentSearchFilters
        initialSearch={initialSearch}
        initialPayerType={initialPayerType}
        initialPayerId={initialPayerId}
        initialPaymentMethod={initialPaymentMethod}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        customers={customers}
        suppliers={suppliers}
      />
      <PaymentTable payments={payments} pagination={pagination} />
    </div>
  );
}
