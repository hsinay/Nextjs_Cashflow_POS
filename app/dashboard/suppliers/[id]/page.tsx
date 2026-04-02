// app/(dashboard)/suppliers/[id]/page.tsx

import { CreditStatusBadge } from '@/components/suppliers/credit-status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { SupplierService } from '@/services/supplier.service';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const supplier = await SupplierService.getSupplierById(params.id);

  if (!supplier) {
    notFound();
  }

  const creditPercent = supplier.creditLimit > 0 
    ? (supplier.outstandingBalance / supplier.creditLimit) * 100 
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">{supplier.name}</h1>
        <p className="text-slate-600 mt-2">View and manage supplier information and orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            {supplier.email && (
              <div>
                <p className="text-sm font-semibold text-slate-600">Email</p>
                <p className="text-slate-900">{supplier.email}</p>
              </div>
            )}
            {supplier.contactNumber && (
              <div>
                <p className="text-sm font-semibold text-slate-600">Phone</p>
                <p className="text-slate-900">{supplier.contactNumber}</p>
              </div>
            )}
            {supplier.address && (
              <div>
                <p className="text-sm font-semibold text-slate-600">Address</p>
                <p className="text-slate-900">{supplier.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Credit Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Credit Status</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-600">Credit Limit</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(supplier.creditLimit)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Outstanding Balance (We Owe)</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(supplier.outstandingBalance)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Available Credit</p>
              <p className="text-xl font-semibold text-slate-900">
                {formatCurrency(supplier.creditLimit - supplier.outstandingBalance)}
              </p>
            </div>
            <div className="mt-4">
              <CreditStatusBadge 
                outstandingBalance={supplier.outstandingBalance} 
                creditLimit={supplier.creditLimit} 
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Credit Utilization</h2>
          <div className="space-y-4">
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all ${
                  creditPercent >= 100 ? 'bg-red-500' : 
                  creditPercent >= 80 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(creditPercent, 100)}%` }}
              />
            </div>
            <p className="text-sm text-slate-600">
              {creditPercent.toFixed(1)}% of credit limit used
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {supplier.recentOrders && supplier.recentOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Recent Purchase Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Balance</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {supplier.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{order.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">{formatCurrency(order.balanceAmount)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>
          <Button>Edit Supplier</Button>
        </Link>
        <Link href={`/dashboard/suppliers/${supplier.id}/orders`}>
          <Button variant="secondary">View All Orders</Button>
        </Link>
        <Link href="/dashboard/suppliers">
          <Button variant="outline">Back to Suppliers</Button>
        </Link>
      </div>
    </div>
  );
}
