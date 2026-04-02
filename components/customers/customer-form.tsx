// components/customers/customer-form.tsx

'use client';
import { Button } from '@/components/ui/button';
import { createCustomerSchema } from '@/lib/validations/customer.schema';
import { CreateCustomerInput, CustomerSegment } from '@/types/customer.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface CustomerFormProps {
  defaultValues?: Partial<CreateCustomerInput>;
  onSubmit: (data: CreateCustomerInput) => void;
  isLoading?: boolean;
}

export function CustomerForm({ defaultValues, onSubmit, isLoading }: CustomerFormProps) {
  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: defaultValues || {
      name: '',
      email: '',
      contactNumber: '',
      billingAddress: '',
      shippingAddress: '',
      creditLimit: 0,
      aiSegment: CustomerSegment.NEW,
    },
  });

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues);
  }, [defaultValues]);

  const copyBillingToShipping = () => {
    form.setValue('shippingAddress', form.getValues('billingAddress'));
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Name *</label>
        <input
          {...form.register('name')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500"
          disabled={isLoading}
          placeholder="Enter customer name"
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
          disabled={isLoading}
          placeholder="customer@example.com"
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
          disabled={isLoading}
          placeholder="+1 (555) 000-0000"
        />
        {form.formState.errors.contactNumber && (
          <p className="text-sm text-red-600 font-medium">{form.formState.errors.contactNumber.message}</p>
        )}
      </div>

      {/* Billing Address Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Billing Address</label>
        <textarea
          {...form.register('billingAddress')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
          disabled={isLoading}
          rows={3}
          placeholder="Enter billing address"
        />
      </div>

      {/* Shipping Address Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-900">Shipping Address</label>
          <Button
            type="button"
            onClick={copyBillingToShipping}
            variant="secondary"
            size="sm"
          >
            Copy from billing
          </Button>
        </div>
        <textarea
          {...form.register('shippingAddress')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
          disabled={isLoading}
          rows={3}
          placeholder="Enter shipping address"
        />
      </div>

      {/* Credit Limit Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Credit Limit</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            type="number"
            step="0.01"
            {...form.register('creditLimit', { valueAsNumber: true })}
            className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500"
            disabled={isLoading}
            placeholder="0.00"
          />
        </div>
        {form.formState.errors.creditLimit && (
          <p className="text-sm text-red-600 font-medium">{form.formState.errors.creditLimit.message}</p>
        )}
      </div>

      {/* AI Segment Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Customer Segment</label>
        <select
          {...form.register('aiSegment')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-500"
          disabled={isLoading}
        >
          {Object.values(CustomerSegment).map((seg) => (
            <option key={seg} value={seg}>
              {seg.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Customer'}
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
