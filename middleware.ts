// middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware configuration
 * Protects routes that require authentication
 */
export default withAuth(
  function middleware(_request: NextRequest) {
    // Additional custom logic can go here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if route requires authentication
        const protectedRoutes = [
          '/dashboard',
          '/api/users',
          '/api/roles',
          '/profile',
        ];

        const isProtectedRoute = protectedRoutes.some((route) =>
          req.nextUrl.pathname.startsWith(route)
        );

        // If it's a protected route, user must have a token
        if (isProtectedRoute) {
          return !!token;
        }

        // Allow public routes
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

/**
 * Matcher configuration
 * Define which routes this middleware applies to
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
