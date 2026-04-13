/**
 * Authentication and Authorization Helpers
 * Centralized permission management for consistency across the application
 */

export const ROLE_PERMISSIONS = {
  // Pricelist permissions
  PRICELIST_VIEW: ['ADMIN', 'INVENTORY_MANAGER'],
  PRICELIST_CREATE: ['ADMIN'],
  PRICELIST_UPDATE: ['ADMIN'],
  PRICELIST_DELETE: ['ADMIN'],
  PRICELIST_CALCULATE: ['ADMIN', 'INVENTORY_MANAGER', 'CASHIER'],

  // Category permissions
  CATEGORY_VIEW: ['ADMIN', 'INVENTORY_MANAGER'],
  CATEGORY_CREATE: ['ADMIN'],
  CATEGORY_UPDATE: ['ADMIN'],
  CATEGORY_DELETE: ['ADMIN'],

  // Product permissions
  PRODUCT_VIEW: ['ADMIN', 'INVENTORY_MANAGER', 'CASHIER'],
  PRODUCT_CREATE: ['ADMIN', 'INVENTORY_MANAGER'],
  PRODUCT_UPDATE: ['ADMIN', 'INVENTORY_MANAGER'],
  PRODUCT_DELETE: ['ADMIN'],

  // POS permissions
  POS_ACCESS: ['CASHIER', 'ADMIN'],
  POS_PROCESS_PAYMENT: ['CASHIER', 'ADMIN'],
  POS_DELETE_TRANSACTION: ['ADMIN'],

  // Inventory permissions
  INVENTORY_VIEW: ['ADMIN', 'INVENTORY_MANAGER'],
  INVENTORY_UPDATE: ['ADMIN', 'INVENTORY_MANAGER'],

  // User permissions
  USER_VIEW: ['ADMIN'],
  USER_CREATE: ['ADMIN'],
  USER_UPDATE: ['ADMIN'],
  USER_DELETE: ['ADMIN'],

  // Role permissions
  ROLE_VIEW: ['ADMIN'],
  ROLE_MANAGE: ['ADMIN'],
} as const;

/**
 * Check if user has permission for a specific action
 * @param userRoles - Array of roles the user has
 * @param requiredPermission - Permission key from ROLE_PERMISSIONS
 * @returns true if user has at least one role with the required permission
 */
export function hasPermission(
  userRoles: string[] | undefined,
  requiredPermission: keyof typeof ROLE_PERMISSIONS
): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  const allowedRoles = ROLE_PERMISSIONS[requiredPermission];
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Check if user has any of the required permissions
 * @param userRoles - Array of roles the user has
 * @param permissions - Array of permission keys
 * @returns true if user has at least one of the permissions
 */
export function hasAnyPermission(
  userRoles: string[] | undefined,
  permissions: Array<keyof typeof ROLE_PERMISSIONS>
): boolean {
  return permissions.some((perm) => hasPermission(userRoles, perm));
}

/**
 * Check if user has all of the required permissions
 * @param userRoles - Array of roles the user has
 * @param permissions - Array of permission keys
 * @returns true if user has all of the permissions
 */
export function hasAllPermissions(
  userRoles: string[] | undefined,
  permissions: Array<keyof typeof ROLE_PERMISSIONS>
): boolean {
  return permissions.every((perm) => hasPermission(userRoles, perm));
}
