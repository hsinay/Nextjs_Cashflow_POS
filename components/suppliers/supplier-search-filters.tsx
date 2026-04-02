// components/suppliers/supplier-search-filters.tsx

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SupplierSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [creditIssues, setCreditIssues] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    setSearch(searchParams.get('search') || '');
    setCreditIssues(searchParams.get('creditIssues') === 'true');
  }, [searchParams]);

  const apply = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (creditIssues) params.set('creditIssues', 'true');
    params.set('page', '1');
    router.push(`/dashboard/suppliers?${params.toString()}`);
  };

  const clearAll = () => {
    setSearch('');
    setCreditIssues(false);
    router.push('/dashboard/suppliers');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Search</label>
          <input
            placeholder="Supplier name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors w-full">
            <input
              type="checkbox"
              checked={creditIssues}
              onChange={(e) => setCreditIssues(e.target.checked)}
              className="w-4 h-4 border border-slate-300 rounded cursor-pointer accent-purple-500"
            />
            <span className="text-sm font-medium text-slate-900">Credit Issues</span>
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
