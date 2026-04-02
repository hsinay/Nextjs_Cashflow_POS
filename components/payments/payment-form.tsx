'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CONCRETE_PAYMENT_METHODS, PAYER_TYPES } from '@/types/payment.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createPaymentSchema = z.object({
  payerId: z.string().uuid('Payer ID must be a valid UUID'),
  payerType: z.enum(PAYER_TYPES, { message: 'Invalid payer type' }),
  amount: z.number().positive('Amount must be a positive number'),
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS, { message: 'Invalid payment method' }),
  paymentDate: z.coerce.date().optional(),
  referenceOrderId: z.string().uuid().optional().or(z.literal('')),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

interface PaymentFormProps {
  customers?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string }>;
}

export function PaymentForm({ customers = [], suppliers = [] }: PaymentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayerType, setSelectedPayerType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      payerType: 'CUSTOMER',
    },
  });

  const onSubmit = async (data: CreatePaymentInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          referenceOrderId: data.referenceOrderId === '' ? null : data.referenceOrderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      reset();
      router.push('/dashboard/payments');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const payerOptions = selectedPayerType === 'CUSTOMER' ? customers : suppliers;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payer Type *
          </label>
          <select
            {...register('payerType')}
            onChange={(e) => setSelectedPayerType(e.target.value as 'CUSTOMER' | 'SUPPLIER')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {PAYER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.payerType && (
            <p className="mt-1 text-sm text-red-600">{errors.payerType.message}</p>
          )}
        </div>

        {/* Payer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedPayerType} *
          </label>
          <select
            {...register('payerId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a {selectedPayerType.toLowerCase()}</option>
            {payerOptions.map((payer) => (
              <option key={payer.id} value={payer.id}>
                {payer.name}
              </option>
            ))}
          </select>
          {errors.payerId && (
            <p className="mt-1 text-sm text-red-600">{errors.payerId.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount', { valueAsNumber: true })}
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method *
          </label>
          <select
            {...register('paymentMethod')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select payment method</option>
            {CONCRETE_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          {errors.paymentMethod && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
          )}
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date
          </label>
          <Input
            type="datetime-local"
            {...register('paymentDate')}
            className={errors.paymentDate ? 'border-red-500' : ''}
          />
          {errors.paymentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
          )}
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference Number
          </label>
          <Input
            placeholder="e.g., CHK-001"
            {...register('referenceNumber')}
          />
          {errors.referenceNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.referenceNumber.message}</p>
          )}
        </div>
      </div>

      {/* Reference Order ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reference Order ID
        </label>
        <Input
          placeholder="Leave empty if not applicable"
          {...register('referenceOrderId')}
        />
        {errors.referenceOrderId && (
          <p className="mt-1 text-sm text-red-600">{errors.referenceOrderId.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <Textarea
          placeholder="Additional payment notes..."
          {...register('notes')}
          rows={4}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Creating...' : 'Create Payment'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/payments')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
