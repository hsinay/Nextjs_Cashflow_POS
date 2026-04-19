'use client';

import { AlertBox, EnhancedButton, Small } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { usePOSSession } from '@/hooks/use-pos-session';
import { Colors } from '@/lib/design-tokens';
import { parseLocaleAmount } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';
import { Customer } from '@/types/customer.types';
import { ConcretePaymentMethod } from '@/types/payment.types';
import {
  PaymentDetailInput,
} from '@/types/pos-payment.types';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomerSelector } from './customer-selector';
import { NumericKeypad } from './numeric-keypad';
import { OrderSummary } from './order-summary';
import { PaymentMethodSelector } from './payment-method-selector';
import { SessionStatusBadge } from './session-status-badge';

interface POSPaymentPanelProps {
  isOpen: boolean;
  orderTotal: number;
  orderSubtotal: number;
  orderTax: number;
  orderDiscount?: number;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onConfirmPayment: (paymentData: PaymentDetailInput) => Promise<void>;
  onClose: () => void;
}

export function POSPaymentPanel({
  isOpen,
  orderTotal,
  orderSubtotal,
  orderTax,
  orderDiscount = 0,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onConfirmPayment,
  onClose,
}: POSPaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<ConcretePaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState('0.00');
  const [isConfirming, setIsConfirming] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();
  const { session, loading: sessionLoading, error: sessionError } = usePOSSession();
  const { activeCurrency, formatCurrency } = useCurrency();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setPaidAmount('0.00');
      setValidationError(null);
    }
  }, [isOpen]);

  // Calculate change (for cash)
  const paidNum = parseLocaleAmount(paidAmount, activeCurrency);
  const changeAmount = Math.max(0, paidNum - orderTotal);

  // Validate payment - pure function without state mutations
  const validatePayment = (
    amount: number,
    method: ConcretePaymentMethod,
    customer: Customer | null,
    total: number
  ): { isValid: boolean; error: string | null } => {
    // For credit, amount can be 0, meaning full order total is on credit
    if (method === 'CREDIT') {
      if (!customer) {
        return {
          isValid: false,
          error: 'Please select a customer to use credit payment',
        };
      }
      if (amount > total) {
        return {
          isValid: false,
          error: 'Credit payment cannot exceed order total',
        };
      }
       if (amount < 0) {
        return {
          isValid: false,
          error: 'Please enter a valid amount',
        };
      }
    } else {
       if (amount <= 0) {
        return { isValid: false, error: 'Please enter a valid amount' };
      }
    }

    // Cash: must cover full amount
    if (method === 'CASH' && amount < total) {
      return {
        isValid: false,
        error: `Insufficient amount. Need at least ${formatCurrency(total)}`,
      };
    }

    // Card/UPI/etc: must cover full amount
    if (
      ['CARD', 'UPI', 'DIGITAL_WALLET', 'MOBILE_WALLET'].includes(method)
    ) {
      if (amount < total) {
        return {
          isValid: false,
          error: `Amount must be at least ${formatCurrency(total)}`,
        };
      }
    }

    return { isValid: true, error: null };
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    // Validate session exists
    if (!session) {
      setValidationError('No active POS session. Please open a session first.');
      toast({
        title: 'Error',
        description: 'No active POS session. Please open a session first.',
        variant: 'destructive',
      });
      return;
    }

    const validation = validatePayment(paidNum, paymentMethod, selectedCustomer, orderTotal);
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    setIsConfirming(true);
    try {
      const paymentData: PaymentDetailInput = {
        paymentMethod,
        amount: paidNum,
        ...(selectedCustomer && { customerId: selectedCustomer.id }),
      };

      // Execute payment confirmation
      await onConfirmPayment(paymentData);

      // Update POS session totals
      try {
        await fetch(`/api/pos-sessions/${session.id}/update-totals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod,
            amount: paidNum,
          }),
        });
      } catch (sessionUpdateError) {
        console.error('Failed to update session totals:', sessionUpdateError);
        // Don't fail payment if session update fails, just log it
      }

      // Create day book entry
      if (session.dayBookId) {
        try {
          await fetch(`/api/daybook/${session.dayBookId}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entryType: 'SALE',
              entryDate: new Date().toISOString(),
              description: `POS Sale - ${paymentMethod}`,
              amount: paidNum,
              paymentMethod,
              referenceId: session.id,
              referenceType: 'POS_SESSION',
            }),
          });
        } catch (dayBookError) {
          console.error('Failed to create day book entry:', dayBookError);
          // Don't fail payment if day book entry fails
        }
      }

      toast({
        title: 'Success',
        description: `Payment of ${formatCurrency(paidNum)} processed successfully.`,
      });

      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      setValidationError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle keyboard shortcuts (let NumericKeypad handle all key inputs)
  useEffect(() => {
    if (!isOpen) return;

    // NumericKeypad handles all keyboard input, so no need for additional listeners here
    // This effect is kept minimal to avoid event handler conflicts
    return () => {};
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Enter payment details and confirm the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Status Banner */}
          {sessionError && (
            <AlertBox variant="danger" message={sessionError} />
          )}

          {!sessionLoading && !session && (
            <AlertBox
              variant="danger"
              title="No Active Session"
              message="No active POS session. Please open a session to process payments."
            />
          )}

          {session && (
            <div
              className="border rounded-lg p-4 flex items-center justify-between"
              style={{
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderColor: Colors.primary.start,
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: Colors.primary.start }}
                />
                <div>
                  <Small className="font-semibold block">Active Session</Small>
                  <Small style={{ color: Colors.text.secondary }}>
                    Terminal: {session.terminalId || 'Default'}
                  </Small>
                </div>
              </div>
              <SessionStatusBadge status={session.status} />
            </div>
          )}

          {/* Order Summary */}
          <OrderSummary
            subtotal={orderSubtotal}
            tax={orderTax}
            discount={orderDiscount}
            total={orderTotal}
          />

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onSelectMethod={setPaymentMethod}
            availableMethods={[
              'CASH',
              'CREDIT',
              'CARD',
              'UPI',
              'DIGITAL_WALLET',
            ]}
            disabled={isConfirming}
          />

          {/* Customer Selector (for Credit) */}
          {paymentMethod === 'CREDIT' && (
            <CustomerSelector
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={onSelectCustomer}
              required
              disabled={isConfirming}
            />
          )}

          {/* Available Credit Display */}
          {paymentMethod === 'CREDIT' && selectedCustomer && (
            <div
              className="border rounded-lg p-3"
              style={{
                backgroundColor: Colors.gray[50],
                borderColor: Colors.gray[200],
              }}
            >
              <div className="flex justify-between items-center text-sm">
                <span
                  className="font-medium"
                  style={{ color: Colors.text.primary }}
                >
                  Available Credit:
                </span>
                <span
                  className="font-bold"
                  style={{ color: Colors.text.primary }}
                >
                  {formatCurrency(selectedCustomer.creditLimit - selectedCustomer.outstandingBalance)}
                </span>
              </div>
            </div>
          )}

          {/* Numeric Keypad */}
          <div>
            <label
              className="block font-semibold mb-2"
              style={{
                fontSize: '12px',
                color: Colors.text.primary,
              }}
            >
              {paymentMethod === 'CASH'
                ? 'Amount Paid'
                : paymentMethod === 'CREDIT'
                  ? 'Payment Amount'
                  : 'Amount'}
            </label>
            <NumericKeypad
              value={paidAmount}
              onValueChange={setPaidAmount}
              onConfirm={handleConfirmPayment}
              onCancel={onClose}
              disabled={isConfirming}
            />
          </div>

          {/* Change Calculation (Cash Only) */}
          {paymentMethod === 'CASH' && paidNum > 0 && (
            <div
              className="border rounded-lg p-4"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: Colors.success,
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-sm font-semibold"
                  style={{ color: Colors.success }}
                >
                  Change:
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: Colors.success }}
                >
                  {formatCurrency(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Credit Payment Note */}
          {paymentMethod === 'CREDIT' && selectedCustomer && (
            <div
              className="border rounded-lg p-4 flex gap-3"
              style={{
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderColor: Colors.primary.start,
              }}
            >
              <CheckCircle2
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: Colors.primary.start }}
              />
              <div className="text-sm" style={{ color: Colors.text.primary }}>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-xs mt-1">
                  This payment will be added to their credit account.
                </p>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <AlertBox variant="danger" message={validationError} />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <EnhancedButton
              onClick={onClose}
              disabled={isConfirming || sessionLoading}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              onClick={handleConfirmPayment}
              disabled={isConfirming || !session || sessionLoading}
              isLoading={isConfirming || sessionLoading}
              variant="primary"
              className="flex-1 py-6 text-lg"
            >
              {sessionLoading ? (
                'Loading...'
              ) : isConfirming ? (
                'Processing...'
              ) : (
                `Confirm Payment (${formatCurrency(paidNum)})`
              )}
            </EnhancedButton>
          </div>

          {/* Help Text */}
          <p
            className="text-xs text-center"
            style={{ color: Colors.text.secondary }}
          >
            Use keypad or keyboard to enter amount • Press Enter to confirm • ESC to cancel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
