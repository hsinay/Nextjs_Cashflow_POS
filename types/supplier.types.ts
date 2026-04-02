// types/supplier.types.ts

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  contactNumber: string | null;
  address: string | null;
  creditLimit: number; // Decimal from Prisma, converted to number
  outstandingBalance?: number; // Calculated, not stored in DB
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierInput {
  name: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  creditLimit?: number;
}

export interface UpdateSupplierInput {
  name?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  creditLimit?: number;
}

export interface SupplierFilters {
  search?: string;
  creditIssues?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreditStatus {
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  utilizationPercentage: number;
  isOverLimit: boolean;
}

export interface SupplierBalance {
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  unpaidOrders: any[];
  paymentHistory?: any[];
}
