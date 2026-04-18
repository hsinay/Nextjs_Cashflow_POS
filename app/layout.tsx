import type { Metadata } from 'next';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CashFlow AI - ERP System',
  description: 'AI-Powered Point of Sale & Enterprise Resource Planning System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
