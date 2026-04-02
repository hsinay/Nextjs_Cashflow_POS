// app/(dashboard)/customers/[id]/edit/page.tsx

'use client';
import { CustomerForm } from '@/components/customers/customer-form';
import { updateCustomerSchema } from '@/lib/validations/customer.schema';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCustomer(data.data);
        else setError(data.error);
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      updateCustomerSchema.parse(data);
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      router.push(`/dashboard/customers/${params.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center py-12">
        <div className="text-slate-600">Loading customer details...</div>
      </div>
    </div>
  );
  if (error) return (
    <div className="space-y-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold text-sm">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );
  if (!customer) return (
    <div className="space-y-8">
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center py-12">
        <p className="text-slate-600">Customer not found.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Edit Customer</h1>
        <p className="text-slate-600 mt-2">Update customer information and details.</p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold text-sm">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <CustomerForm defaultValues={customer} onSubmit={handleSubmit} isLoading={loading} />
      </div>
    </div>
  );
}
