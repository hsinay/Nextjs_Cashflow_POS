'use client';

import { Button } from '@/components/ui/button';
import { Calendar, Download, FileText, Filter, Lightbulb, Plus } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    {
      id: 1,
      name: 'Monthly Financial Report',
      description: 'Comprehensive monthly profit & loss statement',
      date: 'Dec 30, 2025',
      status: 'Ready',
      type: 'Financial',
      downloads: 24,
    },
    {
      id: 2,
      name: 'Sales Performance Summary',
      description: 'Regional and category-wise sales breakdown',
      date: 'Dec 29, 2025',
      status: 'Ready',
      type: 'Sales',
      downloads: 18,
    },
    {
      id: 3,
      name: 'Inventory Status Report',
      description: 'Current stock levels and reorder alerts',
      date: 'Dec 28, 2025',
      status: 'Ready',
      type: 'Inventory',
      downloads: 12,
    },
    {
      id: 4,
      name: 'Customer Analysis Report',
      description: 'Customer segmentation and retention metrics',
      date: 'Dec 25, 2025',
      status: 'Ready',
      type: 'Customers',
      downloads: 8,
    },
    {
      id: 5,
      name: 'Payment Collections Report',
      description: 'Outstanding receivables and collection status',
      date: 'Dec 24, 2025',
      status: 'Ready',
      type: 'Payments',
      downloads: 15,
    },
    {
      id: 6,
      name: 'Tax Compliance Report',
      description: 'VAT, GST and tax liability summary',
      date: 'Dec 23, 2025',
      status: 'Ready',
      type: 'Accounting',
      downloads: 6,
    },
  ];

  const typeColors = {
    Financial: 'bg-blue-100 text-blue-800',
    Sales: 'bg-green-100 text-green-800',
    Inventory: 'bg-orange-100 text-orange-800',
    Customers: 'bg-purple-100 text-purple-800',
    Payments: 'bg-yellow-100 text-yellow-800',
    Accounting: 'bg-red-100 text-red-800',
  };

  const schedules = [
    { name: 'Daily Sales Report', frequency: 'Every Day at 8:00 AM', nextRun: 'Dec 13, 6:30 AM', enabled: true },
    { name: 'Weekly Inventory Summary', frequency: 'Every Monday at 9:00 AM', nextRun: 'Dec 15, 9:00 AM', enabled: true },
    { name: 'Monthly Financial Close', frequency: 'Last day of month at 11:59 PM', nextRun: 'Dec 31, 11:59 PM', enabled: true },
    { name: 'Quarterly Tax Report', frequency: 'Every 3 months', nextRun: 'Jan 1, 2026', enabled: false },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 mt-2">Generate and manage business reports</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="w-5 h-5" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
          All Types
        </button>
        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
          Financial
        </button>
        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
          Sales
        </button>
        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
          Inventory
        </button>
        <div className="ml-auto flex items-center gap-2 text-slate-600">
          <Calendar className="w-5 h-5" />
          <input type="text" placeholder="Date range" className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500" />
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Recent Reports
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Report Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Downloads</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{report.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{report.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[report.type as keyof typeof typeColors]}`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{report.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{report.downloads}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Scheduled Reports
          </h2>
          <Button variant="link">
            + Add Schedule
          </Button>
        </div>
        <div className="space-y-4">
          {schedules.map((schedule, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 transition">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${schedule.enabled ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{schedule.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{schedule.frequency}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600">Next run:</p>
                <p className="text-sm font-medium text-slate-900">{schedule.nextRun}</p>
              </div>
              <div className="ml-6 flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                {schedule.enabled ? (
                  <Button variant="destructive" size="sm">Disable</Button>
                ) : (
                  <Button variant="outline" size="sm">Enable</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 rounded-full p-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Report Recommendations</h3>
            <p className="text-sm text-slate-600 mt-1">
              Based on your business activity, we recommend generating a <strong>Customer Lifetime Value Report</strong> 
              to identify high-value customer segments and <strong>Inventory Turnover Analysis</strong> to optimize stock levels. 
              Your monthly financial reports are consistently generated on time with 95% accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
