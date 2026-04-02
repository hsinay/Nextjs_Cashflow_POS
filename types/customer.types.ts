// types/customer.types.ts

export enum CustomerSegment {
  HIGH_VALUE = 'HIGH_VALUE',
  PRICE_SENSITIVE = 'PRICE_SENSITIVE',
  LOYAL = 'LOYAL',
  OCCASIONAL = 'OCCASIONAL',
  NEW = 'NEW'
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  contactNumber: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  creditLimit: number;
  outstandingBalance: number;
  loyaltyPoints: number;
  aiSegment: CustomerSegment;
  churnRiskScore: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  contactNumber?: string;
  billingAddress?: string;
  shippingAddress?: string;
  creditLimit?: number;
  aiSegment?: CustomerSegment;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  contactNumber?: string;
  billingAddress?: string;
  shippingAddress?: string;
  creditLimit?: number;
  aiSegment?: CustomerSegment;
}

export interface CustomerFilters {
  search?: string;
  segment?: CustomerSegment;
  highRisk?: boolean;
  creditIssues?: boolean;
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
