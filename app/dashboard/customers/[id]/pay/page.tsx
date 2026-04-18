// app/dashboard/customers/[id]/pay/page.tsx
'use client';

import { PaymentMethodSelector } from '@/components/pos/payment-method-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/currency';
import { Customer } from '@/types/customer.types';
import { ConcretePaymentMethod } from '@/types/payment.types';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PayBalancePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ConcretePaymentMethod>('CASH');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/customers/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setCustomer(data.data);
            setAmount(data.data.outstandingBalance.toString());
          }
        })
        .catch(() => setError('Failed to fetch customer data'));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${id}/pay-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      toast({
        title: 'Success',
        description: 'Payment processed successfully.',
      });
      router.push(`/dashboard/customers/${id}`);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!customer && !error) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center py-12">
          <div className="text-slate-600">Loading payment information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold text-sm">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Pay Outstanding Balance</h1>
        <p className="text-slate-600 mt-2">Process a payment for customer balance.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
        <div className="mb-6 pb-6 border-b border-slate-200">
          {customer && (
            <>
              <p className="text-sm font-semibold text-slate-600 mb-2">Customer</p>
              <p className="text-2xl font-semibold text-slate-900 mb-4">{customer.name}</p>
              <p className="text-sm font-semibold text-slate-600 mb-1">Outstanding Balance</p>
              <p className="text-4xl font-bold text-red-600">{formatCurrency(customer.outstandingBalance)}</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Amount */}
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-semibold text-slate-900">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{getCurrencySymbol()}</span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="pl-8 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label htmlFor="paymentMethod" className="block text-sm font-semibold text-slate-900">
              Payment Method
            </label>
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
              availableMethods={['CASH', 'CARD', 'UPI', 'BANK_TRANSFER']}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing Payment...' : 'Submit Payment'}
            </Button>
            <Link href={`/dashboard/customers/${id}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
