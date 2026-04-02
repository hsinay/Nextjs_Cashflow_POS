// app/(dashboard)/customers/new/page.tsx

'use client';
import { CustomerForm } from '@/components/customers/customer-form';
import { createCustomerSchema } from '@/lib/validations/customer.schema';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      createCustomerSchema.parse(data);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      router.push('/dashboard/customers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Add New Customer</h1>
        <p className="text-slate-600 mt-2">Create a new customer profile and manage their details.</p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold text-sm">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <CustomerForm onSubmit={handleSubmit} isLoading={loading} />
      </div>
    </div>
  );
}
