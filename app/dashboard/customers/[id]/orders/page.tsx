'use client';

import { OrderPaymentDialog } from '@/components/customers/order-payment-dialog';
import { OrderPaymentHistory } from '@/components/customers/order-payment-history';
import { OrdersFilter } from '@/components/customers/orders-filter';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CustomerOrdersPage({ params, searchParams }: { params: { id: string }, searchParams?: Record<string, string> }) {
  const page = Number(searchParams?.page || 1);
  const limit = Number(searchParams?.limit || 20);
  const status = searchParams?.status || 'ALL';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<{ [key: string]: any[] }>({});
  const [loadingPayments, setLoadingPayments] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}/orders?status=${status}&page=${page}&limit=${limit}`);
      const data = await res.json();
      setOrders(data.data?.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (orderId: string) => {
    if (paymentHistory[orderId]) {
      return; // Already loaded
    }

    setLoadingPayments(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments`);
      const data = await res.json();
      setPaymentHistory((prev) => ({
        ...prev,
        [orderId]: data.data?.payments || [],
      }));
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoadingPayments(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [params.id, status, page, limit]);

  const formatDate = (dateString: any) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleOrderExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      await fetchPaymentHistory(orderId);
    }
  };

  const handlePaymentSuccess = async () => {
    // Refresh orders and clear payment history cache
    setPaymentHistory((prev) => {
      const newHistory = { ...prev };
      delete newHistory[expandedOrder || ''];
      return newHistory;
    });
    await fetchOrders();
    // Reload payment history
    if (expandedOrder) {
      await fetchPaymentHistory(expandedOrder);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Customer Orders</h1>
        <p className="text-slate-600 mt-2">Manage customer orders and record payments. Click order ID to view details and items.</p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <OrdersFilter currentStatus={status} />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600">
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            <p>No orders found.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 w-12">📋</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Order #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Items</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Payment Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Order Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <>
                    <tr 
                      key={order.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td 
                        className="px-6 py-4 text-center text-sm cursor-pointer"
                        onClick={() => handleOrderExpand(order.id)}
                      >
                        <span className="text-lg">{expandedOrder === order.id ? '▼' : '▶'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => handleOrderExpand(order.id)}>
                        {order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus || 'UNPAID'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'PAID' || order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' || order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'CONFIRMED' || order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PARTIALLY_PAID' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr key={`${order.id}-details`} className="bg-slate-50 border-b border-slate-100">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-6">
                            {/* Order Summary */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900 mb-3">Order Summary</h3>
                              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                                <div className="bg-white p-3 rounded border border-slate-200">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">Order Date</p>
                                  <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(order.createdAt)}</p>
                                </div>
                                <div className="bg-white p-3 rounded border border-slate-200">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">Total Amount</p>
                                  <p className="text-sm font-medium text-slate-900 mt-1">{formatCurrency(order.totalAmount)}</p>
                                </div>
                                <div className="bg-white p-3 rounded border border-slate-200">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">Paid Amount</p>
                                  <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(order.paidAmount || 0)}</p>
                                </div>
                                <div className="bg-white p-3 rounded border border-slate-200">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">Balance Due</p>
                                  <p className="text-sm font-medium text-red-600 mt-1">{formatCurrency(order.balanceAmount)}</p>
                                </div>
                                <div className="bg-white p-3 rounded border border-slate-200">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">Status</p>
                                  <p className="text-sm font-medium text-slate-900 mt-1">{order.status}</p>
                                </div>
                              </div>
                            </div>

                            {/* Payment Action Button */}
                            <div className="flex gap-2">
                              <OrderPaymentDialog
                                orderId={order.id}
                                customerId={params.id}
                                totalAmount={order.totalAmount}
                                paidAmount={order.paidAmount || 0}
                                balanceAmount={order.balanceAmount}
                                paymentStatus={order.paymentStatus || 'UNPAID'}
                                onPaymentSuccess={handlePaymentSuccess}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePaymentSuccess()}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Refresh
                              </Button>
                            </div>

                            {/* Items */}
                            {order.items && order.items.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-slate-900 mb-3">Items in Order</p>
                                <div className="space-y-2">
                                  {order.items.map((item: any, idx: number) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-slate-200">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">{item.product?.name || `Product ${idx + 1}`}</p>
                                        <p className="text-xs text-slate-600">SKU: {item.product?.sku || 'N/A'}</p>
                                      </div>
                                      <div className="text-right ml-4">
                                        <p className="text-sm text-slate-600">Qty: <span className="font-semibold">{item.quantity}</span></p>
                                        <p className="text-sm text-slate-600">{formatCurrency(item.unitPrice)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Payment History */}
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <p className="text-sm font-semibold text-slate-900">Payment History</p>
                                {loadingPayments === order.id && (
                                  <span className="text-xs text-slate-500">Loading...</span>
                                )}
                              </div>
                              <div className="bg-white rounded border border-slate-200">
                                <OrderPaymentHistory
                                  orderId={order.id}
                                  payments={paymentHistory[order.id] || []}
                                  onPaymentDeleted={handlePaymentSuccess}
                                  canDelete={true}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Back Button */}
      <div>
        <Link href={`/dashboard/customers/${params.id}`}>
          <Button variant="outline">Back to Customer</Button>
        </Link>
      </div>
    </div>
  );
}
