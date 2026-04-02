// app/(auth)/login/page.tsx

import { LoginPageClient } from '@/components/auth/login-page-client';

export const dynamic = 'force-dynamic';

/**
 * Login page wrapper
 * This is a server component that wraps the client component
 */
export default function LoginPage() {
  return <LoginPageClient />;
}
