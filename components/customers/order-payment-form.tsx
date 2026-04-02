// components/customers/order-payment-form.tsx

'use client';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import { CreateOrderPaymentInput, createOrderPaymentSchema } from '@/lib/validations/order-payment.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface OrderPaymentFormProps {
  orderId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrderPaymentForm({
  orderId,
  totalAmount,
  paidAmount,
  balanceAmount,
  onSuccess,
  onCancel,
}: OrderPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateOrderPaymentInput>({
    resolver: zodResolver(createOrderPaymentSchema),
    defaultValues: {
      salesOrderId: orderId,
      amount: undefined,
      paymentDate: new Date(),
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Reset form and notify parent
      form.reset();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Order Total</p>
            <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Already Paid</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(paidAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Remaining Balance</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(balanceAmount)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <Form form={form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Amount *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={balanceAmount}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <p className="text-xs text-slate-500 mt-1">
                  Max amount: {formatCurrency(balanceAmount)}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Date *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                    <SelectItem value="MOBILE_WALLET">Mobile Wallet</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Transaction ID, Check Number, etc."
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <p className="text-xs text-slate-500 mt-1">
                  e.g., transaction ID, check number, or bank reference
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any notes about this payment..."
                    className="min-h-[80px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : 'Record Payment'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
