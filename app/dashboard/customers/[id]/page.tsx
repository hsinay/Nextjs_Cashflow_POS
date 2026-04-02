// app/(dashboard)/customers/[id]/page.tsx

import { ChurnRiskIndicator } from '@/components/customers/churn-risk-indicator';
import { CreditStatusBadge } from '@/components/customers/credit-status-badge';
import { LoyaltyBadge } from '@/components/customers/loyalty-badge';
import { SegmentBadge } from '@/components/customers/segment-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { CustomerService } from '@/services/customer.service';
import { CustomerSegment } from '@/types/customer.types';
import Link from 'next/link';

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await CustomerService.getCustomerById(params.id);
  if (!customer) return <div>Customer not found.</div>;
  const { outstandingBalance, creditLimit, loyaltyPoints, aiSegment, churnRiskScore, recentOrders } = customer;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Customer Details</h1>
        <p className="text-slate-600 mt-2">View and manage customer information and orders.</p>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <SegmentBadge segment={aiSegment as CustomerSegment} />
          <LoyaltyBadge points={loyaltyPoints} />
          {churnRiskScore !== null && <ChurnRiskIndicator score={churnRiskScore} />}
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-600">Name</p>
              <p className="text-base text-slate-900 font-medium">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Email</p>
              <p className="text-base text-slate-900">{customer.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Phone</p>
              <p className="text-base text-slate-900">{customer.contactNumber || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Billing Address</p>
              <p className="text-base text-slate-900">{customer.billingAddress || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Shipping Address</p>
              <p className="text-base text-slate-900">{customer.shippingAddress || '-'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-600">Credit Limit</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(creditLimit)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Outstanding Balance</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(outstandingBalance)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Credit Status</p>
              <div className="mt-1">
                <CreditStatusBadge outstandingBalance={outstandingBalance} creditLimit={creditLimit} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-slate-600">No recent orders.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                <div>
                  <p className="font-medium text-slate-900">Order #{order.id}</p>
                  <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/customers/${customer.id}/edit`}>
          <Button>Edit Customer</Button>
        </Link>
        <Link href={`/dashboard/customers/${customer.id}/orders`}>
          <Button variant="secondary">View All Orders</Button>
        </Link>
        <Link href="/dashboard/customers">
          <Button variant="outline">Back to Customers</Button>
        </Link>
      </div>
    </div>
  );
}
