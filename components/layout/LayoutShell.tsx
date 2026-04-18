'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isPOSTerminal = pathname === '/dashboard/pos';
  const isDashboard = pathname.startsWith('/dashboard');

  // Auth pages and root: no chrome
  if (isAuthRoute || !isDashboard) {
    return <>{children}</>;
  }

  // POS terminal: full-width, no left nav sidebar — just topbar + content
  if (isPOSTerminal) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-shrink-0">
          <Topbar />
        </div>
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  // All other dashboard routes: sidebar + topbar grid
  return (
    <div className="grid grid-cols-[260px_1fr] grid-rows-[70px_1fr] h-screen">
      <div className="col-span-1 row-span-2">
        <Sidebar />
      </div>
      <div className="col-span-1 row-span-1">
        <Topbar />
      </div>
      <main className="col-span-1 row-span-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
