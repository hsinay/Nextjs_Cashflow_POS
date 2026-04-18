# Payment-POS Integration Architecture

**Based on:** updated_master_contract.md v1.3.0  
**Status:** Architecture Design  
**Last Updated:** December 16, 2025

---

## 1. Executive Summary

This document defines the clean architecture for integrating the **Payment Module** with the **POS System** in the ERP system. The integration enables seamless payment handling across multiple payment methods while maintaining financial accuracy through double-entry bookkeeping.

**Key Principles:**

- ✅ Single Responsibility: Each module handles its domain
- ✅ Clear Separation: Payment records ≠ POS Payment Details
- ✅ Type Safety: Concrete vs. Transaction-level payment methods
- ✅ Atomic Operations: All-or-nothing transaction semantics
- ✅ Audit Trail: Complete ledger entries for all movements

---

## 2. Core Concepts

### 2.1 Payment Method Stratification

The system uses two payment method enums to maintain type safety:

#### **CONCRETE_PAYMENT_METHODS** (Individual Payments)

Used for actual payment records in both Payment model and POSPaymentDetail:

```
CASH, BANK_TRANSFER, CARD, UPI, CHEQUE, DIGITAL_WALLET, CREDIT, DEBIT, MOBILE_WALLET
```

- Stored in database for concrete, trackable payments
- Used in Payment service filtering
- Each represents a distinct payment vehicle

#### **TRANSACTION_PAYMENT_METHODS** (Transaction Level)

Used for Transaction.paymentMethod to detect split payments:

```
CONCRETE_PAYMENT_METHODS + MIXED
```

- MIXED: Indicates transaction used multiple payment methods
- Assigned by system when transaction has 2+ POSPaymentDetails
- Never stored as individual payment in POSPaymentDetail
- Used for reporting and transaction classification

### 2.2 Data Model Relationships

```
Customer/Supplier
    ↓
    ├─→ SalesOrder/PurchaseOrder (Traditional)
    │       ├─→ SalesOrderItem/PurchaseOrderItem
    │       └─→ Payment (after invoice)
    │
    └─→ Transaction (POS)
            ├─→ TransactionItem
            ├─→ POSPaymentDetail (multiple per transaction)
            ├─→ Receipt
            └─→ Inventory decrease via InventoryTransaction

Payment Flow:
    Payment (Generic) → LedgerEntry
    Transaction + POSPaymentDetail → LedgerEntry (via POS reconciliation)
```

### 2.3 Key Entities

#### **Payment** (Traditional/Generic)

- Domain: Credit/Debit tracking for customers and suppliers
- Scope: Payments against SalesOrder/PurchaseOrder (on-account)
- Payment Methods: CONCRETE only (no MIXED)
- Ledger: Direct entry via `createLedgerEntry()`
- Example: Customer pays invoice after delivery

#### **Transaction** (POS)

- Domain: Point-of-sale point-of-time sales
- Scope: Immediate sales with instant payment
- Payment Methods: CONCRETE or MIXED (if multiple methods used)
- Ledger: Entry via POS reconciliation process
- Example: Customer buys item and pays immediately at counter

#### **POSPaymentDetail** (Payment Split)

- Domain: Breakdown of how Transaction was paid
- One Transaction can have multiple POSPaymentDetails
- Each POSPaymentDetail is CONCRETE (no MIXED)
- Example: Customer pays $70 CASH + $30 CARD = $100 total

#### **POSSession** (Cashier Context)

- Domain: Daily cashier reconciliation
- Links: User (Cashier) → Multiple Transactions
- Tracks: Cash variance, payment method totals
- Example: Cashier opens with $500, closes with $650, difference tracked

---

## 3. Integration Architecture

### 3.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│ API Layer (Route Handlers)                              │
│ /api/payments/*  /api/pos/transactions/*                │
└────────────────┬─────────────────────────────┬──────────┘
                 │                             │
┌────────────────▼──────────────────────────────▼──────────┐
│ Validation Layer (Zod Schemas)                           │
│ paymentFilterSchema, createPaymentSchema                 │
│ integratedPOSTransactionSchema, paymentDetailSchema     │
└────────────────┬──────────────────────────────┬──────────┘
                 │                             │
┌────────────────▼──────────────────────────────▼──────────┐
│ Service Layer (Business Logic)                           │
│ PaymentService, POSIntegrationService                   │
│ LedgerService, POSSessionService                        │
└────────────────┬──────────────────────────────┬──────────┘
                 │                             │
┌────────────────▼──────────────────────────────▼──────────┐
│ Database Layer (Prisma ORM)                              │
│ Payment, Transaction, POSPaymentDetail, LedgerEntry     │
│ POSSession, InventoryTransaction                        │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Type System Design

**File Structure:**

```
types/
  ├─ payment.types.ts       (CONCRETE_PAYMENT_METHODS, Payment types)
  ├─ pos.types.ts           (TRANSACTION_PAYMENT_METHODS, Transaction types)
  └─ payment.types.ts includes:
      ├─ CONCRETE_PAYMENT_METHODS
      ├─ ConcretePaymentMethod
      ├─ PAYMENT_METHODS (CONCRETE + MIXED)
      ├─ PaymentMethod (transaction-level)
      ├─ PaymentFilters (uses ConcretePaymentMethod)
      └─ Payment interface (uses ConcretePaymentMethod)
```

**Type Safety Rules:**

1. **Payment Records** → Always ConcretePaymentMethod
2. **Payment Filters** → Always ConcretePaymentMethod
3. **Transaction.paymentMethod** → TransactionPaymentMethod (can be MIXED)
4. **POSPaymentDetail.paymentMethod** → ConcretePaymentMethod (never MIXED)
5. **API Validation** → Only accept ConcretePaymentMethod in request bodies

---

## 4. API Design

### 4.1 Payment Management APIs

#### **GET /api/payments**

```json
Query Parameters:
{
  "search": "ref-123",           // searchable fields
  "payerType": "CUSTOMER",       // CUSTOMER | SUPPLIER
  "payerId": "uuid",             // customer/supplier UUID
  "paymentMethod": "CARD",       // ConcretePaymentMethod only
  "startDate": "2025-01-01",     // ISO date
  "endDate": "2025-01-31",       // ISO date
  "page": 1,
  "limit": 20
}

Response:
{
  "payments": [Payment],
  "pagination": { page, limit, total, pages }
}
```

#### **POST /api/payments**

```json
Request Body:
{
  "payerId": "uuid",                    // required
  "payerType": "CUSTOMER" | "SUPPLIER", // required
  "amount": 5000,                       // required
  "paymentMethod": "CARD",              // ConcretePaymentMethod only
  "paymentDate": "2025-01-15",         // optional
  "referenceOrderId": "uuid",           // optional
  "referenceNumber": "PAY-001",         // optional
  "notes": "payment for invoice #123"  // optional
}

Response:
{
  "success": true,
  "data": Payment
}
```

### 4.2 POS Transaction APIs

#### **GET /api/pos/transactions**

```json
Query:
{
  "sessionId": "uuid",        // optional - filter by POS session
  "customerId": "uuid",       // optional
  "status": "COMPLETED",      // optional - PENDING | COMPLETED | CANCELLED | REFUNDED
  "paymentMethod": "CASH",    // optional - ConcretePaymentMethod only
  "startDate": "2025-01-01",  // optional
  "page": 1,
  "limit": 20
}

Response:
{
  "transactions": [
    {
      "id": "uuid",
      "transactionNumber": "TXN-20250116-001",
      "customerId": "uuid" | null,
      "totalAmount": 5000,
      "paymentMethod": "MIXED" | "CASH" | "CARD" | ...,
      "status": "COMPLETED",
      "items": [TransactionItem],
      "paymentDetails": [POSPaymentDetail],
      "createdAt": "2025-01-16T10:00:00Z"
    }
  ],
  "pagination": { page, limit, total, pages }
}
```

#### **POST /api/pos/transactions-integrated**

```json
Request Body:
{
  "customerId": "uuid" | null,        // optional - POS can be cash sales
  "cashierId": "uuid",                // required
  "sessionId": "uuid",                // optional
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 500,
      "discountApplied": 0,
      "taxRate": 18
    }
  ],
  "discountAmount": 0,                // optional
  "loyaltyPointsRedeemed": 0,         // optional
  "paymentDetails": [
    {
      "paymentMethod": "CARD",        // ConcretePaymentMethod only
      "amount": 1000,
      "referenceNumber": "AUTH-123",
      "cardLast4": "4242",            // optional - for CARD
      "cardBrand": "VISA",            // optional - for CARD
      "upiId": "user@bank",           // optional - for UPI
      "chequeNumber": "CHQ-001",      // optional - for CHEQUE
      "chequeBank": "HDFC",           // optional - for CHEQUE
      "walletProvider": "GPAY",       // optional - for DIGITAL_WALLET
      "notes": "payment note"         // optional
    }
  ],
  "notes": "transaction notes"        // optional
}

Response:
{
  "success": true,
  "data": {
    "transaction": Transaction,
    "receipt": Receipt,
    "inventoryUpdates": [...],
    "ledgerEntries": [...],
    "summary": {
      "totalItems": 2,
      "subtotal": 1000,
      "tax": 180,
      "discount": 0,
      "totalAmount": 1180,
      "paymentsMade": [
        { "method": "CARD", "amount": 1180 }
      ]
    }
  }
}
```

### 4.3 POS Session APIs

#### **GET /api/pos/sessions**

```json
Query:
{
  "cashierId": "uuid",   // optional
  "status": "OPEN",      // optional - OPEN | CLOSED | SUSPENDED
  "page": 1,
  "limit": 20
}

Response:
{
  "sessions": [POSSession],
  "pagination": { page, limit, total, pages }
}
```

#### **POST /api/pos/sessions**

```json
Request Body:
{
  "cashierId": "uuid",
  "terminalId": "TERMINAL-001",  // optional
  "openingCashAmount": 5000
}

Response:
{
  "success": true,
  "data": POSSession
}
```

#### **PUT /api/pos/sessions/{id}/close**

```json
Request Body:
{
  "closingCashAmount": 6500,
  "notes": "cash drawer reconciliation"
}

Response:
{
  "success": true,
  "data": {
    "session": POSSession,
    "reconciliation": {
      "expectedCash": 6000,  // opening + cash txns
      "actualCash": 6500,
      "variance": 500,
      "varianceReason": "cash rounding",
      "paymentMethodTotals": {
        "CASH": 1500,
        "CARD": 2000,
        "UPI": 500
      }
    }
  }
}
```

---

## 5. Service Layer Implementation

### 5.1 Payment Service

**File:** `services/payment.service.ts`

**Responsibilities:**

- CRUD operations for Payment records
- Payment filtering and search
- Ledger entry creation
- Outstanding balance updates

**Key Methods:**

```typescript
export async function createPayment(
  input: CreatePaymentInput
): Promise<Payment>;
export async function getAllPayments(
  filters: PaymentFilters
): Promise<PaginatedPayments>;
export async function getPaymentById(id: string): Promise<Payment | null>;
export async function updatePayment(
  id: string,
  input: UpdatePaymentInput
): Promise<Payment>;
export async function deletePayment(id: string): Promise<boolean>;
export async function createRefund(
  input: CreateRefundInput
): Promise<PaymentRefund>;
```

**Type Consistency:**

- All input/output uses `ConcretePaymentMethod`
- Filters strictly accept `ConcretePaymentMethod`
- No MIXED in payment records

### 5.2 POS Integration Service

**File:** `services/pos-integration.service.ts`

**Responsibilities:**

- Process integrated POS transactions
- Handle multi-method payment splitting
- Inventory deduction
- Ledger entry creation
- Transaction validation

**Key Methods:**

```typescript
export async function processIntegratedPOSTransaction(
  input: POSIntegrationInput
): Promise<POSIntegrationResult>;

export async function validatePOSIntegrationInput(
  input: unknown
): Promise<POSIntegrationInput>;

export async function detectTransactionPaymentMethod(
  paymentDetails: POSPaymentDetail[]
): Promise<TransactionPaymentMethod>;

export async function createPOSTransaction(
  input: POSIntegrationInput
): Promise<Transaction>;

export async function reconcilePOSSession(
  sessionId: string
): Promise<POSSessionReconciliation>;
```

**Transaction Processing Flow:**

```
1. Validate input schema (Zod)
2. Check inventory availability
3. Calculate totals and taxes
4. Create Transaction (status: PENDING)
5. Create TransactionItems
6. Create POSPaymentDetails (each ConcretePaymentMethod)
7. Detect final paymentMethod (CONCRETE or MIXED)
8. Update inventory (InventoryTransaction)
9. Create ledger entries
10. Generate receipt
11. Update Transaction status to COMPLETED
12. Return complete result
```

### 5.3 POS Session Service

**File:** `services/pos-session.service.ts`

**Responsibilities:**

- Session lifecycle management
- Cash tracking and variance detection
- Payment method totals calculation
- Reconciliation logic

**Key Methods:**

```typescript
export async function openSession(input: OpenSessionInput): Promise<POSSession>;

export async function closeSession(
  sessionId: string,
  closingAmount: Decimal,
  notes?: string
): Promise<POSSessionReconciliation>;

export async function calculateSessionTotals(
  sessionId: string
): Promise<SessionTotals>;

export async function detectCashVariance(
  sessionId: string
): Promise<CashVarianceReport>;
```

### 5.4 Ledger Service

**File:** `services/ledger.service.ts`

**Responsibilities:**

- Double-entry bookkeeping
- Account code mapping
- Transaction logging
- Financial audit trail

**Key Methods:**

```typescript
export async function createLedgerEntry(
  entry: CreateLedgerEntryInput
): Promise<LedgerEntry>;

export async function createPaymentLedgerEntries(
  payment: Payment,
  metadata?: Record<string, any>
): Promise<LedgerEntry[]>;

export async function createTransactionLedgerEntries(
  transaction: Transaction,
  paymentDetails: POSPaymentDetail[]
): Promise<LedgerEntry[]>;
```

---

## 6. Validation Schema Design

### 6.1 Payment Validation

**File:** `lib/validations/payment.schema.ts`

```typescript
export const paymentFilterSchema = z.object({
  search: z.string().optional(),
  payerType: z.enum(PAYER_TYPES).optional(),
  payerId: z.string().uuid().optional(),
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS).optional(), // ConcretePaymentMethod ONLY
  status: z.enum(PAYMENT_STATUSES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const createPaymentSchema = z.object({
  payerId: z.string().uuid(),
  payerType: z.enum(PAYER_TYPES),
  amount: z.number().positive(),
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS), // ConcretePaymentMethod ONLY
  paymentDate: z.coerce.date().optional(),
  referenceOrderId: z.string().uuid().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});
```

### 6.2 POS Transaction Validation

**File:** `lib/validations/pos.schema.ts`

```typescript
export const transactionItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discountApplied: z.number().nonnegative().optional(),
  taxRate: z.number().optional(),
});

export const paymentDetailSchema = z.object({
  paymentMethod: z.enum(CONCRETE_PAYMENT_METHODS), // ConcretePaymentMethod ONLY
  amount: z.number().positive(),
  referenceNumber: z.string().optional(),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.enum(["VISA", "MASTERCARD", "AMEX", "OTHER"]).optional(),
  upiId: z.string().email().optional(),
  chequeNumber: z.string().optional(),
  chequeBank: z.string().optional(),
  walletProvider: z.string().optional(),
  notes: z.string().optional(),
});

export const integratedPOSTransactionSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  cashierId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  items: z.array(transactionItemSchema).nonempty(),
  discountAmount: z.number().nonnegative().optional(),
  loyaltyPointsRedeemed: z.number().nonnegative().optional(),
  paymentDetails: z.array(paymentDetailSchema).nonempty(),
  notes: z.string().optional(),
});
```

---

## 7. Data Flow Diagrams

### 7.1 Traditional Payment Flow

```
Customer pays invoice
     ↓
POST /api/payments
     ↓
validatePaymentInput (Zod - ConcretePaymentMethod)
     ↓
PaymentService.createPayment()
     ├─→ Create Payment record (ConcretePaymentMethod)
     ├─→ Update outstanding balance
     └─→ createLedgerEntry() [double-entry bookkeeping]
     ↓
Response with Payment + Ledger metadata
```

### 7.2 POS Transaction Flow (Single Method)

```
Customer buys item with CARD
     ↓
POST /api/pos/transactions-integrated
     ↓
validatePOSInput (Zod - items + paymentDetails)
     ↓
POSIntegrationService.processIntegratedPOSTransaction()
     ├─→ Calculate totals and taxes
     ├─→ Check inventory
     ├─→ Create Transaction (status: PENDING)
     ├─→ Create TransactionItem
     ├─→ Create POSPaymentDetail (CARD, ConcretePaymentMethod)
     ├─→ Detect paymentMethod: detectTransactionPaymentMethod()
     │   └─→ Single payment detail → paymentMethod = "CARD"
     ├─→ Update inventory (InventoryTransaction)
     ├─→ createLedgerEntry() [sale + payment]
     ├─→ Generate Receipt
     ├─→ Update Transaction status: COMPLETED
     └─→ Return complete result
     ↓
Response with Transaction + Receipt + Ledger metadata
```

### 7.3 POS Transaction Flow (Split Payment - MIXED)

```
Customer buys $100 item, pays $70 CASH + $30 UPI
     ↓
POST /api/pos/transactions-integrated
  paymentDetails: [
    { paymentMethod: "CASH", amount: 70 },
    { paymentMethod: "UPI", amount: 30 }
  ]
     ↓
validatePOSInput (Zod - validates each detail as ConcretePaymentMethod)
     ↓
POSIntegrationService.processIntegratedPOSTransaction()
     ├─→ Calculate totals: $100
     ├─→ Create Transaction (status: PENDING, paymentMethod: TBD)
     ├─→ Create TransactionItem
     ├─→ Create POSPaymentDetail #1 (CASH, $70)
     ├─→ Create POSPaymentDetail #2 (UPI, $30)
     ├─→ Detect paymentMethod: detectTransactionPaymentMethod()
     │   ├─→ Count payment details: 2
     │   └─→ Multiple methods → paymentMethod = "MIXED"
     ├─→ Update Transaction with paymentMethod = "MIXED"
     ├─→ Update inventory
     ├─→ createLedgerEntry() [split by payment method]
     │   ├─→ Entry for CASH portion
     │   └─→ Entry for UPI portion
     ├─→ Generate Receipt (shows payment split)
     ├─→ Update Transaction status: COMPLETED
     └─→ Return complete result
     ↓
Response with Transaction (paymentMethod: MIXED) + Receipt + Ledger entries
```

### 7.4 POS Session Close Flow

```
Cashier closes session
     ↓
PUT /api/pos/sessions/{id}/close
  { closingCashAmount: 6500 }
     ↓
POSSessionService.closeSession()
     ├─→ Calculate expected cash
     │   ├─→ Opening amount
     │   ├─→ + All CASH payment details for session
     │   └─→ = Expected closing
     ├─→ Calculate variance
     │   └─→ Actual closing - Expected closing
     ├─→ Calculate payment method totals
     │   ├─→ Sum all POSPaymentDetail amounts by method
     │   ├─→ CASH: $1500, CARD: $2000, UPI: $500
     │   └─→ Total: $4000
     ├─→ Detect large variance (> threshold)
     │   └─→ Flag for manager review if needed
     ├─→ Update POSSession status: CLOSED
     ├─→ Create reconciliation record
     └─→ Return session + reconciliation details
     ↓
Response with Session + Variance + Payment totals
```

---

## 8. Type System Implementation

### 8.1 Payment Types

**File:** `types/payment.types.ts`

```typescript
// ============================================================================
// Payment Method Enums
// ============================================================================

// Concrete payment methods - actual payment vehicles
export const CONCRETE_PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "UPI",
  "CHEQUE",
  "DIGITAL_WALLET",
  "CREDIT",
  "DEBIT",
  "MOBILE_WALLET",
] as const;

export type ConcretePaymentMethod = (typeof CONCRETE_PAYMENT_METHODS)[number];

// Transaction-level payment methods (includes MIXED for multi-method transactions)
export const PAYMENT_METHODS = [...CONCRETE_PAYMENT_METHODS, "MIXED"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ============================================================================
// Core Interfaces
// ============================================================================

export interface Payment {
  id: string;
  payerType: PayerType;
  payerId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: ConcretePaymentMethod; // Always concrete
  referenceOrderId?: string;
  paymentInsights?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentFilters {
  search?: string;
  payerType?: PayerType;
  payerId?: string;
  paymentMethod?: ConcretePaymentMethod; // Always concrete
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreatePaymentInput {
  payerId: string;
  payerType: PayerType;
  amount: number;
  paymentMethod: ConcretePaymentMethod; // Always concrete
  paymentDate?: Date;
  referenceOrderId?: string;
  referenceNumber?: string;
  notes?: string;
}
```

### 8.2 POS Types

**File:** `types/pos.types.ts`

```typescript
// ============================================================================
// Transaction Payment Methods (includes MIXED)
// ============================================================================

export const TRANSACTION_PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "UPI",
  "BANK_TRANSFER",
  "DIGITAL_WALLET",
  "CHEQUE",
  "CREDIT",
  "DEBIT",
  "MOBILE_WALLET",
  "MIXED", // Multiple payment methods in one transaction
] as const;

export type TransactionPaymentMethod =
  (typeof TRANSACTION_PAYMENT_METHODS)[number];

// ============================================================================
// Core Interfaces
// ============================================================================

export interface Transaction {
  id: string;
  transactionNumber: string;
  customerId?: string;
  cashierId: string;
  sessionId?: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod: TransactionPaymentMethod; // Can be MIXED
  status: TransactionStatus;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountApplied: number;
  taxRate?: number;
  taxAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface POSPaymentDetail {
  id: string;
  transactionId: string;
  paymentMethod: ConcretePaymentMethod; // Never MIXED
  amount: number;
  referenceNumber?: string;
  status: PaymentDetailStatus;
  notes?: string;
  // Payment-method specific fields
  cardLast4?: string;
  cardBrand?: string;
  authorizationId?: string;
  walletProvider?: string;
  walletTransactionId?: string;
  upiId?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  chequeBank?: string;
  transactionFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface POSIntegrationInput {
  customerId?: string;
  cashierId: string;
  sessionId?: string;
  items: TransactionItem[];
  discountAmount?: number;
  loyaltyPointsRedeemed?: number;
  paymentDetails: POSPaymentDetail[]; // Each detail uses ConcretePaymentMethod
  notes?: string;
}

export interface POSIntegrationResult {
  transaction: Transaction;
  receipt: Receipt;
  inventoryUpdates: InventoryTransaction[];
  ledgerEntries: LedgerEntry[];
  summary: {
    totalItems: number;
    subtotal: number;
    tax: number;
    discount: number;
    totalAmount: number;
    paymentsMade: { method: ConcretePaymentMethod; amount: number }[];
  };
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Current)

- ✅ Type system finalized (CONCRETE vs MIXED separation)
- ✅ Payment service implemented
- ✅ Validation schemas defined
- ✅ API routes structured
- **Current Status:** Refining type consistency

### Phase 2: POS Integration

- 🔲 Implement POSIntegrationService
- 🔲 Implement payment splitting logic
- 🔲 Implement MIXED detection
- 🔲 Add inventory deduction
- 🔲 Add ledger entry creation

### Phase 3: Session Management

- 🔲 Implement POSSessionService
- 🔲 Implement session reconciliation
- 🔲 Implement cash variance detection
- 🔲 Add payment method totals calculation

### Phase 4: Reporting & Analytics

- 🔲 Payment analytics
- 🔲 POS transaction reports
- 🔲 Cash flow analysis
- 🔲 Payment method breakdowns

### Phase 5: Testing & Documentation

- 🔲 Unit tests for services
- 🔲 Integration tests for flows
- 🔲 API documentation
- 🔲 User guides

---

## 10. Error Handling Strategy

### 10.1 Validation Errors

- **Zod Schema Validation:** Returns 400 Bad Request with field details
- **Type Mismatch:** Returns 400 with "Invalid payment method" message
- **Missing Required Fields:** Returns 400 with field list

### 10.2 Business Logic Errors

- **Insufficient Inventory:** Returns 409 Conflict with available quantity
- **Cash Variance Too Large:** Returns 422 Unprocessable Entity with recommendation
- **Session Already Closed:** Returns 422 Unprocessable Entity
- **Payment Amount Mismatch:** Returns 422 with breakdown

### 10.3 System Errors

- **Database Errors:** Returns 500 Internal Server Error
- **Ledger Entry Failures:** Returns 500 with rollback info
- **Unexpected Conditions:** Returns 500 with incident ID for support

### 10.4 Error Response Format

```json
{
  "success": false,
  "error": "Payment amount mismatch",
  "code": "PAYMENT_MISMATCH",
  "details": {
    "expected": 1000,
    "received": 900,
    "difference": 100
  },
  "timestamp": "2025-01-16T10:00:00Z"
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

- Payment service CRUD operations
- POS payment splitting logic
- MIXED detection algorithm
- Variance calculation
- Ledger entry creation

### 11.2 Integration Tests

- End-to-end payment flow
- POS transaction with split payments
- Session reconciliation
- Ledger consistency verification
- Inventory deduction verification

### 11.3 Edge Cases

- Zero-amount transactions
- Large variance scenarios
- Multiple payment methods
- Decimal precision issues
- Concurrent session operations

---

## 12. Performance Considerations

### 12.1 Database Optimization

- Indexes on: `paymentDate`, `paymentMethod`, `payerId`, `transactionNumber`
- Batch operations for inventory updates
- Pagination for large result sets

### 12.2 Caching Strategy

- Session totals cached during operation
- Payment method enums cached in application
- Variance calculations computed on-demand

### 12.3 Scalability

- Stateless service design
- Database connection pooling
- Horizontal scaling ready
- Asynchronous ledger entry creation

---

## 13. Security Considerations

### 13.1 Authorization

- Payment creation: ACCOUNTANT, ADMIN
- POS transactions: CASHIER, SALES_MANAGER
- Session management: CASHIER, ADMIN
- View payments: Any authenticated user

### 13.2 Data Protection

- All monetary values as Decimal (no floating point)
- Sensitive fields (card numbers, account details) encrypted at rest
- Audit trail for all financial operations
- Read-only access to historical records

### 13.3 Concurrency

- Optimistic locking on session updates
- Transaction-level atomicity
- No race conditions on inventory
- Ledger entries immutable

---

## 14. Migration Guide

### 14.1 From Incomplete Types to Clean Types

**Before (Problematic):**

```typescript
paymentMethod: PaymentMethod | undefined; // mixed CONCRETE + MIXED
```

**After (Clean):**

```typescript
// Payment operations
paymentMethod: ConcretePaymentMethod  // Never MIXED

// Transaction level
paymentMethod: TransactionPaymentMethod  // Can be MIXED

// Filters
paymentMethod?: ConcretePaymentMethod  // Never MIXED
```

### 14.2 Existing Data Handling

1. All existing Payment records already use ConcretePaymentMethod ✓
2. Transaction records: Scan for MIXED and ensure multiple POSPaymentDetails ✓
3. No data migration needed - type system only affects new operations ✓

---

## 15. Summary Table

| Aspect                        | Details                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| **Payment Records**           | Uses CONCRETE_PAYMENT_METHODS only                                         |
| **Transaction.paymentMethod** | Uses TRANSACTION_PAYMENT_METHODS (includes MIXED)                          |
| **POSPaymentDetail**          | Uses CONCRETE_PAYMENT_METHODS only                                         |
| **Split Payments**            | Multiple POSPaymentDetails with paymentMethod = MIXED at Transaction level |
| **API Validation**            | Accepts CONCRETE_PAYMENT_METHODS only in request bodies                    |
| **Filters**                   | Use CONCRETE_PAYMENT_METHODS for consistency                               |
| **Ledger**                    | Double-entry bookkeeping for all transactions                              |
| **Session**                   | Tracks payment method totals and cash variance                             |
| **Error Handling**            | Clear validation errors + business logic errors                            |
| **Type Safety**               | Enforced at compile time via TypeScript                                    |

---

## 16. References

- **Contract:** updated_master_contract.md v1.3.0
- **Database:** prisma/schema.prisma
- **Services:** services/payment.service.ts, services/pos-integration.service.ts
- **Types:** types/payment.types.ts, types/pos.types.ts
- **Validation:** lib/validations/payment.schema.ts, lib/validations/pos.schema.ts

---

**Document Version:** 1.0  
**Last Updated:** December 16, 2025  
**Status:** ✅ Ready for Implementation  
**Next Review:** After Phase 1 completion
