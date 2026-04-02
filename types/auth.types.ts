// types/auth.types.ts

/**
 * User entity matching database model
 */
export interface User {
  id: string;
  username: string;
  email: string;
  contactNumber: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles?: Role[];
}

/**
 * User without sensitive fields
 */
export interface UserPublic {
  id: string;
  username: string;
  email: string;
  contactNumber: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles?: string[]; // role names only
}

/**
 * Role entity matching database model
 */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session object containing user and role info
 */
export interface Session {
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  expires: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration input
 */
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  contactNumber?: string;
}

/**
 * Change password input
 */
export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Update user input (profile only)
 */
export interface UpdateUserInput {
  email?: string;
  contactNumber?: string | null;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Role enums
 */
export enum RoleEnum {
  ADMIN = 'ADMIN',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  SALES_MANAGER = 'SALES_MANAGER',
  PURCHASE_MANAGER = 'PURCHASE_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  CASHIER = 'CASHIER',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
}

/**
 * Permission types
 */
export type Permission =
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'roles.read'
  | 'roles.manage'
  | 'products.read'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'categories.read'
  | 'categories.create'
  | 'categories.update'
  | 'categories.delete'
  | 'inventory.read'
  | 'inventory.update'
  | 'sales.read'
  | 'sales.create'
  | 'purchase.read'
  | 'purchase.create'
  | 'reports.read'
  | 'pos.access';

/**
 * Role permissions matrix
 */
export const ROLE_PERMISSIONS: Record<RoleEnum, Permission[]> = {
  [RoleEnum.ADMIN]: [
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'roles.read',
    'roles.manage',
    'products.read',
    'products.create',
    'products.update',
    'products.delete',
    'categories.read',
    'categories.create',
    'categories.update',
    'categories.delete',
    'inventory.read',
    'inventory.update',
    'sales.read',
    'sales.create',
    'purchase.read',
    'purchase.create',
    'reports.read',
    'pos.access',
  ],
  [RoleEnum.INVENTORY_MANAGER]: [
    'products.read',
    'products.create',
    'products.update',
    'products.delete',
    'categories.read',
    'categories.create',
    'categories.update',
    'categories.delete',
    'inventory.read',
    'inventory.update',
    'purchase.read',
    'purchase.create',
  ],
  [RoleEnum.SALES_MANAGER]: [
    'products.read',
    'categories.read',
    'sales.read',
    'sales.create',
    'reports.read',
  ],
  [RoleEnum.PURCHASE_MANAGER]: [
    'purchase.read',
    'purchase.create',
    'inventory.read',
    'inventory.update',
  ],
  [RoleEnum.ACCOUNTANT]: [
    'reports.read',
    'sales.read',
    'purchase.read',
  ],
  [RoleEnum.CASHIER]: [
    'pos.access',
    'products.read',
    'categories.read',
    'sales.read',
  ],
  [RoleEnum.CUSTOMER]: [
    'products.read',
    'categories.read',
    'sales.read',
  ],
  [RoleEnum.SUPPLIER]: [
    'purchase.read',
  ],
};
