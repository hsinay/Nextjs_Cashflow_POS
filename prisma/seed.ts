// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Role constants
const ROLES = {
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  SALES_MANAGER: 'SALES_MANAGER',
  PURCHASE_MANAGER: 'PURCHASE_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  CASHIER: 'CASHIER',
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
};

// Role permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'users.read', 'users.create', 'users.update', 'users.delete',
    'roles.read', 'roles.manage',
    'products.read', 'products.create', 'products.update', 'products.delete',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'inventory.read', 'inventory.update',
    'sales.read', 'sales.create',
    'purchase.read', 'purchase.create',
    'reports.read', 'pos.access',
  ],
  INVENTORY_MANAGER: [
    'products.read', 'products.create', 'products.update', 'products.delete',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'inventory.read', 'inventory.update',
    'purchase.read', 'purchase.create',
  ],
  SALES_MANAGER: [
    'products.read', 'categories.read', 'sales.read', 'sales.create', 'reports.read',
  ],
  PURCHASE_MANAGER: [
    'purchase.read', 'purchase.create', 'inventory.read', 'inventory.update',
  ],
  ACCOUNTANT: ['reports.read', 'sales.read', 'purchase.read'],
  CASHIER: ['pos.access', 'products.read', 'categories.read', 'sales.read'],
  CUSTOMER: ['products.read', 'categories.read', 'sales.read'],
  SUPPLIER: ['purchase.read'],
};

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create roles with their permissions
    const rolesData = Object.entries(ROLES).map(([key, name]) => ({
      name,
      description: `${key.replace(/_/g, ' ')} role`,
      permissions: ROLE_PERMISSIONS[name],
    }));

    // Create or update roles
    const roles: Record<string, string> = {};
    for (const roleData of rolesData) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          permissions: roleData.permissions,
          description: roleData.description,
        },
        create: {
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
        },
      });
      roles[roleData.name] = role.id;
    }

    console.log(`✅ Created/Updated ${Object.keys(roles).length} roles`);

    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create default admin user
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        isActive: true,
        contactNumber: '+1-800-000-0000',
      },
    });

    // Assign ADMIN role to admin user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: roles[ROLES.ADMIN],
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: roles[ROLES.ADMIN],
      },
    });

    console.log(`✅ Created/Updated admin user: ${adminUser.username}`);

    // Create sample users for each role
    const sampleUsers = [
      {
        username: 'inventory_manager',
        email: 'inventory@example.com',
        password: 'Manager@123',
        role: ROLES.INVENTORY_MANAGER,
        contactNumber: '+1-800-000-0001',
      },
      {
        username: 'sales_manager',
        email: 'sales@example.com',
        password: 'Manager@123',
        role: ROLES.SALES_MANAGER,
        contactNumber: '+1-800-000-0002',
      },
      {
        username: 'cashier',
        email: 'cashier@example.com',
        password: 'Cashier@123',
        role: ROLES.CASHIER,
        contactNumber: '+1-800-000-0003',
      },
      {
        username: 'accountant',
        email: 'accountant@example.com',
        password: 'Accountant@123',
        role: ROLES.ACCOUNTANT,
        contactNumber: '+1-800-000-0004',
      },
      {
        username: 'customer',
        email: 'customer@example.com',
        password: 'Customer@123',
        role: ROLES.CUSTOMER,
        contactNumber: '+1-800-000-0005',
      },
    ];

    for (const userData of sampleUsers) {
      const hashedPwd = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.upsert({
        where: { username: userData.username },
        update: {},
        create: {
          username: userData.username,
          email: userData.email,
          password: hashedPwd,
          isActive: true,
          contactNumber: userData.contactNumber,
        },
      });

      // Assign role to user
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: roles[userData.role],
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roles[userData.role],
        },
      });
    }

    console.log(`✅ Created ${sampleUsers.length} sample users`);

    // Seed default locations for physical inventory
    const locations = [
      {
        name: 'Main Warehouse',
        code: 'WH-001',
        description: 'Primary storage warehouse',
        type: 'WAREHOUSE',
      },
      {
        name: 'Secondary Warehouse',
        code: 'WH-002',
        description: 'Secondary storage warehouse',
        type: 'WAREHOUSE',
      },
      {
        name: 'Receiving Section',
        code: 'WH-001-RCV',
        description: 'Goods receiving area in Main Warehouse',
        type: 'SECTION',
        parentCode: 'WH-001',
      },
      {
        name: 'Display Section A',
        code: 'WH-001-DSA',
        description: 'Display/retail section in Main Warehouse',
        type: 'SECTION',
        parentCode: 'WH-001',
      },
      {
        name: 'Storage Shelf 1',
        code: 'WH-001-S1',
        description: 'Shelf storage in Main Warehouse',
        type: 'SHELF',
        parentCode: 'WH-001',
      },
    ];

    // Get parent location IDs
    const locationsMap: Record<string, string> = {};
    for (const locData of locations) {
      const existingLoc = await prisma.location.findUnique({
        where: { code: locData.code },
      });

      if (existingLoc) {
        locationsMap[locData.code] = existingLoc.id;
        continue;
      }

      const parentId = locData.parentCode ? locationsMap[locData.parentCode] : null;

      const location = await prisma.location.create({
        data: {
          name: locData.name,
          code: locData.code,
          description: locData.description,
          type: locData.type,
          parentLocationId: parentId,
          isActive: true,
        },
      });

      locationsMap[locData.code] = location.id;
    }

    console.log(`✅ Created/Verified ${Object.keys(locationsMap).length} locations for physical inventory`);

    // Display credentials for testing
    console.log('\n📋 Test Credentials:');
    console.log('─'.repeat(50));
    console.log('Admin:              admin / Admin@123');
    console.log('Inventory Manager:  inventory_manager / Manager@123');
    console.log('Sales Manager:      sales_manager / Manager@123');
    console.log('Cashier:            cashier / Cashier@123');
    console.log('Accountant:         accountant / Accountant@123');
    console.log('Customer:           customer / Customer@123');
    console.log('─'.repeat(50));
    console.log('\n✨ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

