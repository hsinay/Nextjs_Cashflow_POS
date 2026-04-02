// components/customers/customer-list-client.tsx

'use client';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types/customer.types';
import { useState } from 'react';
import { CustomerCard } from './customer-card';
import { CustomerTable } from './customer-table';

interface CustomerListClientProps {
  customers: Customer[];
  pagination: { page: number; limit: number; total: number; pages: number };
  view?: 'table' | 'card';
}

export function CustomerListClient({ customers, pagination, view = 'table' }: CustomerListClientProps) {
  const [currentView, setCurrentView] = useState<'table' | 'card'>(view);

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant={currentView === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('table')}
        >
          Table View
        </Button>
        <Button
          variant={currentView === 'card' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('card')}
        >
          Card View
        </Button>
      </div>
      {currentView === 'table' ? (
        <CustomerTable customers={customers} pagination={pagination} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))}
        </div>
      )}
    </div>
  );
}
