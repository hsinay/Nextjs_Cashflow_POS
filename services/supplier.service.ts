// services/supplier.service.ts

import { prisma } from '@/lib/prisma';
import { createSupplierSchema, updateSupplierSchema } from '@/lib/validations/supplier.schema';
import { CreateSupplierInput, SupplierFilters, UpdateSupplierInput } from '@/types/supplier.types';

export const SupplierService = {
  /**
   * Get all suppliers (balance included only when filtering by creditIssues)
   * This is a conditional optimization - benefits from lightweight query when filters not used
   */
  async getAllSuppliers(filters: SupplierFilters) {
    const { search, creditIssues, isActive = true, page = 1, limit = 20 } = filters;
    const where: any = { isActive };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const skip = (page - 1) * limit;
    
    // If no balance-dependent filters, use lightweight query
    if (!creditIssues) {
      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.supplier.count({ where }),
      ]);
      
      return {
        suppliers: suppliers.map(s => ({ ...s, creditLimit: Number(s.creditLimit) })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }
    
    // Otherwise, fetch with balance for filtering
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    const total = await prisma.supplier.count({ where });
    
    // Calculate outstanding balance for each supplier
    const suppliersWithBalance = await Promise.all(
      suppliers.map(async (s) => ({
        ...s,
        creditLimit: Number(s.creditLimit),
        outstandingBalance: await SupplierService.calculateOutstandingBalance(s.id),
      }))
    );
    
    // Filter by creditIssues if needed
    let filtered = suppliersWithBalance;
    if (creditIssues) {
      filtered = filtered.filter((s) => s.outstandingBalance >= Number(s.creditLimit));
    }
    
    return {
      suppliers: filtered,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findFirst({ where: { id, isActive: true } });
    if (!supplier) return null;
    
    const outstandingBalance = await SupplierService.calculateOutstandingBalance(id);
    const recentOrders = await prisma.purchaseOrder.findMany({
      where: { supplierId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    return {
      ...supplier,
      creditLimit: Number(supplier.creditLimit),
      outstandingBalance,
      recentOrders,
    };
  },

  async createSupplier(data: CreateSupplierInput) {
    createSupplierSchema.parse(data);
    
    if (data.email) {
      const exists = await prisma.supplier.findUnique({ where: { email: data.email } });
      if (exists) throw { code: 'P2002', message: 'Email already exists.' };
    }
    
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        creditLimit: data.creditLimit ?? 0,
      },
    });
    
    return {
      ...supplier,
      creditLimit: Number(supplier.creditLimit),
    };
  },

  async updateSupplier(id: string, data: UpdateSupplierInput) {
    updateSupplierSchema.parse(data);
    
    if (data.email) {
      const exists = await prisma.supplier.findUnique({ where: { email: data.email } });
      if (exists && exists.id !== id) throw { code: 'P2002', message: 'Email already exists.' };
    }
    
    // Prevent direct update of outstandingBalance
    delete (data as any).outstandingBalance;
    
    const supplier = await prisma.supplier.update({ where: { id }, data });
    
    return {
      ...supplier,
      creditLimit: Number(supplier.creditLimit),
    };
  },

  async deleteSupplier(id: string) {
    const orders = await prisma.purchaseOrder.findMany({ where: { supplierId: id } });
    if (orders.length > 0) throw { code: 'HAS_ORDERS', message: 'Supplier has purchase orders.' };
    
    const supplier = await prisma.supplier.update({ where: { id }, data: { isActive: false } });
    
    return {
      ...supplier,
      creditLimit: Number(supplier.creditLimit),
    };
  },

  async calculateOutstandingBalance(supplierId: string): Promise<number> {
    const unpaid = await prisma.purchaseOrder.aggregate({
      where: {
        supplierId,
        status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] },
      },
      _sum: { balanceAmount: true },
    });
    return Number(unpaid._sum.balanceAmount ?? 0);
  },

  async checkCreditLimit(supplierId: string, amount: number): Promise<boolean> {
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return false;
    
    const outstanding = await SupplierService.calculateOutstandingBalance(supplierId);
    return outstanding + amount <= Number(supplier.creditLimit);
  },

  async searchSuppliers(query: string) {
    return prisma.supplier.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { contactNumber: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    });
  },

  async getCreditIssueSuppliers() {
    const suppliers = await prisma.supplier.findMany({ where: { isActive: true } });
    const result: typeof suppliers = [];
    
    for (const s of suppliers) {
      const outstanding = await SupplierService.calculateOutstandingBalance(s.id);
      if (outstanding >= Number(s.creditLimit)) result.push(s);
    }
    
    return result;
  },

  async getSupplierBalance(id: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id, isActive: true } });
    if (!supplier) return null;
    
    const unpaidOrders = await prisma.purchaseOrder.findMany({
      where: { supplierId: id, status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] } },
      orderBy: { createdAt: 'desc' },
    });
    
    const outstandingBalance = await SupplierService.calculateOutstandingBalance(id);
    
    return {
      creditLimit: Number(supplier.creditLimit),
      outstandingBalance,
      availableCredit: Number(supplier.creditLimit) - outstandingBalance,
      unpaidOrders,
    };
  },

  async getSupplierOrders(id: string, { status, page = 1, limit = 20 }: { status?: string; page?: number; limit?: number }) {
    const where: any = { supplierId: id };
    if (status && status !== 'ALL') where.status = status;
    
    const skip = (page - 1) * limit;
    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    const total = await prisma.purchaseOrder.count({ where });
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },
};
