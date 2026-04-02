'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { Payment } from '@prisma/client';
import { useState } from 'react';
import { PaymentForm } from './payment-form';
import { PaymentHistory } from './payment-history';

interface PurchaseOrderDetailsClientProps {
  purchaseOrderId: string;
  totalAmount: number;
  paidAmount: number | any;
  initialPayments: Payment[];
}

export function PurchaseOrderDetailsClient({
  purchaseOrderId,
  totalAmount,
  paidAmount: initialPaidAmount,
  initialPayments,
}: PurchaseOrderDetailsClientProps) {
  // Convert Decimal to number if needed
  const convertToNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    return Number(value);
  };

  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [paidAmount, setPaidAmount] = useState(convertToNumber(initialPaidAmount));
  const [loading, setLoading] = useState(false);

  // Convert total amount to number in case it's a Decimal
  const displayTotalAmount = convertToNumber(totalAmount);

  const handlePaymentLinked = async (payment: Payment) => {
    // Add the new payment to the list
    setPayments([payment, ...payments]);
    
    // Refresh the PO data to get updated amounts
    await refreshPOData();
  };

  const handlePaymentRemoved = async (paymentId: string) => {
    // Remove the payment from the list
    setPayments(payments.filter((p) => p.id !== paymentId));
    
    // Refresh the PO data to get updated amounts
    await refreshPOData();
  };

  const refreshPOData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/purchase-orders/${purchaseOrderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPaidAmount(convertToNumber(data.data.paidAmount));
        }
      }
    } catch (error) {
      console.error('Failed to refresh PO data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Payment Tracking</CardTitle>
        <PaymentForm
          purchaseOrderId={purchaseOrderId}
          totalAmount={totalAmount}
          paidAmount={paidAmount}
          onPaymentLinked={handlePaymentLinked}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-blue-50">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(displayTotalAmount)}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-green-50">
            <p className="text-sm text-gray-600">Paid Amount</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(paidAmount)}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-orange-50">
            <p className="text-sm text-gray-600">Outstanding Balance</p>
            <p className="text-2xl font-bold text-orange-900">
              {formatCurrency(Math.max(0, displayTotalAmount - paidAmount))}
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h3 className="font-semibold mb-3">Linked Payments</h3>
          <PaymentHistory
            payments={payments}
            purchaseOrderId={purchaseOrderId}
            onPaymentRemoved={handlePaymentRemoved}
            isLoading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
