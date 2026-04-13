'use client';

import { ChevronDown, Clock, History, LayoutDashboard, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function POSNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="relative">
        <button
          disabled
          className="w-full nav-item flex items-center gap-3 py-2.5 px-4 rounded-md transition-colors duration-200 text-slate-300 hover:bg-slate-800 hover:text-slate-100 active:bg-slate-700 active:text-white font-medium text-sm justify-between"
        >
          <div className="flex items-center gap-3">
            <MonitorPlay className="nav-icon h-5 w-5 flex-shrink-0" />
            <span>POS</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const posMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/pos/dashboard' },
    { name: 'Terminal', icon: MonitorPlay, href: '/dashboard/pos' },
    { name: 'Active Session', icon: Clock, href: '/dashboard/pos/sessions/active' },
    { name: 'History', icon: History, href: '/dashboard/pos/history' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full nav-item flex items-center gap-3 py-2.5 px-4 rounded-md transition-colors duration-200 text-slate-300 hover:bg-slate-800 hover:text-slate-100 active:bg-slate-700 active:text-white font-medium text-sm justify-between"
      >
        <div className="flex items-center gap-3">
          <MonitorPlay className="nav-icon h-5 w-5 flex-shrink-0" />
          <span>POS</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-1 pl-4 space-y-1 bg-slate-800 rounded-md">
          {posMenuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 py-2 px-3 rounded-md transition-colors duration-200 text-slate-400 hover:bg-slate-700 hover:text-slate-100 text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
