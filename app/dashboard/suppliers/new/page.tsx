// app/(dashboard)/suppliers/new/page.tsx

'use client';

import { SupplierForm } from '@/components/suppliers/supplier-form';
import { CreateSupplierInput } from '@/types/supplier.types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewSupplierPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const onSubmit = async (data: CreateSupplierInput) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to create supplier');
        return;
      }
      
      router.push('/dashboard/suppliers');
    } catch (err) {
      setError('An error occurred while creating the supplier');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Add New Supplier</h1>
        <p className="text-slate-600 mt-2">Create a new supplier account and set up credit terms.</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold text-sm">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <SupplierForm onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
