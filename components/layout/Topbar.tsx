'use client';

import { AvatarDropdown } from '@/components/auth/avatar-dropdown';
import { useCurrency } from '@/lib/currency-context';
import { BellIcon, CircleDollarSign, SearchIcon } from 'lucide-react';
import Link from 'next/link';

export function Topbar() {
  const { activeCurrency, currencySymbol } = useCurrency();

  return (
    <div className="topbar bg-white px-8 h-[70px] flex items-center justify-between border-b border-slate-200 shadow-sm">
      <div className="search-bar relative w-[400px]">
        <input
          type="text"
          placeholder="Search transactions, customers, products..."
          className="form-input search-input w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
      </div>

      <div className="flex items-center gap-4">
        {/* Currency indicator */}
        <Link
          href="/dashboard/settings/currency"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 rounded px-2 py-1"
          title="Currency settings"
        >
          <CircleDollarSign className="h-4 w-4" />
          <span className="font-mono font-semibold">{currencySymbol} {activeCurrency}</span>
        </Link>

        <button className="relative text-slate-400 hover:text-slate-600 transition-colors duration-200">
          <BellIcon className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <AvatarDropdown />
      </div>
    </div>
  );
}
