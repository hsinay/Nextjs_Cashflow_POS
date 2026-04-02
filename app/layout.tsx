import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

export const metadata: Metadata = {
  title: 'CashFlow AI - ERP System',
  description: 'AI-Powered Point of Sale & Enterprise Resource Planning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Implement actual logic to determine if it's a dashboard route, likely using useRouter from 'next/navigation'
  const isDashboardRoute = true; 

  return (
    <html lang="en">
      <body>
        <Providers>
          {isDashboardRoute ? (
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
          ) : (
            // Default layout for non-dashboard routes (e.g., login, public pages)
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
