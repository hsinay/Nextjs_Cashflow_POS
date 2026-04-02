'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import { CONCRETE_PAYMENT_METHODS } from '@/types/payment.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const quickPaymentSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS, { message: 'Invalid payment method' }),
  paymentDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

type QuickPaymentInput = z.infer<typeof quickPaymentSchema>;

interface QuickPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: any;
  customerId: string;
}

export function QuickPaymentModal({ open, onOpenChange, salesOrder, customerId }: QuickPaymentModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const form = useForm<QuickPaymentInput>({
    resolver: zodResolver(quickPaymentSchema),
    defaultValues: {
      amount: Number(salesOrder.balanceAmount) || 0,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date(),
      notes: `Payment for Sales Order #${salesOrder.id.substring(0, 8)}`,
    },
  });

  const onSubmit = async (data: QuickPaymentInput) => {
    // Don't submit if a dropdown is open
    if (isDropdownOpen) {
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerId: customerId,
          payerType: 'CUSTOMER',
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceOrderId: salesOrder.id,
          paymentDate: data.paymentDate,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      // Payment successful - refresh page to show updated status
      form.reset();
      onOpenChange(false);
      // Wait a moment for backend to process, then refresh
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Create a payment for Sales Order #{salesOrder.id.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4"
            onKeyDown={(e) => {
              // Prevent form submission when Enter is pressed inside a Select
              if (e.key === 'Enter') {
                const activeElement = document.activeElement as HTMLElement;
                const inSelectDropdown = 
                  activeElement?.getAttribute('role') === 'combobox' || 
                  activeElement?.getAttribute('role') === 'listbox' ||
                  activeElement?.getAttribute('role') === 'option' ||
                  activeElement?.closest('[role="listbox"]') ||
                  activeElement?.closest('[role="combobox"]') ||
                  document.querySelector('[role="listbox"]')?.contains(activeElement);
                
                if (inSelectDropdown) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
              }
            }}
          >
            {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>}

            <div className="space-y-2 bg-gray-50 p-3 rounded">
              <div className="flex justify-between text-sm">
                <span>Order Total:</span>
                <span className="font-semibold">{formatCurrency(Number(salesOrder.totalAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Balance Due:</span>
                <span className="font-semibold text-red-600">{formatCurrency(Number(salesOrder.balanceAmount))}</span>
              </div>
            </div>

            <FormField
              control={form.control as any}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="paymentMethod"
              render={({ field }) => {
                const methodLabel: { [key: string]: string } = {
                  'CASH': 'Cash',
                  'BANK_TRANSFER': 'Bank Transfer',
                  'CARD': 'Card',
                  'UPI': 'UPI',
                  'CHEQUE': 'Cheque',
                  'DIGITAL_WALLET': 'Digital Wallet',
                  'CREDIT': 'Credit',
                  'DEBIT': 'Debit',
                  'MOBILE_WALLET': 'Mobile Wallet',
                };
                return (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        onOpenChange={setIsDropdownOpen}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {methodLabel[field.value] || 'Select payment method'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {CONCRETE_PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control as any}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
