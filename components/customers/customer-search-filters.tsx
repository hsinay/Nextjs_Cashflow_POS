"use client";

import { CustomerSegment } from '@/types/customer.types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function CustomerSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<string>('');
  const [highRisk, setHighRisk] = useState(false);
  const [creditIssues, setCreditIssues] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    setSearch(searchParams.get('search') || '');
    setSegment(searchParams.get('segment') || '');
    setHighRisk(searchParams.get('highRisk') === 'true');
    setCreditIssues(searchParams.get('creditIssues') === 'true');
  }, [searchParams]);

  const apply = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (segment) params.set('segment', segment);
    if (highRisk) params.set('highRisk', 'true');
    if (creditIssues) params.set('creditIssues', 'true');
    // reset to first page on new filters
    params.set('page', '1');
    router.push(`/dashboard/customers?${params.toString()}`);
  };

  const clearAll = () => {
    setSearch('');
    setSegment('');
    setHighRisk(false);
    setCreditIssues(false);
    router.push(`/dashboard/customers`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Search</label>
          <input
            placeholder="Name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Segment</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">All segments</option>
            {Object.values(CustomerSegment).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors w-full">
            <input
              type="checkbox"
              checked={highRisk}
              onChange={(e) => setHighRisk(e.target.checked)}
              className="w-4 h-4 border border-slate-300 rounded cursor-pointer accent-purple-500"
            />
            <span className="text-sm font-medium text-slate-900">High risk</span>
          </label>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors w-full">
            <input
              type="checkbox"
              checked={creditIssues}
              onChange={(e) => setCreditIssues(e.target.checked)}
              className="w-4 h-4 border border-slate-300 rounded cursor-pointer accent-purple-500"
            />
            <span className="text-sm font-medium text-slate-900">Credit issues</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={apply}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
        >
          Apply Filters
        </button>
        <button
          onClick={clearAll}
          className="px-6 py-2 border border-slate-300 text-slate-900 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
