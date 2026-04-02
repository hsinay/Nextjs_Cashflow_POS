'use client';

import { BarChart3, Clock, DollarSign, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';

export default function DashboardPage() {
  const kpis = [
    {
      title: 'Total Revenue',
      value: '$125,430',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Active Orders',
      value: '248',
      change: '+5.2%',
      isPositive: true,
      icon: ShoppingCart,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Total Customers',
      value: '1,245',
      change: '+8.1%',
      isPositive: true,
      icon: Users,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Inventory Items',
      value: '3,524',
      change: '-2.3%',
      isPositive: false,
      icon: Package,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
  ];

  const recentOrders = [
    { id: 'SO001', customer: 'Acme Corp', amount: '$4,230', status: 'paid', date: '2024-12-11' },
    { id: 'SO002', customer: 'Tech Solutions', amount: '$2,890', status: 'pending', date: '2024-12-10' },
    { id: 'SO003', customer: 'Global Trade', amount: '$5,120', status: 'paid', date: '2024-12-10' },
    { id: 'SO004', customer: 'Fashion Hub', amount: '$1,450', status: 'overdue', date: '2024-12-08' },
    { id: 'SO005', customer: 'Digital Media', amount: '$3,680', status: 'pending', date: '2024-12-07' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back! Here's your business overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className={`kpi-card ${kpi.bgColor} border ${kpi.borderColor} rounded-xl p-6`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{kpi.value}</p>
                  <p className={`text-sm font-semibold mt-2 ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change} from last month
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg opacity-80">
                  <Icon className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend</h2>
          <div className="h-64 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Chart visualization</p>
            </div>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales by Category</h2>
          <div className="h-64 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Chart visualization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.customer}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{order.amount}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          <div className="ai-insight">
            <div className="flex items-start gap-3">
              <div className="ai-icon"></div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">AI Insight</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Your best-selling category is Electronics with a 28% increase this month.
                </p>
              </div>
            </div>
          </div>

          <div className="ai-insight">
            <div className="flex items-start gap-3">
              <div className="ai-icon"></div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Action Required</h3>
                <p className="text-sm text-slate-600 mt-1">
                  4 orders are overdue. Review and follow up with customers.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg. Order Value</span>
                <span className="font-semibold text-slate-900">$3,474</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Conversion Rate</span>
                <span className="font-semibold text-slate-900">3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Pending Payments</span>
                <span className="font-semibold text-slate-900">$12,450</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
