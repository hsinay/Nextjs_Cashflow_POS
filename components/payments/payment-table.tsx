import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { formatDateTimeLocale } from '@/lib/utils';
import { Payment } from '@/types/payment.types';
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Smartphone as MobileWallet,
  Smartphone,
  Wallet,
  Wallet2,
} from 'lucide-react';
import Link from 'next/link';

interface PaymentTableProps {
  payments: Payment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const paymentMethodIcons = {
  CASH: Banknote,
  BANK_TRANSFER: Building2,
  CARD: CreditCard,
  UPI: Smartphone,
  CHEQUE: CheckCircle2,
  DIGITAL_WALLET: Wallet2,
  CREDIT: CreditCard,
  DEBIT: CreditCard,
  MOBILE_WALLET: MobileWallet,
  MIXED: Wallet2,
};

const paymentMethodColors = {
  CASH: 'bg-green-100 text-green-800',
  BANK_TRANSFER: 'bg-blue-100 text-blue-800',
  CARD: 'bg-purple-100 text-purple-800',
  UPI: 'bg-orange-100 text-orange-800',
  CHEQUE: 'bg-gray-100 text-gray-800',
  DIGITAL_WALLET: 'bg-indigo-100 text-indigo-800',
  CREDIT: 'bg-purple-100 text-purple-800',
  DEBIT: 'bg-purple-100 text-purple-800',
  MOBILE_WALLET: 'bg-pink-100 text-pink-800',
  MIXED: 'bg-slate-100 text-slate-800',
};

export function PaymentTable({ payments, pagination }: PaymentTableProps) {

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Wallet className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-lg font-medium">No payments found</p>
                      <p className="text-sm">Try adjusting your filters or record a new payment</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const Icon = paymentMethodIcons[payment.paymentMethod];
                  const payerName = payment.customer?.name || payment.supplier?.name || 'Unknown';
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTimeLocale(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payerName}</div>
                        {payment.customer && (
                          <div className="text-xs text-gray-500">{payment.customer.email || payment.customer.contactNumber || '-'}</div>
                        )}
                        {payment.supplier && (
                          <div className="text-xs text-gray-500">{payment.supplier.email || payment.supplier.contactNumber || '-'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="default"
                          className={payment.payerType === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}
                        >
                          {payment.payerType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${paymentMethodColors[payment.paymentMethod]}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {payment.paymentMethod.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/dashboard/payments/${payment.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <a
              href={`?page=${Math.max(1, pagination.page - 1)}`}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                pagination.page === 1 ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Previous
            </a>
            <a
              href={`?page=${Math.min(pagination.pages, pagination.page + 1)}`}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                pagination.page === pagination.pages ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Next
            </a>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <a
                  href={`?page=${Math.max(1, pagination.page - 1)}`}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    pagination.page === 1 ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </a>
                {[...Array(pagination.pages)].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <a
                      key={pageNum}
                      href={`?page=${pageNum}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === pagination.page
                          ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </a>
                  );
                })}
                <a
                  href={`?page=${Math.min(pagination.pages, pagination.page + 1)}`}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    pagination.page === pagination.pages ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </a>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
