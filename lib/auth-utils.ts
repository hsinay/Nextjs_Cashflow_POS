// lib/auth-utils.ts

import { authOptions } from '@/lib/auth';
import { getServerSession, Session } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * Require authentication for API route
 * @throws 401 if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return session;
}

/**
 * Require specific role(s) for API route
 * @param roles Array of required roles (any one is sufficient)
 * @throws 403 if user doesn't have required role
 */
export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  
  const hasRole = roles.some((role) =>
    (session.user.roles || []).includes(role)
  );

  if (!hasRole) {
    throw new Response(JSON.stringify({ error: 'Forbidden - insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return session;
}

/**
 * Require specific permission for API route
 * @throws 403 if user doesn't have required permission
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth();

  if (!hasPermission(session.user, permission)) {
    throw new Response(JSON.stringify({ error: 'Forbidden - insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return session;
}

/**
 * Check if user has specific role
 */
export function hasRole(
  user: Session['user'] | undefined,
  role: string
): boolean {
  if (!user) return false;
  return (user.roles || []).includes(role);
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: Session['user'] | undefined,
  permission: string
): boolean {
  if (!user) return false;
  return (user.permissions || []).includes(permission);
}

/**
 * Check if user has all specified roles
 */
export function hasAllRoles(
  user: Session['user'] | undefined,
  roles: string[]
): boolean {
  if (!user) return false;
  return roles.every((role) => (user.roles || []).includes(role));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(
  user: Session['user'] | undefined,
  permissions: string[]
): boolean {
  if (!user) return false;
  return permissions.every((perm) =>
    (user.permissions || []).includes(perm)
  );
}

/**
 * Check resource-level access
 * @param user Session user
 * @param resource Resource name (e.g., 'products', 'users')
 * @param action Action type (e.g., 'read', 'create', 'update', 'delete')
 */
export function canAccessResource(
  user: Session['user'] | undefined,
  resource: string,
  action: string
): boolean {
  if (!user) return false;

  const permission = `${resource}.${action}`;
  return hasPermission(user, permission);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: Session['user'] | undefined): boolean {
  return hasRole(user, 'ADMIN');
}

/**
 * Get user's role values
 */
export function getUserRoles(user: Session['user'] | undefined): string[] {
  if (!user?.roles) return [];
  return user.roles;
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  const session = await requireRole(['ADMIN']);
  return session;
}

/**
 * Format API error response
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Format successful API response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isStrong: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score (0-4)
 */
export function getPasswordStrengthScore(password: string): number {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  return Math.min(score, 4);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(password: string): string {
  const score = getPasswordStrengthScore(password);
  switch (score) {
    case 0:
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
}
