// components/payments/payment-search-filters.tsx

'use client';

import { Customer } from '@/types/customer.types';
import { Supplier } from '@/types/supplier.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface PaymentSearchFiltersProps {
  initialSearch: string;
  initialPayerType: string;
  initialPayerId: string;
  initialPaymentMethod: string;
  initialStartDate: string;
  initialEndDate: string;
  customers: Customer[];
  suppliers: Supplier[];
}

export function PaymentSearchFilters({
  initialSearch,
  initialPayerType,
  initialPayerId,
  initialPaymentMethod,
  initialStartDate,
  initialEndDate,
  customers,
  suppliers,
}: PaymentSearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [payerType, setPayerType] = useState(initialPayerType);
  const [payerId, setPayerId] = useState(initialPayerId);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [showFilters, setShowFilters] = useState(false);

  const paymentMethods = [
    'CASH',
    'BANK_TRANSFER',
    'CARD',
    'UPI',
    'CHEQUE',
    'DIGITAL_WALLET',
  ];

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (search) params.set('search', search);
    else params.delete('search');
    
    if (payerType) params.set('payerType', payerType);
    else params.delete('payerType');
    
    if (payerId) params.set('payerId', payerId);
    else params.delete('payerId');
    
    if (paymentMethod) params.set('paymentMethod', paymentMethod);
    else params.delete('paymentMethod');
    
    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');
    
    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');
    
    params.set('page', '1'); // Reset to first page
    
    router.push(`?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch('');
    setPayerType('');
    setPayerId('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    router.push('/dashboard/payments');
  };

  const hasActiveFilters = search || payerType || payerId || paymentMethod || startDate || endDate;

  const payers = payerType === 'CUSTOMER' ? customers : payerType === 'SUPPLIER' ? suppliers : [];

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by reference number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
              {[search, payerType, payerId, paymentMethod, startDate, endDate].filter(Boolean).length}
            </span>
          )}
        </Button>
        <Button onClick={handleSearch} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
        {hasActiveFilters && (
          <Button onClick={handleClear} variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payer Type
            </label>
            <select
              value={payerType}
              onChange={(e) => {
                setPayerType(e.target.value);
                setPayerId(''); // Reset payer ID when type changes
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payer
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              disabled={!payerType}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All {payerType ? (payerType === 'CUSTOMER' ? 'Customers' : 'Suppliers') : 'Payers'}</option>
              {payers.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
