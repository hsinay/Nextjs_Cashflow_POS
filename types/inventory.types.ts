// types/inventory.types.ts

import { Product } from './product.types';

export const INVENTORY_TRANSACTION_TYPES = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'POS_SALE'] as const;
export type InventoryTransactionType = typeof INVENTORY_TRANSACTION_TYPES[number];

export interface InventoryTransaction {
    id: string;
    productId: string;
    type: InventoryTransactionType;
    quantity: number;
    referenceId: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    product?: Product;
}

export interface CreateInventoryTransactionInput {
    productId: string;
    transactionType: InventoryTransactionType;
    quantity: number;
    notes?: string;
    referenceId?: string;
}
