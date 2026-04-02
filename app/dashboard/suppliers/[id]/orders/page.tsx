// app/(dashboard)/suppliers/[id]/orders/page.tsx

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { SupplierService } from '@/services/supplier.service';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SupplierOrdersPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }; 
  searchParams?: Record<string, string>;
}) {
  const supplier = await SupplierService.getSupplierById(params.id);

  if (!supplier) {
    notFound();
  }

  const page = Number(searchParams?.page || 1);
  const limit = Number(searchParams?.limit || 20);
  const status = searchParams?.status;

  const { orders, pagination } = await SupplierService.getSupplierOrders(params.id, {
    status,
    page,
    limit,
  });

  const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOutstanding = orders.reduce((sum, order) => sum + Number(order.balanceAmount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Purchase Orders</h1>
        <p className="text-slate-600 mt-2">View all purchase orders for {supplier.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-600">Total Orders</p>
          <p className="font-bold text-3xl text-slate-900 mt-2">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-600">Total Purchased</p>
          <p className="font-bold text-3xl text-slate-900 mt-2">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-600">Total Outstanding</p>
          <p className="font-bold text-3xl text-red-600 mt-2">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-600">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
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
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {formatCurrency(order.balanceAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
            >
              <Button 
                variant={p === pagination.page ? "default" : "outline"}
                size="sm"
              >
                {p}
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/suppliers/${params.id}`}>
          <Button variant="outline">Back to Supplier</Button>
        </Link>
      </div>
    </div>
  );
}
