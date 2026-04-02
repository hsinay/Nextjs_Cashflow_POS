# Purchase Order Implementation Roadmap - Technical Analysis

**Date:** January 16, 2026  
**Status:** Phase 1 COMPLETED ✅ | Ready for Phase 2

---

## Executive Summary

Your phased approach for Purchase Order enhancement is **well-structured and follows best practices** for ERP system development. The progression from basic order status management → payment tracking → accounting integration → inventory management is logically sound and minimizes dependencies.

**Recommendation:** ✅ **PROCEED WITH PHASE 2** - All prerequisites are in place.

---

## Current State Analysis

### ✅ Phase 1: Status Dropdown in PO Form (COMPLETED)

**What's Done:**
- [x] `PurchaseOrderStatus` enum with 5 statuses: `DRAFT`, `CONFIRMED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`
- [x] Status field in Prisma schema (`prisma/schema.prisma` line ~515)
- [x] Status dropdown in `PurchaseOrderForm` component (lines 157-176)
- [x] Status is saved/updated via API endpoints
- [x] `PurchaseOrderStatusBadge` component for UI display

**Supporting Infrastructure:**
- ✅ Validation schema: `lib/validations/purchase-order.schema.ts`
- ✅ Service layer: `services/purchase-order.service.ts` with full CRUD
- ✅ API endpoints: `app/api/purchase-orders/` with auth & validation
- ✅ Inventory transactions created on order changes
- ✅ GL (General Ledger) entries logged for all PO operations

---

## Phase 2 Analysis: Payment Status & Supplier Balance

### 🔲 Tasks Breakdown

#### Task 1: Add Payment Status Field to Purchase Order

**Approach:**
```prisma
model PurchaseOrder {
  id              String
  supplierId      String
  orderDate       DateTime
  status          PurchaseOrderStatus  // DRAFT, CONFIRMED, etc.
  paymentStatus   POPaymentStatus      // NEW ENUM
  totalAmount     Decimal
  paidAmount      Decimal              // NEW - track cumulative payments
  balanceAmount   Decimal              // Already exists - adjust calculation
}

enum POPaymentStatus {
  PENDING          // No payment received yet
  PARTIALLY_PAID   // Some payment received
  FULLY_PAID       // All payment received
  OVERPAID         // Payment exceeds PO amount
}
```

**Why This Works:**
- Follows pattern used in `SalesOrder` (has `SalesOrderStatus` + payment tracking)
- `Payment` model already has `referenceOrderId` for linking
- Complements existing `Supplier.outstandingBalance` field

**Effort:** 2-3 hours
- [ ] Add `paymentStatus` & `paidAmount` fields to schema
- [ ] Create migration: `prisma migrate dev --name add_po_payment_status`
- [ ] Update form to display payment status
- [ ] Update table/detail pages to show payment info

---

#### Task 2: Link Payments to Purchase Orders

**Current Payment Model Status:**
```typescript
model Payment {
  id               String
  payerId          String
  payerType        PayerType        // CUSTOMER | SUPPLIER
  supplierId       String?          // Already supports supplier payments ✅
  referenceOrderId String?          // Can link to PO ✅
  amount           Decimal
  paymentDate      DateTime
  status           String           // PENDING, COMPLETED, FAILED
  // ... 20+ fields for payment methods, cards, UPI, cheques, etc.
}
```

**Implementation:**
1. **Create Payment Service Function** (in `services/payment.service.ts`):
```typescript
async function linkPaymentToPurchaseOrder(paymentId: string, purchaseOrderId: string) {
  // 1. Update Payment.referenceOrderId = purchaseOrderId
  // 2. Update PurchaseOrder.paidAmount += payment.amount
  // 3. Update PurchaseOrder.paymentStatus based on totals
  // 4. Update Supplier.outstandingBalance
  // 5. Create GL entry (debit Cash/Bank, credit AP)
}

async function getPurchaseOrderPayments(purchaseOrderId: string) {
  // Return all linked payments with details
}
```

2. **Create Payment Selection UI** in Purchase Order detail page:
   - Show "Add Payment" button in PO detail view
   - Modal/drawer to record payment against PO
   - Display payment history with method, date, amount

3. **Update Payment Form** (if needed):
   - Add PO selection when creating payment for supplier
   - Auto-fill supplier from selected PO

**Effort:** 4-5 hours
- [ ] Add helper function to calculate `paymentStatus` based on payments
- [ ] Create payment linking service function
- [ ] Create payment recording UI component
- [ ] Test with multiple payments → one PO

---

#### Task 3: Update Supplier Outstanding Balance

**Current Schema Support:**
```prisma
model Supplier {
  outstandingBalance Decimal  // Already exists ✅
}
```

**Logic to Implement:**
```typescript
// When payment is made against PO:
supplier.outstandingBalance = 
  supplier.outstandingBalance - paymentAmount;

// When PO status changes to CONFIRMED:
supplier.outstandingBalance = 
  supplier.outstandingBalance + po.totalAmount;

// When PO is CANCELLED:
supplier.outstandingBalance = 
  supplier.outstandingBalance - po.totalAmount;
```

**Implementation Location:**
- Modify `services/payment.service.ts` - `linkPaymentToPurchaseOrder()`
- Modify `services/purchase-order.service.ts` - `updatePurchaseOrder()` when status changes

**Safety Measures:**
```typescript
// In updatePurchaseOrder service:
if (statusChanged from 'DRAFT' to 'CONFIRMED') {
  await supplier.update({
    outstandingBalance: supplier.outstandingBalance + po.totalAmount
  });
  // Log GL entry: Debit AP, Credit ... 
}
```

**Effort:** 3-4 hours
- [ ] Add helper function `calculateSupplierBalance(supplierId)`
- [ ] Hook into PO status update logic
- [ ] Hook into payment linking logic
- [ ] Create AP (Accounts Payable) GL account if not exists
- [ ] Add validations to prevent negative balances

---

## Phase 3 Preview: Accounting GL Entries

### Why Phase 2 Must Complete First:

Phase 3 depends on:
- ✅ Payment Status (know what's paid/unpaid)
- ✅ Payment Linking (know which GL accounts to affect)
- ✅ Supplier Balance (audit trail via GL)

### Expected GL Entries Flow:

```
Phase 2 Completion:
PO Created (CONFIRMED) → 
  Debit: Inventory/Purchases (DR)
  Credit: Accounts Payable (CR)

Payment Made → 
  Debit: Accounts Payable (DR)
  Credit: Cash/Bank/Credit Card (CR)

PO Cancelled → 
  Debit: Accounts Payable (DR)
  Credit: Inventory/Purchases (CR) [Reversal]
```

**Current State:** 
- ✅ `LedgerEntry` model exists
- ✅ `services/ledger.service.ts` has `createLedgerEntry()`
- ✅ PO creation already logs GL entries (line 156-163 in purchase-order.service.ts)
- ⏳ Payment-related GL entries need to be added in Phase 3

---

## Phase 4 Preview: Inventory & Cost Price

### Dependencies Met:
- ✅ Inventory transaction system in place (`InventoryTransaction` model)
- ✅ Product cost tracking (`Product.costPrice`)
- ✅ PO item tracking with `unitPrice`

### Phase 4 Tasks:
```
1. When PO status → RECEIVED:
   - Update inventory: product.stockQuantity += poItem.quantity
   - Create inventory transaction record
   
2. Update Product Cost Price:
   - If new cost < old cost OR no cost set:
     product.costPrice = weighted_average_cost(poItem.unitPrice)
   
3. Update Related Sales Prices:
   - Trigger profit margin recalculation
   - Notify if margin falls below threshold
```

---

## Recommended Implementation Sequence (Phase 2)

### Week 1: Foundation
**Day 1-2: Database Changes**
- [ ] Update Prisma schema (add `paymentStatus`, `paidAmount` to PO)
- [ ] Create & run migration
- [ ] Regenerate Prisma client

**Day 3-4: Service Layer**
- [ ] Create `linkPaymentToPurchaseOrder()` in payment service
- [ ] Create `calculatePOPaymentStatus()` helper
- [ ] Add GL entry creation on payment
- [ ] Add tests for payment linking

**Day 5: Update PO Service**
- [ ] Hook status changes to supplier balance updates
- [ ] Recalculate balances in transaction context
- [ ] Add validation for balance consistency

### Week 2: UI & Integration
**Day 1-2: Update Existing Components**
- [ ] Update `PurchaseOrderForm` to show payment status (readonly)
- [ ] Update `PurchaseOrderTable` to show payment status & balance
- [ ] Update detail page to show payment history

**Day 3-4: New Components**
- [ ] Create `PaymentFormModal` component for recording payment
- [ ] Create `PaymentHistoryTable` component
- [ ] Create `SupplierBalanceCard` component

**Day 5: API Endpoints**
- [ ] Update `POST /api/purchase-orders/{id}/payments` endpoint
- [ ] Create `GET /api/purchase-orders/{id}/payments` endpoint
- [ ] Create `GET /api/suppliers/{id}/outstanding-balance` endpoint

### Week 3: Testing & Validation
- [ ] End-to-end payment flow testing
- [ ] Balance calculation validation
- [ ] GL entry audit trail verification
- [ ] Edge cases: overpayment, partial payment reversal

---

## Architecture Consistency Check

### ✅ Follows Existing Patterns

| Aspect | Pattern | Your PO Phase 2 |
|--------|---------|-----------------|
| **Validation** | Zod schemas | Will use existing schema + payment schema |
| **Service Layer** | Business logic here | Payment linking → service function |
| **API Routes** | `/api/resource/` structure | `/api/purchase-orders/{id}/payments` |
| **Auth** | Session-based via NextAuth | Will check supplier access rights |
| **DB Transactions** | Use `prisma.$transaction()` | Supplier balance updates in transaction |
| **GL Entries** | Automatic + audit trail | Payment → GL entry creation |
| **Error Handling** | Try-catch + descriptive messages | Balance validation & payment validation |

### ✅ No Breaking Changes
- Existing PO fields preserved
- New fields optional (backward compatible)
- Payment model already supports references

### ⚠️ Considerations
1. **Data Consistency:** Use transactions when updating PO balance + supplier balance
2. **GL Account Setup:** Ensure AP (Accounts Payable) account exists in chart of accounts
3. **Multi-currency:** Payment model has `currency` field → handle if needed
4. **Partial Payments:** PO can have multiple payments → sum them correctly

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Supplier balance goes negative | Low | High | Add validation check in service layer |
| Payment linked to wrong PO | Low | High | Require PO selection in payment form |
| GL entries not created | Medium | High | Use `prisma.$transaction()` to ensure atomicity |
| Double-counting payments | Medium | High | Ensure `payment.referenceOrderId` is unique constraint |
| Data migration issues | Low | Medium | Test migration on staging DB first |

---

## Success Criteria

✅ **Phase 2 Complete When:**
1. PO has `paymentStatus` field that updates correctly
2. Payment can be linked to PO via UI
3. Supplier `outstandingBalance` updated on payment
4. GL entries created for all payment operations
5. Payment history visible in PO detail page
6. Multiple payments per PO supported
7. All validations in place (no overpayment without approval, etc.)

---

## Files to Modify/Create

### Modifications:
- `prisma/schema.prisma` - Add fields + enum
- `services/purchase-order.service.ts` - Balance calculation
- `services/payment.service.ts` - Payment linking logic
- `lib/validations/payment.schema.ts` - Payment validation update
- `components/purchase-orders/purchase-order-form.tsx` - Display payment status
- `components/purchase-orders/purchase-order-table.tsx` - Show payment info

### New Files:
- `components/purchase-orders/payment-history-table.tsx`
- `components/purchase-orders/payment-form-modal.tsx`
- `app/api/purchase-orders/[id]/payments/route.ts`
- `types/payment.types.ts` - Update with PO-specific types

---

## Next Steps

1. **Review** this roadmap for alignment ✅
2. **Approve** Phase 2 approach
3. **Create branch:** `feature/po-payment-status`
4. **Start with:** Database schema changes (Day 1-2)
5. **Parallel:** Begin service layer functions
6. **Target:** Phase 2 complete by end of week 3

---

## Questions to Confirm

1. **Payment Approval Required?** Should payments require manager approval before posting?
2. **Partial Refunds?** If payment linked to wrong PO, can it be reversed/re-linked?
3. **Credit Terms?** Should PO track due date + terms (e.g., Net 30)?
4. **Multi-currency?** Do suppliers operate in different currencies?
5. **PO Discounts?** Should early payment discounts be tracked?

---

## Approval

- **Proposed by:** AI Assistant
- **Date:** January 16, 2026
- **Status:** ⏳ **Awaiting Review & Approval**

**Proceed with Phase 2?** [YES / NO / MODIFY]

