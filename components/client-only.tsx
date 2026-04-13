'use client';

import { ReactNode, Suspense } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders content only on the client side
 * Prevents hydration mismatches for dynamic content like timestamps
 */
export function ClientOnly({ children, fallback = '-' }: ClientOnlyProps) {
  return (
    <Suspense fallback={<>{fallback}</>}>
      {children}
    </Suspense>
  );
}
