'use client';

import { Button } from '@/components/ui/button';
import { ConcretePaymentMethod } from '@/types/payment.types';
import { CreditCard, Smartphone, Wallet, Zap } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: ConcretePaymentMethod;
  onSelectMethod: (method: ConcretePaymentMethod) => void;
  availableMethods?: ConcretePaymentMethod[];
  disabled?: boolean;
}

// Display-friendly method names and icons
const METHOD_CONFIG: Record<
  ConcretePaymentMethod,
  { label: string; icon: React.ReactNode; color: string }
> = {
  CASH: {
    label: 'Cash',
    icon: '💵',
    color: 'bg-green-100 hover:bg-green-200 border-green-300 text-green-700',
  },
  CREDIT: {
    label: 'Credit',
    icon: '💳',
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700',
  },
  CARD: {
    label: 'Card',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700',
  },
  UPI: {
    label: 'UPI',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700',
  },
  BANK_TRANSFER: {
    label: 'Bank Transfer',
    icon: '🏦',
    color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-700',
  },
  CHEQUE: {
    label: 'Cheque',
    icon: '📋',
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-700',
  },
  DIGITAL_WALLET: {
    label: 'Digital Wallet',
    icon: <Wallet className="w-4 h-4" />,
    color: 'bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-700',
  },
  DEBIT: {
    label: 'Debit',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'bg-teal-100 hover:bg-teal-200 border-teal-300 text-teal-700',
  },
  MOBILE_WALLET: {
    label: 'Mobile Wallet',
    icon: <Smartphone className="w-4 h-4" />,
    color: 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300 text-cyan-700',
  },
};

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
  availableMethods = ['CASH', 'CREDIT', 'CARD', 'UPI'] as ConcretePaymentMethod[],
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">Payment Method</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableMethods.map((method) => {
          const config = METHOD_CONFIG[method];
          const isSelected = selectedMethod === method;

          return (
            <Button
              key={method}
              onClick={() => onSelectMethod(method)}
              disabled={disabled}
              variant={isSelected ? 'default' : 'outline'}
              className={`h-auto py-3 flex flex-col items-center gap-1 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : config.color
              }`}
            >
              <span className="text-lg">{typeof config.icon === 'string' ? config.icon : config.icon}</span>
              <span className="truncate">{config.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
