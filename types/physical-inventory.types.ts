/**
 * Physical inventory domain types (API / UI). Inputs mirror validation schemas.
 */

export type CountMethod = 'FULL_COUNT' | 'PARTIAL_COUNT' | 'CYCLE_COUNT';

/** Minimal location row for count-session forms (API-shaped). */
export interface Location {
  id: string;
  name: string;
  type?: string;
  code?: string | null;
}

export type {
  AddCountLineInput,
  CreatePhysicalInventoryInput,
  UpdateCountLineInput,
  UpdatePhysicalInventoryInput,
} from '@/lib/validations/physical-inventory.schema';

/** Serialized inventory session with common relations (matches service casts). */
export interface PhysicalInventory {
  id: string;
  referenceNumber: string;
  locationId: string;
  status: string;
  countDate: Date;
  countMethod: string;
  notes: string | null;
  createdById: string;
  confirmedById: string | null;
  confirmedAt: Date | null;
  totalVariance: number;
  variancePercentage: number | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: PhysicalInventoryLine[];
  location?: { id: string; name: string; code?: string | null };
  createdBy?: { id: string; username: string };
  confirmedBy?: { id: string; username: string } | null;
}

export interface PhysicalInventoryLine {
  id: string;
  physicalInventoryId: string;
  productId: string;
  systemQuantity: number;
  physicalQuantity: number | null;
  variance: number | null;
  batchNumber: string | null;
  expiryDate: Date | string | null;
  notes: string | null;
  countedBy: string | null;
  countedAt: Date | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: { id: string; name: string; sku: string | null };
}

export interface VarianceReport {
  referenceNumber: string;
  locationId: string;
  countDate: Date;
  totalProductsCount: number;
  countedProductsCount: number;
  uncountedProductsCount: number;
  totalVariance: number;
  accuracyPercentage: number;
  completionStatus: string;
  highVarianceItems: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string | null;
    systemQty: number;
    physicalQty: number | null;
    variance: number | null;
    variancePercent: number | null;
  }>;
  missingItems: Array<{
    id: string;
    productId: string;
    productName: string;
    systemQty: number;
  }>;
  excessItems: Array<{
    id: string;
    productId: string;
    productName: string;
    physicalQty: number;
  }>;
}
