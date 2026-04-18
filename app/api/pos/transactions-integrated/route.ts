import { logger } from '@/lib/logger';
/**
 * API Route: POST /api/pos/transactions-integrated
 * 
 * Complete POS transaction with integrated inventory, accounting, and customer management
 * 
 * Request body:
 * {
 *   transactionNumber: string (unique identifier)
 *   cashierId: string (user UUID)
 *   sessionId: string (optional - POS session UUID)
 *   customerId: string (optional - customer UUID)
 *   loyaltyPointsRate: number (optional - points per rupee, default: 1)
 *   costPriceForInventory: boolean (optional - use cost price for COGS, default: true)
 *   items: [
 *     {
 *       productId: string
 *       quantity: number
 *       unitPrice?: number (if different from product price)
 *       discountApplied?: number
 *     }
 *   ]
 *   paymentDetails: [
 *     {
 *       paymentMethod: string (CASH, CARD, UPI, DIGITAL_WALLET, etc.)
 *       amount: number
 *       referenceNumber?: string
 *       cardLast4?: string
 *       cardBrand?: string
 *       authorizationId?: string
 *       walletProvider?: string
 *       upiId?: string
 *       chequeNumber?: string
 *       chequeDate?: ISO datetime
 *       chequeBank?: string
 *       transactionFee?: number
 *       notes?: string
 *     }
 *   ]
 *   notes?: string
 * }
 * 
 * Response:
 * {
 *   success: true
 *   data: {
 *     transactionId: string
 *     transactionNumber: string
 *     totalAmount: number
 *     totalTax: number
 *     totalDiscount: number
 *     pointsEarned: number
 *     paymentMethods: string[]
 *     inventoryEntriesCreated: number
 *     ledgerEntriesCreated: number
 *     customerBalanceUpdated: boolean
 *   }
 * }
 */

import { authOptions } from '@/lib/auth';
import {
    processIntegratedPOSTransaction,
    validatePOSIntegrationInput,
} from '@/services/pos-integration.service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const paymentDetailSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'DIGITAL_WALLET', 'CHEQUE', 'BANK_TRANSFER', 'CREDIT', 'DEBIT', 'MOBILE_WALLET']),
  amount: z.number().positive('Amount must be positive'),
  referenceNumber: z.string().optional(),
  transactionFee: z.number().min(0).optional(),
  notes: z.string().optional(),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
  authorizationId: z.string().optional(),
  walletProvider: z.string().optional(),
  walletTransactionId: z.string().optional(),
  upiId: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().datetime().optional(),
  chequeBank: z.string().optional(),
});

const transactionItemSchema = z.object({
  productId: z.string().uuid('Product ID must be valid UUID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive().optional(),
  discountApplied: z.number().min(0).optional(),
});

const integratedPOSTransactionSchema = z.object({
  transactionNumber: z.string().min(1),
  cashierId: z.string().uuid('Cashier ID must be valid UUID'),
  sessionId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  loyaltyPointsRate: z.number().positive().optional(),
  costPriceForInventory: z.boolean().optional(),
  items: z.array(transactionItemSchema).min(1, 'At least one item required'),
  paymentDetails: z
    .array(paymentDetailSchema)
    .min(1, 'At least one payment method required'),
  notes: z.string().optional(),
});

export type IntegratedPOSTransactionInput = z.infer<
  typeof integratedPOSTransactionSchema
>;

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions - POS transactions require INVENTORY_MANAGER or ADMIN
    const hasPermission =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('INVENTORY_MANAGER') ||
      session.user.roles?.includes('CASHIER');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to process POS transactions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: IntegratedPOSTransactionInput = integratedPOSTransactionSchema.parse(body);

    // Additional business logic validation
    const validationErrors = validatePOSIntegrationInput(validatedData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Process integrated transaction
    const result = await processIntegratedPOSTransaction(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Transaction ${result.transactionNumber} processed successfully`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[POS Integration Error]', error);

    // Handle specific error types
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction number already exists',
        },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Generic error with specific message
    const message = error.message || 'Failed to process POS transaction';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS Handler (for CORS pre-flight)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
