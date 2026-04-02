# Purchase Order Implementation - Visual Flow & Dependencies

**Status:** Phase 1 ✅ Complete | Phase 2 Ready to Start

---

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PURCHASE ORDER SYSTEM                     │
│                        (Phase 1 ✅)                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   Supplier Model     │         │   PurchaseOrder      │
├──────────────────────┤         ├──────────────────────┤
│ id                   │◄────────│ supplierId (FK)      │
│ name                 │         │ orderDate            │
│ email                │         │ status ✅            │ ← Phase 1
│ outstanding          │         │ totalAmount          │
│ Balance ✅           │         │ balanceAmount        │
│                      │         │ createdAt            │
└──────────────────────┘         └──────────────────────┘
        ▲                                    │
        │                                    │ 1:N
        │                                    ▼
        │                         ┌──────────────────────┐
        │                         │  PurchaseOrderItem   │
        │                         ├──────────────────────┤
        │                         │ purchaseOrderId (FK) │
        │                         │ productId (FK)       │
        │                         │ quantity             │
        │                         │ unitPrice            │
        │                         │ subtotal             │
        │                         └──────────────────────┘
        │
        │ (NEW - Phase 2)
        │
        │         ┌──────────────────────┐
        └────────►│  Payment Model       │
                  ├──────────────────────┤
                  │ id                   │
                  │ payerType            │
                  │ supplierId (FK) ✅   │ ← Can link to Supplier
                  │ referenceOrderId ✅  │ ← Can link to PO
                  │ amount               │
                  │ status               │
                  │ paymentDate          │
                  └──────────────────────┘

        ▲                    │
        │                    │ (NEW - Phase 2)
        │                    ▼
        │         ┌──────────────────────┐
        └────────►│  Ledger Entry (GL)   │
                  ├──────────────────────┤
                  │ id                   │
                  │ debitAccount         │
                  │ creditAccount        │
                  │ amount               │
                  │ referenceId ✅       │
                  │ (references PO/Pmt)  │
                  └──────────────────────┘
```

---

## Phase 1 → Phase 2 Transition

### What's Already Working (Phase 1 ✅)

```
CREATE PURCHASE ORDER (DRAFT)
        ↓
  [Status Dropdown]
        ↓
UPDATE STATUS → CONFIRMED
        ↓
Inventory Transaction: PURCHASE (Expected)
GL Entry: Debit Inventory, Credit AP
        ↓
PO Display: Status Badge + Table Column
```

### What Phase 2 Adds

```
CONFIRMED PO (with payment tracking)
        ↓
  [Payment Status Field] ← NEW
  ┌─────────────────────────────────────────┐
  │ paymentStatus: PENDING                   │
  │ paidAmount: 0                            │
  │ balanceAmount: totalAmount               │
  └─────────────────────────────────────────┘
        ↓
RECORD PAYMENT (via form/modal)
        ↓
  Link Payment → PO (referenceOrderId)
        ↓
Update Calculations:
  • PO.paidAmount += paymentAmount
  • PO.paymentStatus = calculateStatus()
  • Supplier.outstandingBalance -= paymentAmount
        ↓
Create GL Entry:
  Debit: AP (Accounts Payable)
  Credit: Cash/Bank
        ↓
Display:
  • Payment History in PO Detail
  • Supplier Balance in Supplier View
  • GL Audit Trail in Accounting
```

---

## Data Flow Diagram: Phase 2 Payment Processing

```
┌────────────────────────────────────────────────────────────────┐
│                    USER INITIATES PAYMENT                       │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Payment Form Modal       │
                ├──────────────────────────┤
                │ • Select PO              │
                │ • Amount                 │
                │ • Payment Method         │
                │ • Date                   │
                │ • Notes                  │
                └──────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  API: POST /api/purchase-orders/{id}/  │
        │           payments                     │
        │                                        │
        │  VALIDATION:                           │
        │  ✓ Amount ≤ PO.balanceAmount          │
        │  ✓ Supplier exists & active           │
        │  ✓ User has permission                │
        └────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │ SERVICE: linkPaymentToPurchaseOrder()  │
        │                                        │
        │ IN TRANSACTION:                        │
        │ 1. Create/Verify Payment record       │
        │ 2. Update: PO.paidAmount              │
        │ 3. Update: PO.paymentStatus           │
        │ 4. Update: Supplier.outstandingBalance│
        │ 5. Create: GL Entry                   │
        │ 6. Create: Audit Log                  │
        └────────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
         ┌───────▼────────┐      ┌──────▼────────┐
         │ SUCCESS        │      │ FAILURE       │
         ├────────────────┤      ├───────────────┤
         │ ✓ Payment OK   │      │ ✗ Rollback    │
         │ ✓ Balance OK   │      │ ✗ No changes  │
         │ ✓ GL Entry OK  │      │ ✗ Error msg   │
         │ ✓ Notif sent   │      │   to user     │
         └───────┬────────┘      └───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ RETURN:                    │
    │ Updated PO with:           │
    │ • paidAmount               │
    │ • paymentStatus            │
    │ • balanceAmount            │
    │ • paymentHistory[]         │
    └────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │ DISPLAY IN UI:                         │
    │ • Payment History Table                │
    │ • Updated PO Status & Balance          │
    │ • Supplier Outstanding Balance Updated │
    │ • GL Entries in Accounting Module      │
    └────────────────────────────────────────┘
```

---

## Payment Status State Machine

```
┌─────────────┐
│   PENDING   │  (No payments yet)
└──────┬──────┘
       │ After first payment received
       ▼
┌─────────────────────┐
│  PARTIALLY_PAID    │  (Some but not all)
└──────┬──────────────┘
       │ When remaining balance = 0
       ▼
┌─────────────┐
│  FULLY_PAID │  (All amount paid)
└─────────────┘

SPECIAL CASE:
       │ If payment > balance
       ▼
┌─────────────┐
│  OVERPAID   │  (Requires handling:
└─────────────┘   credit, refund, or adjustment)
```

---

## Outstanding Balance Calculation Logic

```
Supplier Outstanding Balance = 
    Sum(All CONFIRMED POs amount) 
    - Sum(All Payments received)

Example:
─────────────────────────────────────────────────
PO #1 (CONFIRMED):  $1000  → AP increases
PO #2 (CONFIRMED):  $500   → AP increases
────────────────────────────────────────────────
Outstanding:        $1500
────────────────────────────────────────────────
Payment -$600       → Balance: $900
Payment -$400       → Balance: $500
Payment -$500       → Balance: $0
────────────────────────────────────────────────

Status Flow:
PO#1: PENDING → PARTIALLY_PAID (after first payment)
      PARTIALLY_PAID → FULLY_PAID (when PO#1 paid in full)
      
Supplier: Outstanding $900 → $500 → $0
```

---

## GL Account Mapping

### Accounts Affected in Phase 2

```
Chart of Accounts Structure:

1000 - ASSETS
  1100 - Cash & Bank Accounts
    1110 - Cash Register
    1120 - Bank Account A
    1130 - Credit Card (if used)
    
1200 - Inventory
  1210 - Finished Goods
  1220 - Raw Materials
  
1500 - LIABILITIES
  1510 - Accounts Payable (AP)        ← Primary account
  1520 - Accrued Expenses
  
2000 - EXPENSES
  2100 - Cost of Goods Sold (COGS)
  2200 - Purchases                    ← Alternative to Inventory
  
When Payment Made:
─────────────────────────────────────
Debit:  1510 AP                $500
Credit: 1120 Bank Account A            $500

Description: Payment for PO #xxxxx

When PO Created (Confirmation):
─────────────────────────────────────
Debit:  1200 Inventory          $1000
Credit: 1510 AP                        $1000

Description: PO #xxxxx from Supplier XYZ
```

---

## Files Modified/Created in Phase 2

```
┌─────────────────────────────────────────────────────────┐
│                SCHEMA & MIGRATION                        │
├─────────────────────────────────────────────────────────┤
│ prisma/schema.prisma
│   ├─ Add: enum POPaymentStatus
│   ├─ Add: paymentStatus to PurchaseOrder
│   ├─ Add: paidAmount to PurchaseOrder
│   └─ Note: balanceAmount calculation logic
│
│ prisma/migrations/[timestamp]_add_po_payment_status/
│   └─ migration.sql (auto-generated)
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                SERVICE LAYER                             │
├─────────────────────────────────────────────────────────┤
│ services/payment.service.ts (MODIFY)
│   ├─ + linkPaymentToPurchaseOrder(paymentId, poId)
│   ├─ + calculatePOPaymentStatus(purchaseOrderId)
│   ├─ + updateSupplierBalance(supplierId, amount)
│   └─ + getPurchaseOrderPayments(poId)
│
│ services/purchase-order.service.ts (MODIFY)
│   ├─ updatePurchaseOrder() ← add balance calc
│   └─ Use $transaction for consistency
│
│ services/ledger.service.ts (NO CHANGE)
│   └─ createLedgerEntry() ← already exists
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                API ENDPOINTS                             │
├─────────────────────────────────────────────────────────┤
│ app/api/purchase-orders/[id]/payments/
│   ├─ route.ts (NEW)
│   │   ├─ POST - Create payment for PO
│   │   └─ GET - List payments for PO
│   │
│   └─ [paymentId]/
│       └─ route.ts (NEW)
│           ├─ GET - Get payment details
│           ├─ PUT - Modify payment
│           └─ DELETE - Reverse payment
│
│ app/api/suppliers/[id]/outstanding-balance/ (NEW)
│   └─ route.ts
│       └─ GET - Get current outstanding balance
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                COMPONENTS (UI)                           │
├─────────────────────────────────────────────────────────┤
│ components/purchase-orders/
│   ├─ purchase-order-form.tsx (MODIFY)
│   │   └─ Display payment status (readonly)
│   │
│   ├─ purchase-order-table.tsx (MODIFY)
│   │   ├─ Add column: Payment Status
│   │   └─ Add column: Outstanding Balance
│   │
│   ├─ payment-history-table.tsx (NEW)
│   │   ├─ Display all payments for PO
│   │   ├─ Columns: Date, Method, Amount, Status
│   │   └─ Actions: View, Edit, Reverse
│   │
│   └─ payment-form-modal.tsx (NEW)
│       ├─ Form fields: Amount, Method, Date, Notes
│       ├─ Validation: Amount ≤ Balance
│       └─ Success: Close + Refresh PO
│
│ components/suppliers/
│   └─ supplier-balance-card.tsx (NEW)
│       ├─ Show: Outstanding Balance
│       ├─ Show: Recent payments
│       └─ Link: View pending POs
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                TYPES & VALIDATION                        │
├─────────────────────────────────────────────────────────┤
│ types/purchase-order.types.ts (MODIFY)
│   ├─ + paymentStatus
│   ├─ + paidAmount
│   └─ + payments[] relation
│
│ lib/validations/payment.schema.ts (MODIFY)
│   ├─ Update schema for PO payments
│   ├─ Validate: amount ≤ po.balanceAmount
│   └─ Validate: valid payment method
│
│ types/payment.types.ts (MODIFY)
│   └─ + purchaseOrderId field (optional)
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                PAGE COMPONENTS                           │
├─────────────────────────────────────────────────────────┤
│ app/dashboard/purchase-orders/[id]/
│   └─ page.tsx (MODIFY)
│       ├─ Display: Payment Status Badge
│       ├─ Display: Paid Amount vs Balance
│       ├─ Display: Payment History Table
│       └─ Add Button: "Record Payment"
│
│ app/dashboard/suppliers/[id]/
│   └─ page.tsx (MODIFY)
│       ├─ Add: Supplier Balance Card
│       ├─ Add: Outstanding POs Table
│       └─ Add: Recent Payments List
└─────────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests (Service Layer)

```typescript
describe('Payment Service - Phase 2', () => {
  test('linkPaymentToPurchaseOrder - basic')
  test('linkPaymentToPurchaseOrder - partial payment')
  test('linkPaymentToPurchaseOrder - full payment')
  test('linkPaymentToPurchaseOrder - overpayment')
  test('linkPaymentToPurchaseOrder - multiple payments')
  
  test('calculatePOPaymentStatus - PENDING')
  test('calculatePOPaymentStatus - PARTIALLY_PAID')
  test('calculatePOPaymentStatus - FULLY_PAID')
  
  test('updateSupplierBalance - increases on PO')
  test('updateSupplierBalance - decreases on payment')
  test('updateSupplierBalance - reversal on cancel')
})
```

### Integration Tests

```typescript
describe('PO Payment Flow - E2E', () => {
  test('Complete payment flow: Create PO → Payment → GL')
  test('Multiple payments: Sum correctly')
  test('Payment reversal: Balances recalculate')
  test('GL audit trail: All entries logged')
  test('Supplier balance: Accurate across POs')
})
```

### Manual Testing Checklist

```
□ Create PO (DRAFT) → paymentStatus = PENDING
□ Confirm PO → Check supplier balance increased
□ Record payment 50% → paymentStatus = PARTIALLY_PAID
□ Record payment 50% → paymentStatus = FULLY_PAID
□ Check GL entries for both payments
□ Check supplier balance = 0
□ Record overpayment → Error or OVERPAID status
□ Reverse one payment → balances recalculate
□ Cancel PO → supplier balance adjusted back
□ Multi-PO supplier → total outstanding correct
```

---

## Performance Considerations

```
QUERY OPTIMIZATION:
─────────────────────────────────────────────
❌ N+1 Problem: 
   For each PO, fetch all payments separately

✅ Solution:
   Include payments in PO query:
   prisma.purchaseOrder.findMany({
     include: { payments: true }
   })

─────────────────────────────────────────────
DATABASE INDEXES:
─────────────────────────────────────────────
REQUIRED:
  • Payment.referenceOrderId (for PO lookups)
  • Payment.supplierId (for supplier payments)
  • PurchaseOrder.supplierId (existing)
  • PurchaseOrder.paymentStatus (new)

OPTIONAL BUT RECOMMENDED:
  • Supplier.outstandingBalance (sorted list)
  • Payment.paymentDate (range queries)

─────────────────────────────────────────────
CACHING:
─────────────────────────────────────────────
Cache supplier balance (expires after payment)
Cache PO payment status (expires after update)
Invalidate on: payment created/modified/deleted
```

---

## Rollback Plan (If Needed)

```
WORST CASE: Phase 2 causes data issues

Step 1: Identify problem
  - Check GL entry audit log
  - Verify balance calculations
  
Step 2: Stop application
  - Prevent new payments
  
Step 3: Data correction (if safe)
  - Reverse incorrect GL entries
  - Recalculate supplier balances
  
Step 4: Database rollback
  - If schema: revert migration
  - If data: restore from backup
  
Step 5: Deployment rollback
  - Deploy previous version
  - Verify data integrity
```

---

## Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Payment linking time | < 2 seconds | API response time |
| PO payment status accuracy | 100% | Test coverage |
| GL entry creation | 100% | Audit log check |
| Supplier balance consistency | 100% | Balance = Sum(POs) - Sum(Payments) |
| No data corruption | 0 errors | Schema validation |
| User experience | Seamless | No additional clicks |

---

## Approval Checklist

- [ ] Architecture reviewed
- [ ] Data model confirmed
- [ ] Service layer approach approved
- [ ] UI/UX flow accepted
- [ ] Testing strategy understood
- [ ] Risk mitigation acceptable
- [ ] Timeline realistic
- [ ] Resources allocated
- [ ] Ready to implement Phase 2

---

**Ready to proceed?** ✅ YES / ❌ NO / 🔄 MODIFY

