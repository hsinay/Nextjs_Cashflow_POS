'use client';

import { CurrencySymbol } from '@/components/ui/currency-symbol';
import { formatCurrency } from '@/lib/currency';
import { POSSessionWithRelations } from '@/types/pos-session.types';
import { Clock, User } from 'lucide-react';
import { SessionStatusBadge } from './session-status-badge';

interface SessionDisplayProps {
  session: POSSessionWithRelations;
}

export function SessionDisplay({ session }: SessionDisplayProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Active Session</h3>
        <SessionStatusBadge status={session.status} />
      </div>

      {/* Session Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cashier */}
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Cashier</p>
            <p className="text-sm font-semibold text-gray-900">{session.cashier?.username || 'N/A'}</p>
          </div>
        </div>

        {/* Opened Time */}
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Opened</p>
            <p className="text-sm font-semibold text-gray-900">{formatTime(session.openedAt)}</p>
          </div>
        </div>

        {/* Opening Cash */}
        <div className="flex items-start gap-3">
          <CurrencySymbol className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0 inline-flex items-center justify-center" />
          <div>
            <p className="text-xs text-gray-500">Opening Cash</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(Number(session.openingCashAmount))}
            </p>
          </div>
        </div>

        {/* Total Sales */}
        <div className="flex items-start gap-3">
          <CurrencySymbol className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0 inline-flex items-center justify-center" />
          <div>
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(Number(session.totalSalesAmount))}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg p-4 space-y-2 border border-blue-100">
        <p className="text-xs font-semibold text-gray-600 uppercase">Payment Breakdown</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-500">Cash</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(session.totalCashReceived))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Card</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(session.totalCardReceived))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Digital</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(session.totalDigitalReceived))}</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Transactions</p>
        <p className="text-2xl font-bold text-blue-600">{session.totalTransactions}</p>
      </div>

      {/* Terminal Info */}
      {session.terminalId && (
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Terminal</p>
          <p className="text-sm text-gray-900">{session.terminalId}</p>
        </div>
      )}

      {/* Day Book Link */}
      {session.dayBook && (
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Day Book</p>
          <p className="text-sm text-gray-900">Status: {session.dayBook.status}</p>
        </div>
      )}
    </div>
  );
}
