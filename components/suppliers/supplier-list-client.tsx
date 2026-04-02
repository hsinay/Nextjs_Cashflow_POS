// components/suppliers/supplier-list-client.tsx

'use client';

import { Supplier } from '@/types/supplier.types';
import { useState } from 'react';
import { SupplierCard } from './supplier-card';
import { SupplierTable } from './supplier-table';

interface SupplierListClientProps {
  suppliers: Supplier[];
  pagination: { page: number; limit: number; total: number; pages: number };
  view?: 'table' | 'card';
}

export function SupplierListClient({ suppliers, pagination, view = 'table' }: SupplierListClientProps) {
  const [currentView, setCurrentView] = useState<'table' | 'card'>(view);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          className={`btn btn-sm mr-2 ${currentView === 'table' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentView('table')}
        >
          Table View
        </button>
        <button
          className={`btn btn-sm ${currentView === 'card' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentView('card')}
        >
          Card View
        </button>
      </div>

      {currentView === 'table' ? (
        <SupplierTable suppliers={suppliers} pagination={pagination} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <SupplierCard key={s.id} supplier={s} />
          ))}
        </div>
      )}
    </div>
  );
}
