/**
 * Centralized Role-Based Access Control (RBAC) Configuration
 * Single source of truth for role permissions across the entire application
 */

/**
 * Role definitions
 */
export enum RoleEnum {
  ADMIN = 'ADMIN',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  SALES_MANAGER = 'SALES_MANAGER',
  PURCHASE_MANAGER = 'PURCHASE_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  CASHIER = 'CASHIER',
}

/**
 * Permission names - flat, descriptive permission keys
 */
export enum PermissionEnum {
  // Pricelist permissions
  PRICELIST_VIEW = 'PRICELIST_VIEW',
  PRICELIST_CREATE = 'PRICELIST_CREATE',
  PRICELIST_UPDATE = 'PRICELIST_UPDATE',
  PRICELIST_DELETE = 'PRICELIST_DELETE',
  PRICELIST_CALCULATE = 'PRICELIST_CALCULATE',

  // Category permissions
  CATEGORY_VIEW = 'CATEGORY_VIEW',
  CATEGORY_CREATE = 'CATEGORY_CREATE',
  CATEGORY_UPDATE = 'CATEGORY_UPDATE',
  CATEGORY_DELETE = 'CATEGORY_DELETE',

  // Product permissions
  PRODUCT_VIEW = 'PRODUCT_VIEW',
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',

  // POS permissions
  POS_ACCESS = 'POS_ACCESS',
  POS_PROCESS_PAYMENT = 'POS_PROCESS_PAYMENT',
  POS_DELETE_TRANSACTION = 'POS_DELETE_TRANSACTION',

  // Inventory permissions
  INVENTORY_VIEW = 'INVENTORY_VIEW',
  INVENTORY_UPDATE = 'INVENTORY_UPDATE',

  // User permissions
  USER_VIEW = 'USER_VIEW',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  // Role permissions
  ROLE_VIEW = 'ROLE_VIEW',
  ROLE_MANAGE = 'ROLE_MANAGE',

  // Sales permissions
  SALES_READ = 'SALES_READ',
  SALES_CREATE = 'SALES_CREATE',

  // Payment permissions
  PAYMENT_VIEW = 'PAYMENT_VIEW',
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  PAYMENT_DELETE = 'PAYMENT_DELETE',

  // Accounting permissions
  ACCOUNTING_VIEW = 'ACCOUNTING_VIEW',
  ACCOUNTING_MANAGE = 'ACCOUNTING_MANAGE',
}

/**
 * Central role-to-permissions matrix
 * This is the single source of truth for all permission checks
 */
export const ROLE_PERMISSIONS: Record<RoleEnum, PermissionEnum[]> = {
  [RoleEnum.ADMIN]: [
    // Admin has all permissions
    PermissionEnum.PRICELIST_VIEW,
    PermissionEnum.PRICELIST_CREATE,
    PermissionEnum.PRICELIST_UPDATE,
    PermissionEnum.PRICELIST_DELETE,
    PermissionEnum.PRICELIST_CALCULATE,

    PermissionEnum.CATEGORY_VIEW,
    PermissionEnum.CATEGORY_CREATE,
    PermissionEnum.CATEGORY_UPDATE,
    PermissionEnum.CATEGORY_DELETE,

    PermissionEnum.PRODUCT_VIEW,
    PermissionEnum.PRODUCT_CREATE,
    PermissionEnum.PRODUCT_UPDATE,
    PermissionEnum.PRODUCT_DELETE,

    PermissionEnum.POS_ACCESS,
    PermissionEnum.POS_PROCESS_PAYMENT,
    PermissionEnum.POS_DELETE_TRANSACTION,

    PermissionEnum.INVENTORY_VIEW,
    PermissionEnum.INVENTORY_UPDATE,

    PermissionEnum.USER_VIEW,
    PermissionEnum.USER_CREATE,
    PermissionEnum.USER_UPDATE,
    PermissionEnum.USER_DELETE,

    PermissionEnum.ROLE_VIEW,
    PermissionEnum.ROLE_MANAGE,

    PermissionEnum.SALES_READ,
    PermissionEnum.SALES_CREATE,

    PermissionEnum.PAYMENT_VIEW,
    PermissionEnum.PAYMENT_CREATE,
    PermissionEnum.PAYMENT_UPDATE,
    PermissionEnum.PAYMENT_DELETE,

    PermissionEnum.ACCOUNTING_VIEW,
    PermissionEnum.ACCOUNTING_MANAGE,
  ],

  [RoleEnum.INVENTORY_MANAGER]: [
    PermissionEnum.PRICELIST_VIEW,
    PermissionEnum.PRICELIST_CALCULATE,

    PermissionEnum.CATEGORY_VIEW,
    PermissionEnum.CATEGORY_CREATE,
    PermissionEnum.CATEGORY_UPDATE,

    PermissionEnum.PRODUCT_VIEW,
    PermissionEnum.PRODUCT_CREATE,
    PermissionEnum.PRODUCT_UPDATE,

    PermissionEnum.INVENTORY_VIEW,
    PermissionEnum.INVENTORY_UPDATE,
  ],

  [RoleEnum.SALES_MANAGER]: [
    PermissionEnum.PRODUCT_VIEW,
    PermissionEnum.CATEGORY_VIEW,

    PermissionEnum.SALES_READ,
    PermissionEnum.SALES_CREATE,

    PermissionEnum.PRICELIST_VIEW,
    PermissionEnum.PRICELIST_CALCULATE,
  ],

  [RoleEnum.PURCHASE_MANAGER]: [
    PermissionEnum.PRODUCT_VIEW,
    PermissionEnum.CATEGORY_VIEW,

    PermissionEnum.INVENTORY_VIEW,
    PermissionEnum.INVENTORY_UPDATE,
  ],

  [RoleEnum.ACCOUNTANT]: [
    PermissionEnum.PAYMENT_VIEW,
    PermissionEnum.PAYMENT_CREATE,
    PermissionEnum.PAYMENT_UPDATE,

    PermissionEnum.ACCOUNTING_VIEW,
    PermissionEnum.ACCOUNTING_MANAGE,

    PermissionEnum.SALES_READ,
  ],

  [RoleEnum.CASHIER]: [
    PermissionEnum.PRODUCT_VIEW,
    PermissionEnum.POS_ACCESS,
    PermissionEnum.POS_PROCESS_PAYMENT,

    PermissionEnum.PRICELIST_CALCULATE,
    PermissionEnum.PRICELIST_VIEW,
  ],
};

/**
 * Helper function to check if role has permission
 * @param role - The role to check
 * @param permission - The permission to check
 * @returns true if role has the permission
 */
export function roleHasPermission(role: RoleEnum, permission: PermissionEnum): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Helper function to check if any role has permission
 * @param roles - Array of roles to check
 * @param permission - The permission to check
 * @returns true if any role has the permission
 */
export function rolesHavePermission(roles: RoleEnum[], permission: PermissionEnum): boolean {
  return roles.some((role) => roleHasPermission(role, permission));
}

/**
 * Get all permissions for a role
 * @param role - The role
 * @returns Array of permissions for that role
 */
export function getRolePermissions(role: RoleEnum): PermissionEnum[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
