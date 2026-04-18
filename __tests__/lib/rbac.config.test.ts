/**
 * Test suite for RBAC configuration
 * Validates role-permission matrix and authorization logic
 */

import {
    getRolePermissions,
    PermissionEnum,
    ROLE_PERMISSIONS,
    RoleEnum,
    roleHasPermission,
    rolesHavePermission,
} from '@/lib/rbac.config';

describe('RBAC Configuration', () => {
  describe('RoleEnum', () => {
    it('should define all required roles', () => {
      expect(RoleEnum.ADMIN).toBe('ADMIN');
      expect(RoleEnum.INVENTORY_MANAGER).toBe('INVENTORY_MANAGER');
      expect(RoleEnum.SALES_MANAGER).toBe('SALES_MANAGER');
      expect(RoleEnum.PURCHASE_MANAGER).toBe('PURCHASE_MANAGER');
      expect(RoleEnum.ACCOUNTANT).toBe('ACCOUNTANT');
      expect(RoleEnum.CASHIER).toBe('CASHIER');
    });

    it('should have 6 distinct roles', () => {
      const roles = Object.values(RoleEnum);
      expect(roles).toHaveLength(6);
      expect(new Set(roles).size).toBe(6); // All unique
    });
  });

  describe('PermissionEnum', () => {
    it('should define permissions for users', () => {
      expect(PermissionEnum).toHaveProperty('USER_VIEW');
      expect(PermissionEnum).toHaveProperty('USER_CREATE');
      expect(PermissionEnum).toHaveProperty('USER_UPDATE');
      expect(PermissionEnum).toHaveProperty('USER_DELETE');
    });

    it('should define permissions for categories', () => {
      expect(PermissionEnum).toHaveProperty('CATEGORY_VIEW');
      expect(PermissionEnum).toHaveProperty('CATEGORY_CREATE');
      expect(PermissionEnum).toHaveProperty('CATEGORY_UPDATE');
      expect(PermissionEnum).toHaveProperty('CATEGORY_DELETE');
    });

    it('should define permissions for products', () => {
      expect(PermissionEnum).toHaveProperty('PRODUCT_VIEW');
      expect(PermissionEnum).toHaveProperty('PRODUCT_CREATE');
      expect(PermissionEnum).toHaveProperty('PRODUCT_UPDATE');
      expect(PermissionEnum).toHaveProperty('PRODUCT_DELETE');
    });

    it('should have at least 24 permissions', () => {
      const permissions = Object.keys(PermissionEnum);
      expect(permissions.length).toBeGreaterThanOrEqual(24);
    });
  });

  describe('ROLE_PERMISSIONS matrix', () => {
    it('should define permissions for all roles', () => {
      const roles = Object.values(RoleEnum);
      roles.forEach(role => {
        expect(ROLE_PERMISSIONS).toHaveProperty(role as string);
      });
    });

    it('should have array of permissions for each role', () => {
      const roles = Object.values(RoleEnum);
      roles.forEach(role => {
        const permissions = ROLE_PERMISSIONS[role as keyof typeof RoleEnum];
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThan(0);
      });
    });

    it('ADMIN should have all permissions', () => {
      const adminPermissions = ROLE_PERMISSIONS[RoleEnum.ADMIN];
      const allPermissions = Object.values(PermissionEnum);
      allPermissions.forEach(permission => {
        expect(adminPermissions).toContain(permission as string);
      });
    });

    it('CASHIER should have limited permissions', () => {
      const cashierPermissions = ROLE_PERMISSIONS[RoleEnum.CASHIER];
      expect(cashierPermissions.length).toBeLessThan(
        ROLE_PERMISSIONS[RoleEnum.ADMIN].length
      );
    });

    it('INVENTORY_MANAGER should have product/category permissions', () => {
      const invPermissions = ROLE_PERMISSIONS[RoleEnum.INVENTORY_MANAGER];
      expect(invPermissions).toContain(PermissionEnum.PRODUCT_VIEW);
      expect(invPermissions).toContain(PermissionEnum.CATEGORY_VIEW);
    });

    it('SALES_MANAGER should have sales-related permissions', () => {
      const salesPermissions = ROLE_PERMISSIONS[RoleEnum.SALES_MANAGER];
      expect(salesPermissions).toContain(PermissionEnum.SALES_READ);
      expect(salesPermissions).toContain(PermissionEnum.SALES_CREATE);
    });

    it('ACCOUNTANT should have financial permissions', () => {
      const accountantPermissions = ROLE_PERMISSIONS[RoleEnum.ACCOUNTANT];
      expect(accountantPermissions).toContain(PermissionEnum.PAYMENT_VIEW);
      expect(accountantPermissions).toContain(PermissionEnum.ACCOUNTING_VIEW);
    });
  });

  describe('roleHasPermission', () => {
    it('should return true when role has permission', () => {
      expect(
        roleHasPermission(RoleEnum.ADMIN, PermissionEnum.USER_CREATE)
      ).toBe(true);
    });

    it('should return false when role lacks permission', () => {
      expect(
        roleHasPermission(RoleEnum.CASHIER, PermissionEnum.USER_UPDATE)
      ).toBe(false);
    });

    it('should handle non-existent role gracefully', () => {
      expect(
        roleHasPermission('INVALID_ROLE' as any, PermissionEnum.USER_VIEW)
      ).toBe(false);
    });

    it('should handle non-existent permission gracefully', () => {
      expect(roleHasPermission(RoleEnum.ADMIN, 'INVALID_PERMISSION' as any))
        .toBe(false); // Non-existent permissions will not be in any role
    });
  });

  describe('rolesHavePermission', () => {
    it('should return true when any role has permission', () => {
      expect(
        rolesHavePermission(
          [RoleEnum.CASHIER, RoleEnum.ADMIN],
          PermissionEnum.USER_CREATE
        )
      ).toBe(true);
    });

    it('should return false when no role has permission', () => {
      expect(
        rolesHavePermission(
          [RoleEnum.CASHIER, RoleEnum.INVENTORY_MANAGER],
          PermissionEnum.USER_DELETE
        )
      ).toBe(false);
    });

    it('should return false for empty role array', () => {
      expect(
        rolesHavePermission([], PermissionEnum.USER_VIEW)
      ).toBe(false);
    });

    it('should handle multiple roles correctly', () => {
      const roles = [RoleEnum.SALES_MANAGER, RoleEnum.ACCOUNTANT];
      expect(
        rolesHavePermission(roles, PermissionEnum.USER_DELETE)
      ).toBe(false); // Neither sales nor accounting can delete users
    });
  });

  describe('getRolePermissions', () => {
    it('should return permission array for valid role', () => {
      const permissions = getRolePermissions(RoleEnum.ADMIN);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid role', () => {
      const permissions = getRolePermissions('INVALID_ROLE' as any);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBe(0);
    });

    it('should return correct permissions for each role', () => {
      Object.values(RoleEnum).forEach(role => {
        const permissions = getRolePermissions(role as keyof typeof RoleEnum);
        const expectedPermissions = ROLE_PERMISSIONS[role as keyof typeof RoleEnum];
        expect(permissions).toEqual(expectedPermissions);
      });
    });
  });

  describe('Permission isolation', () => {
    it('should not allow DELETE operations for non-admin users', () => {
      const nonAdminRoles = [
        RoleEnum.CASHIER,
        RoleEnum.SALES_MANAGER,
        RoleEnum.ACCOUNTANT,
      ];
      nonAdminRoles.forEach(role => {
        expect(
          rolesHavePermission(
            [role],
            PermissionEnum.USER_DELETE
          )
        ).toBe(false);
      });
    });

    it('should not allow USER_UPDATE for CASHIER', () => {
      expect(
        roleHasPermission(RoleEnum.CASHIER, PermissionEnum.USER_UPDATE)
      ).toBe(false);
    });

    it('should prevent CASHIER from viewing users', () => {
      expect(
        roleHasPermission(RoleEnum.CASHIER, PermissionEnum.USER_VIEW)
      ).toBe(false);
    });
  });

  describe('Role hierarchy', () => {
    it('ADMIN should be superset of other roles permissions', () => {
      const adminPerms = new Set(
        ROLE_PERMISSIONS[RoleEnum.ADMIN]
      );
      const otherRoles = [
        RoleEnum.CASHIER,
        RoleEnum.SALES_MANAGER,
        RoleEnum.ACCOUNTANT,
        RoleEnum.INVENTORY_MANAGER,
      ];

      otherRoles.forEach(role => {
        const rolePerms = ROLE_PERMISSIONS[role as keyof typeof RoleEnum];
        rolePerms.forEach(perm => {
          expect(adminPerms.has(perm)).toBe(true);
        });
      });
    });

    it('should have proper permission escalation', () => {
      const adminPermCount = ROLE_PERMISSIONS[RoleEnum.ADMIN].length;
      const otherRoleCounts = [
        ROLE_PERMISSIONS[RoleEnum.INVENTORY_MANAGER].length,
        ROLE_PERMISSIONS[RoleEnum.SALES_MANAGER].length,
        ROLE_PERMISSIONS[RoleEnum.ACCOUNTANT].length,
        ROLE_PERMISSIONS[RoleEnum.CASHIER].length,
        ROLE_PERMISSIONS[RoleEnum.PURCHASE_MANAGER].length,
      ];

      otherRoleCounts.forEach(count => {
        expect(count).toBeLessThanOrEqual(adminPermCount);
      });
    });
  });
});
