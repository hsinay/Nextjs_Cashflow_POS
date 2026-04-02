// components/suppliers/supplier-form.tsx

'use client';

import { Button } from '@/components/ui/button';
import { getCurrencySymbol } from '@/lib/currency';
import { createSupplierSchema } from '@/lib/validations/supplier.schema';
import { CreateSupplierInput } from '@/types/supplier.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface SupplierFormProps {
  defaultValues?: Partial<CreateSupplierInput>;
  onSubmit: (data: CreateSupplierInput) => void;
  isLoading?: boolean;
}

export function SupplierForm({ defaultValues, onSubmit, isLoading }: SupplierFormProps) {
  const form = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: defaultValues || {
      name: '',
      email: '',
      contactNumber: '',
      address: '',
      creditLimit: 0,
    },
  });

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues);
  }, [defaultValues]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Name *</label>
        <input
          {...form.register('name')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="Supplier name"
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600 font-medium">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Email</label>
        <input
          {...form.register('email')}
          type="email"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="supplier@example.com"
          disabled={isLoading}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600 font-medium">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Contact Number Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Contact Number</label>
        <input
          {...form.register('contactNumber')}
          type="tel"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="+1 (555) 123-4567"
          disabled={isLoading}
        />
        {form.formState.errors.contactNumber && (
          <p className="text-sm text-red-600 font-medium">{form.formState.errors.contactNumber.message}</p>
        )}
      </div>

      {/* Address Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Address</label>
        <textarea
          {...form.register('address')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
          placeholder="123 Supplier St, City, State"
          rows={3}
          disabled={isLoading}
        />
        {form.formState.errors.address && (
          <p className="text-sm text-red-600 font-medium">{form.formState.errors.address.message}</p>
        )}
      </div>

      {/* Credit Limit Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Credit Limit</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{getCurrencySymbol()}</span>
          <input
            {...form.register('creditLimit', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="0.00"
            disabled={isLoading}
          />
        </div>
        {form.formState.errors.creditLimit && (
          <p className="text-sm text-red-600 font-medium">{form.formState.errors.creditLimit.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Supplier'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
