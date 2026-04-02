// app/(dashboard)/suppliers/[id]/edit/page.tsx

'use client';

import { SupplierForm } from '@/components/suppliers/supplier-form';
import { CreateSupplierInput } from '@/types/supplier.types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditSupplierPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch supplier');
        const data = await res.json();
        setSupplier(data.data);
      } catch (err) {
        setError('Failed to load supplier');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [params.id]);

  const onSubmit = async (data: CreateSupplierInput) => {
    setIsSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/suppliers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to update supplier');
        return;
      }

      router.push(`/dashboard/suppliers/${params.id}`);
    } catch (err) {
      setError('An error occurred while updating the supplier');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Loading supplier details...</h1>
          <p className="text-slate-600 mt-2">Please wait while we fetch the supplier information.</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Supplier not found</h1>
          <p className="text-slate-600 mt-2">We couldn't find the supplier you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Edit Supplier</h1>
        <p className="text-slate-600 mt-2">{supplier.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <SupplierForm 
          defaultValues={{
            name: supplier.name,
            email: supplier.email,
            contactNumber: supplier.contactNumber,
            address: supplier.address,
            creditLimit: supplier.creditLimit,
          }}
          onSubmit={onSubmit} 
          isLoading={isSaving} 
        />
      </div>
    </div>
  );
}
