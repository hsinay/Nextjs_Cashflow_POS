'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { linkPaymentToPOSchema } from '@/lib/validations/purchase-order.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Payment } from '@prisma/client';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type LinkPaymentInput = z.infer<typeof linkPaymentToPOSchema>;

interface PaymentFormProps {
  purchaseOrderId: string;
  totalAmount: number;
  paidAmount: number;
  onPaymentLinked?: (payment: Payment) => void;
}

export function PaymentForm({
  purchaseOrderId,
  totalAmount,
  paidAmount,
  onPaymentLinked,
}: PaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [availablePayments, setAvailablePayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Convert Decimal to number if needed
  const convertToNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    return Number(value);
  };

  const numTotalAmount = convertToNumber(totalAmount);
  const numPaidAmount = convertToNumber(paidAmount);

  const form = useForm<LinkPaymentInput>({
    resolver: zodResolver(linkPaymentToPOSchema),
    defaultValues: {
      paymentId: '',
    },
  });

  // Load available payments (unlinked supplier payments)
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch('/api/payments?status=COMPLETED&limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Filter payments that are not already linked
          const unlinked = data.data.payments.filter(
            (p: Payment) => !p.referenceOrderId
          );
          setAvailablePayments(unlinked);
        }
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load payments',
          variant: 'destructive',
        });
      })
      .finally(() => setLoading(false));
  }, [open, toast]);

  const onSubmit = async (data: LinkPaymentInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/purchase-orders/${purchaseOrderId}/payments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link payment');
      }

      await response.json();
      toast({
        title: 'Success',
        description: 'Payment linked successfully',
      });

      // Get the linked payment details
      const payment = availablePayments.find((p) => p.id === data.paymentId);
      if (payment) {
        onPaymentLinked?.(payment);
      }

      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to link payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingBalance = numTotalAmount - numPaidAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Link Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Payment to Purchase Order</DialogTitle>
          <DialogDescription>
            Select an unlinked payment to associate with this PO. Remaining balance:{' '}
            <span className="font-semibold">
              {formatCurrency(remainingBalance)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentId"
              render={({ field }: { field: import('react-hook-form').ControllerRenderProps<LinkPaymentInput, "paymentId"> }) => (
                <FormItem>
                  <FormLabel>Select Payment</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loading || availablePayments.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a payment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePayments.map((payment) => (
                          <SelectItem key={payment.id} value={payment.id}>
                            <div className="flex items-center gap-2">
                              <span>
                                {payment.paymentMethod} -{' '}
                                {formatCurrency(Number(payment.amount))}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(payment.paymentDate)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {availablePayments.length === 0 && !loading && (
                    <FormDescription className="text-orange-600">
                      No unlinked payments available
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <p className="text-blue-900">
                <strong>Note:</strong> Only completed payments can be linked. The payment
                amount should not exceed the remaining balance of{' '}
                <span className="font-semibold">
                  {formatCurrency(remainingBalance)}
                </span>
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || availablePayments.length === 0}
              >
                {isSubmitting ? 'Linking...' : 'Link Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
