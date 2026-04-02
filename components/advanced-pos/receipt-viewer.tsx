'use client';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Receipt } from '@/types/advanced-pos.types';
import { Download, Mail, Printer } from 'lucide-react';

interface ReceiptViewerProps {
  receipt: Receipt;
  onPrint?: () => void;
  onEmail?: () => void;
  onDownload?: () => void;
}

export function ReceiptViewer({
  receipt,
  onPrint,
  onEmail,
  onDownload,
}: ReceiptViewerProps) {
  return (
    <div className="space-y-4">
      {/* Receipt Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center border-b border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {receipt.storeInfo.storeName}
          </h1>
          {receipt.storeInfo.storeAddress && (
            <p className="text-sm text-gray-600 mt-1">{receipt.storeInfo.storeAddress}</p>
          )}
          {receipt.storeInfo.gstNumber && (
            <p className="text-xs text-gray-600 mt-1">
              GST: {receipt.storeInfo.gstNumber}
            </p>
          )}
        </div>

        {/* Receipt Details */}
        <div className="mb-6 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Receipt #</p>
              <p className="font-semibold text-gray-900">{receipt.receiptNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(receipt.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-600">Payment Method</p>
            <p className="font-semibold text-gray-900">{receipt.paymentMethod}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 text-gray-600">Item</th>
                <th className="text-center py-2 text-gray-600">Qty</th>
                <th className="text-right py-2 text-gray-600">Price</th>
                <th className="text-right py-2 text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2">{item.productName}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-2 font-semibold">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-2 mb-6 border-t-2 border-b border-gray-300 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(receipt.subtotal)}</span>
          </div>
          {receipt.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">{formatCurrency(receipt.tax)}</span>
            </div>
          )}
          {receipt.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="text-red-600">-{formatCurrency(receipt.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(receipt.total)}</span>
          </div>
        </div>

        {/* Customer Info */}
        {(receipt.customerName ||
          receipt.customerEmail ||
          receipt.customerPhone) && (
          <div className="text-center text-sm text-gray-600 mb-6 pb-6 border-b border-gray-300">
            {receipt.customerName && <p>{receipt.customerName}</p>}
            {receipt.customerPhone && <p>{receipt.customerPhone}</p>}
            {receipt.customerEmail && <p>{receipt.customerEmail}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-600">
          <p>Thank you for your purchase!</p>
          {receipt.storeInfo.termsUrl && (
            <p className="mt-2">
              Terms & Conditions: {receipt.storeInfo.termsUrl}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        {onPrint && (
          <Button
            onClick={onPrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
        )}
        {onEmail && (
          <Button
            onClick={onEmail}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>
        )}
        {onDownload && (
          <Button
            onClick={onDownload}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
