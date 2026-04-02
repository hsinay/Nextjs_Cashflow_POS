'use client';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { BarChart3, Calendar, Download, Lightbulb, PieChart, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const timeRanges = ['Today', '7 Days', '30 Days', '90 Days', 'Year'];
  
  const kpis = [
    {
      title: 'Total Revenue',
      value: '$145,230',
      change: '+12.5%',
      isPositive: true,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Avg Order Value',
      value: '$3,450',
      change: '+8.2%',
      isPositive: true,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '-1.5%',
      isPositive: false,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Total Transactions',
      value: '1,248',
      change: '+22.3%',
      isPositive: true,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  const chartData = [
    { name: 'Week 1', revenue: 12000, orders: 45, profit: 3200 },
    { name: 'Week 2', revenue: 18000, orders: 62, profit: 5400 },
    { name: 'Week 3', revenue: 14000, orders: 51, profit: 4200 },
    { name: 'Week 4', revenue: 22000, orders: 78, profit: 6600 },
  ];

  const categoryStats = [
    { name: 'Electronics', revenue: 45000, percentage: 28 },
    { name: 'Clothing', revenue: 38000, percentage: 24 },
    { name: 'Home & Garden', revenue: 32000, percentage: 20 },
    { name: 'Sports', revenue: 24000, percentage: 15 },
    { name: 'Other', revenue: 17000, percentage: 13 },
  ];

  const topProducts = [
    { name: 'Wireless Headphones', sales: 324, revenue: 12960, trend: '+15%' },
    { name: 'Smart Watch', sales: 287, revenue: 14350, trend: '+8%' },
    { name: 'Phone Case', sales: 512, revenue: 5120, trend: '+32%' },
    { name: 'USB Cable', sales: 445, revenue: 2225, trend: '+18%' },
    { name: 'Screen Protector', sales: 389, revenue: 1945, trend: '+5%' },
  ];

  const paymentMethods = [
    { method: 'Credit Card', percentage: 45, count: 562 },
    { method: 'Debit Card', percentage: 30, count: 374 },
    { method: 'Digital Wallet', percentage: 18, count: 224 },
    { method: 'Cash', percentage: 7, count: 87 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-2">Comprehensive business performance insights</p>
        </div>
        <Button variant="outline">
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-3 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        {timeRanges.map((range) => (
          <button
            key={range}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              range === '30 Days'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {range}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-slate-600">
          <Calendar className="w-5 h-5" />
          <span className="text-sm">Dec 1 - Dec 30, 2025</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className={`kpi-card ${kpi.bgColor} border ${kpi.borderColor} rounded-xl p-6`}
          >
            <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{kpi.value}</p>
            <p className={`text-sm font-semibold mt-2 ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.change} from last period
            </p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Revenue Trend</h2>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-80 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-end justify-around p-6 gap-4">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg hover:from-purple-700 hover:to-purple-500 transition-all"
                  style={{ height: `${(item.revenue / 22000) * 100}%`, minHeight: '20px' }}
                ></div>
                <span className="text-xs text-slate-600 mt-3 font-medium">{item.name}</span>
                <span className="text-sm font-semibold text-slate-900">${(item.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-slate-900 mt-1">$66,230</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Avg per Week</p>
              <p className="text-xl font-bold text-slate-900 mt-1">$16,558</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Growth</p>
              <p className="text-xl font-bold text-green-600 mt-1">+12.5%</p>
            </div>
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">By Category</h2>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600">${(cat.revenue / 1000).toFixed(0)}k revenue</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Top Products
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Sales</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-600 mt-1">#SKU-000{idx + 1}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{product.sales}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(product.revenue)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-green-600">{product.trend}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Payment Methods</h2>
          <div className="space-y-6">
            {paymentMethods.map((method, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{method.method}</p>
                    <p className="text-xs text-slate-600 mt-1">{method.count} transactions</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{method.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      idx === 0
                        ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                        : idx === 1
                        ? 'bg-gradient-to-r from-green-600 to-green-400'
                        : idx === 2
                        ? 'bg-gradient-to-r from-purple-600 to-purple-400'
                        : 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                    }`}
                    style={{ width: `${method.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">Total Transactions: <span className="font-semibold text-slate-900">1,247</span></p>
            <div className="flex gap-2">
              <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-600">Avg Transaction</p>
                <p className="text-lg font-bold text-slate-900 mt-1">$117</p>
              </div>
              <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-600">Total Volume</p>
                <p className="text-lg font-bold text-slate-900 mt-1">$145k</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 rounded-full p-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">AI Analytics Insight</h3>
            <p className="text-sm text-slate-600 mt-1">
              Based on current trends, your top-performing product category "Electronics" shows 28% growth. 
              Recommend allocating 15% more marketing budget to this category. Customer purchase patterns suggest 
              peak sales occur on weekends - consider promotional campaigns on Friday/Saturday.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
