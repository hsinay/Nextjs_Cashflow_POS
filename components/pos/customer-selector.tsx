'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/currency';
import { Customer } from '@/types/customer.types';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function CustomerSelector({
  customers,
  selectedCustomer,
  onSelectCustomer,
  searchPlaceholder = 'Search customer...',
  disabled = false,
  required = false,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contactNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    onSelectCustomer(null);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-semibold text-gray-700">
        Customer
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input / Display */}
      <div className="relative">
        <Button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          variant="outline"
          className="w-full justify-between px-3 h-10 bg-white"
        >
          <span className="text-left truncate flex-1">
            {selectedCustomer ? (
              <span className="font-medium text-gray-900">{selectedCustomer.name}</span>
            ) : (
              <span className="text-gray-500">Walk-in Customer</span>
            )}
          </span>
          {selectedCustomer && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </Button>

        {/* Search Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  autoFocus
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Walk-in Option */}
            <button
              onClick={() => handleClearSelection()}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b border-gray-200"
            >
              <span className="font-medium text-gray-900">Walk-in Customer</span>
              <p className="text-xs text-gray-500">No customer account</p>
            </button>

            {/* Customer List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 transition ${
                      selectedCustomer?.id === customer.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        {customer.contactNumber && (
                          <p className="text-xs text-gray-500">{customer.contactNumber}</p>
                        )}
                      </div>
                      {customer.outstandingBalance > 0 && (
                        <span className="text-xs font-semibold text-red-600 ml-2">
                          Due: {formatCurrency(customer.outstandingBalance)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchQuery ? 'No customers found' : 'No customers available'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Customer Info */}
      {selectedCustomer && (
        <div className="text-xs text-gray-600 space-y-1">
          {selectedCustomer.email && (
            <p>Email: {selectedCustomer.email}</p>
          )}
          {selectedCustomer.outstandingBalance > 0 && (
            <p className="text-red-600 font-semibold">
              Outstanding Balance: {formatCurrency(selectedCustomer.outstandingBalance)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
