'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
}

export function OrderSummary({ subtotal, tax, discount = 0, total }: OrderSummaryProps) {
  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
      <CardContent className="pt-6">
        <div className="space-y-2 text-sm">
          {/* Subtotal */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Discount:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(discount)}</span>
            </div>
          )}

          {/* Tax */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Tax:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(tax)}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 pt-2 mt-2" />

          {/* Grand Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Grand Total:</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
