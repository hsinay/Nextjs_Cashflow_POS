/**
 * Pricelist Type Definitions
 * Comprehensive types for the pricelist feature
 */

// ============================================
// Enums
// ============================================

export enum PriceCalculationType {
  FIXED_PRICE = 'FIXED_PRICE',
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_DISCOUNT = 'FIXED_DISCOUNT',
  FORMULA = 'FORMULA',
}

export enum PricelistAppliedTo {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  CUSTOMER = 'CUSTOMER',
  ALL_PRODUCTS = 'ALL_PRODUCTS',
}

// ============================================
// Pricelist
// ============================================

export interface Pricelist {
  id: string;
  name: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  currency: string;
  priority: number;
  applicableToCustomer?: string | null;
  applicableToCategory?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  rules?: PricelistRule[];
  items?: PricelistItem[];
}

export interface CreatePricelistPayload {
  name: string;
  description?: string;
  priority?: number;
  currency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  applicableToCustomer?: string | null;
  applicableToCategory?: string | null;
  isActive?: boolean;
}

export interface UpdatePricelistPayload extends Partial<CreatePricelistPayload> {}

// ============================================
// Pricelist Rule
// ============================================

export interface PricelistRule {
  id: string;
  pricelistId: string;
  name: string;
  priority: number;
  minQuantity: number;
  maxQuantity?: number | null;
  appliedTo: PricelistAppliedTo;
  productId?: string | null;
  categoryId?: string | null;
  customerGroupId?: string | null;
  calculationType: PriceCalculationType;
  discountPercentage?: number | null;
  fixedPrice?: number | null;
  fixedDiscount?: number | null;
  formulaMargin?: number | null;
  formulaMarkup?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  pricelist?: Pricelist;
  product?: {
    id: string;
    name: string;
    sku?: string;
    price: number;
    costPrice?: number;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface CreatePricelistRulePayload {
  name: string;
  priority?: number;
  minQuantity?: number;
  maxQuantity?: number | null;
  appliedTo?: PricelistAppliedTo;
  productId?: string | null;
  categoryId?: string | null;
  customerGroupId?: string | null;
  calculationType?: PriceCalculationType;
  discountPercentage?: number | null;
  fixedPrice?: number | null;
  fixedDiscount?: number | null;
  formulaMargin?: number | null;
  formulaMarkup?: number | null;
  isActive?: boolean;
}

export interface UpdatePricelistRulePayload extends Partial<CreatePricelistRulePayload> {}

// ============================================
// Pricelist Item (cached price)
// ============================================

export interface PricelistItem {
  id: string;
  pricelistId: string;
  productId: string;
  basePrice: number;
  calculatedPrice: number;
  createdAt: Date;
  updatedAt: Date;
  pricelist?: Pricelist;
  product?: {
    id: string;
    name: string;
    sku?: string;
    price: number;
  } | null;
}

// ============================================
// Price Calculation
// ============================================

export interface PriceCalculationInput {
  productId: string;
  quantity: number;
  pricelistId?: string | null;
  customerId?: string | null;
  categoryId?: string;
}

export interface PriceCalculationResult {
  basePrice: number;
  calculatedPrice: number;
  discount: number;
  discountPercentage: number;
  appliedRule: {
    ruleId: string;
    ruleName: string;
    calculationType: string;
    minQuantity?: number;
    maxQuantity?: number | null;
  } | null;
}

export interface BatchPriceCalculationInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  pricelistId?: string | null;
  customerId?: string;
  categoryId?: string;
}

export interface BatchPriceCalculationResult {
  items: Array<{
    productId: string;
    quantity: number;
    basePrice: number;
    calculatedPrice: number;
    discount: number;
    discountPercentage: number;
  }>;
  totalBasePrice: number;
  totalCalculatedPrice: number;
  totalDiscount: number;
}

// ============================================
// API Responses
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PricelistListResponse extends ApiResponse<Pricelist[]> {}

export interface PricelistDetailResponse extends ApiResponse<Pricelist> {}

export interface PriceCalculationResponse extends ApiResponse<PriceCalculationResult> {}

export interface BatchPriceCalculationResponse extends ApiResponse<BatchPriceCalculationResult> {}

// ============================================
// Form Data
// ============================================

export interface PricelistFormData extends CreatePricelistPayload {
  rules: (CreatePricelistRulePayload & { id?: string })[];
}

export interface RuleFormData extends CreatePricelistRulePayload {}

// ============================================
// Helper Types
// ============================================

export type CalculationTypeConfig = {
  type: PriceCalculationType;
  label: string;
  description: string;
  requiredFields: string[];
};

export type PricelistStats = {
  totalRules: number;
  productsCovered: number;
  isActive: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
};
