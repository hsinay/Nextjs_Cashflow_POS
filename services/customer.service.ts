// services/customer.service.ts

import { prisma } from '@/lib/prisma';
import { createCustomerSchema, updateCustomerSchema } from '@/lib/validations/customer.schema';
import { CreateCustomerInput, CustomerFilters, CustomerSegment, UpdateCustomerInput } from '@/types/customer.types';
import { Prisma } from '@prisma/client';
import { createPayment } from './payment.service';

function convertToNumber(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof Prisma.Decimal) {
        return value.toNumber();
    }
    if (value instanceof Date) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(v => convertToNumber(v));
    }
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([key, v]) => [key, convertToNumber(v)])
        );
    }
    return value;
}

export const CustomerService = {
  /**
   * Get all customers (balance included only when filtering by highRisk/creditIssues)
   * This is a conditional optimization - benefits from lightweight query when filters not used
   */
  async getAllCustomers(filters: CustomerFilters) {
    const { search, segment, highRisk, creditIssues, page = 1, limit = 20 } = filters;
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (segment) where.aiSegment = segment;
    const skip = (page - 1) * limit;
    
    // If no balance-dependent filters, use lightweight query
    if (!highRisk && !creditIssues) {
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.customer.count({ where }),
      ]);
      
      return {
        customers: convertToNumber(customers),
        pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      };
    }

    // Otherwise, fetch with balance for filtering
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const total = await prisma.customer.count({ where });
    
    const customersWithBalance = await Promise.all(
      customers.map(async (c) => {
        const outstandingBalance = await CustomerService.calculateOutstandingBalance(c.id);
        const customerWithNumbers = convertToNumber(c);
        return {
          ...customerWithNumbers,
          outstandingBalance,
        };
      })
    );
    
    // Filter by highRisk/creditIssues if needed
    let filtered = customersWithBalance;
    if (highRisk) filtered = filtered.filter(c => (c.churnRiskScore ?? 0) > 0.7);
    if (creditIssues) filtered = filtered.filter(c => c.outstandingBalance >= c.creditLimit);
    
    const effectiveTotal = (highRisk || creditIssues) ? filtered.length : total;
    return {
      customers: filtered,
      pagination: {
        page,
        limit,
        total: effectiveTotal,
        pages: Math.max(1, Math.ceil(effectiveTotal / limit)),
      },
    };
  },
  async getCustomerById(id: string) {
    const customer = await prisma.customer.findFirst({ where: { id, isActive: true } });
    if (!customer) return null;
    const outstandingBalance = await CustomerService.calculateOutstandingBalance(id);
    const recentOrders = await prisma.salesOrder.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    return { 
      ...convertToNumber(customer), 
      outstandingBalance, 
      recentOrders: convertToNumber(recentOrders)
    };
  },
  async createCustomer(data: CreateCustomerInput) {
    const validated = createCustomerSchema.parse(data);
    if (validated.email) {
      const exists = await prisma.customer.findUnique({ where: { email: validated.email } });
      if (exists) throw { code: 'P2002', message: 'Email already exists.' };
    }
    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        email: validated.email,
        contactNumber: validated.contactNumber,
        billingAddress: validated.billingAddress,
        shippingAddress: validated.shippingAddress,
        creditLimit: validated.creditLimit || 0,
        loyaltyPoints: 0,
        aiSegment: validated.aiSegment || CustomerSegment.NEW,
      },
    });
    return convertToNumber(customer);
  },
  async updateCustomer(id: string, data: UpdateCustomerInput) {
    updateCustomerSchema.parse(data);
    if (data.email) {
      const exists = await prisma.customer.findUnique({ where: { email: data.email } });
      if (exists && exists.id !== id) throw { code: 'P2002', message: 'Email already exists.' };
    }
    // Prevent direct update of outstandingBalance and loyaltyPoints
    delete (data as any).outstandingBalance;
    delete (data as any).loyaltyPoints;
    const customer = await prisma.customer.update({ where: { id }, data });
    return convertToNumber(customer);
  },
  async deleteCustomer(id: string) {
    const orders = await prisma.salesOrder.findMany({ where: { customerId: id } });
    if (orders.length > 0) throw { code: 'HAS_ORDERS', message: 'Customer has orders.' };
    return prisma.customer.update({ where: { id }, data: { isActive: false } });
  },
  async calculateOutstandingBalance(customerId: string): Promise<number> {
    const unpaid = await prisma.salesOrder.aggregate({
      where: {
        customerId,
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
      },
      _sum: { balanceAmount: true },
    });
    return Number(unpaid._sum.balanceAmount ?? 0);
  },
  async checkCreditLimit(customerId: string, amount: number): Promise<boolean> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return false;
    const outstanding = await CustomerService.calculateOutstandingBalance(customerId);
    return outstanding + amount <= Number(customer.creditLimit);
  },
  async searchCustomers(query: string) {
    const customers = await prisma.customer.findMany({
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
    return convertToNumber(customers);
  },
  async getHighRiskCustomers() {
    const customers = await prisma.customer.findMany({
      where: { churnRiskScore: { gt: 0.7 }, isActive: true },
    });
    return convertToNumber(customers);
  },
  async getCreditIssueCustomers() {
    const customers = await prisma.customer.findMany({ where: { isActive: true } });
    // Parallelize balance calculation instead of serial for loop
    const customersWithBalance = await Promise.all(
      customers.map(async (c) => ({
        customer: c,
        outstanding: await CustomerService.calculateOutstandingBalance(c.id),
      }))
    );
    // Filter and return only those with credit issues
    return convertToNumber(
      customersWithBalance
        .filter(cb => cb.outstanding >= Number(cb.customer.creditLimit))
        .map(cb => cb.customer)
    );
  },
  async getCustomerBalance(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id, isActive: true } });
    if (!customer) return null;
    const unpaidOrders = await prisma.salesOrder.findMany({
      where: { customerId: id, status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] } },
      orderBy: { createdAt: 'desc' },
    });
    const paymentHistory = await prisma.payment.findMany({ where: { payerId: id, payerType: 'CUSTOMER' }, orderBy: { createdAt: 'desc' } });
    const outstandingBalance = await CustomerService.calculateOutstandingBalance(id);
    return {
      creditLimit: Number(customer.creditLimit),
      outstandingBalance,
      availableCredit: Number(customer.creditLimit) - outstandingBalance,
      unpaidOrders: convertToNumber(unpaidOrders),
      paymentHistory: convertToNumber(paymentHistory),
    };
  },
  async getCustomerOrders(id: string, { status, page = 1, limit = 20 }: { status?: string, page?: number, limit?: number }) {
    const where: any = { customerId: id };
    if (status && status !== 'ALL') where.status = status;
    const skip = (page - 1) * limit;
    const orders = await prisma.salesOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });
    const total = await prisma.salesOrder.count({ where });
    return {
      orders: convertToNumber(orders),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async payBalance(customerId: string, amount: number, paymentMethod: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Customer not found');

    const outstandingBalance = await CustomerService.calculateOutstandingBalance(customerId);
    if (amount > outstandingBalance) {
      throw new Error('Payment amount cannot exceed outstanding balance.');
    }

    return createPayment({
      payerId: customerId,
      payerType: 'CUSTOMER',
      amount,
      paymentMethod: paymentMethod as any,
      status: 'COMPLETED',
      notes: `Customer balance payment for ${customer.name}`,
    });
  },
};
