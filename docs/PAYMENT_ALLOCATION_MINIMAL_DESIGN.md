# Payment Allocation Minimal Design

**Status:** Proposed  
**Scope:** Generic `Payment` model only  
**Goal:** Safely support update/delete/reversal of auto-applied payments without UI changes first

---

## Problem

The current generic `Payment` model supports only one `referenceOrderId`.

That works for:
- one payment linked to one sales order
- one payment linked to one purchase order

It breaks down for:
- one customer payment auto-applied across multiple sales orders
- one supplier payment auto-applied across multiple purchase orders
- safe editing of payment amount after allocation
- safe deletion/reversal with exact order-level traceability

Today, those cases are ambiguous because the payment record does not store the exact allocation breakdown.

---

## Minimal Fix

Introduce a dedicated allocation table for generic payments.

### New Model

```prisma
model OrderPaymentAllocation {
  id              String   @id @default(uuid())
  paymentId       String
  orderType       OrderAllocationType
  salesOrderId    String?
  purchaseOrderId String?
  allocatedAmount Decimal  @db.Decimal(12, 2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  payment         Payment        @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  salesOrder      SalesOrder?    @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
  purchaseOrder   PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)

  @@index([paymentId])
  @@index([salesOrderId])
  @@index([purchaseOrderId])
  @@map("order_payment_allocations")
}

enum OrderAllocationType {
  SALES_ORDER
  PURCHASE_ORDER
}
```

---

## Relation Changes

### Payment

Add:

```prisma
allocations OrderPaymentAllocation[]
```

### SalesOrder

Add:

```prisma
paymentAllocations OrderPaymentAllocation[]
```

### PurchaseOrder

Add:

```prisma
paymentAllocations OrderPaymentAllocation[]
```

---

## Recommended Rules

### Data Rules

- Exactly one of `salesOrderId` or `purchaseOrderId` must be set.
- `orderType = SALES_ORDER` requires `salesOrderId`.
- `orderType = PURCHASE_ORDER` requires `purchaseOrderId`.
- Sum of all allocations for a payment must be `<= payment.amount`.
- For linked one-order payments, keep `referenceOrderId` for backward compatibility initially.
- Long term, `referenceOrderId` should become a convenience field or be deprecated.

### Business Rules

- Customer payments can allocate only to sales orders.
- Supplier payments can allocate only to purchase orders.
- Allocations must not exceed the order balance at time of apply.
- Payment update/delete must reverse old allocations first, then reapply.

---

## Service Changes

### 1. `services/payment.service.ts`

Replace the current implicit auto-apply logic with explicit allocation writes.

#### Create Payment

- If `referenceOrderId` is provided:
  - create payment
  - create one allocation row
  - sync order financial state from allocations

- If no `referenceOrderId` is provided:
  - create payment
  - auto-apply to oldest unpaid orders
  - create one allocation row per affected order
  - sync each order

#### Update Payment

- load existing allocations
- reverse allocations
- update payment record
- rebuild allocations using new amount/reference
- resync affected orders

#### Delete Payment

- load allocations
- reverse allocations
- delete payment

### 2. `services/order-payment.service.ts`

Two options:

- Option A: keep `OrderPayment` temporarily for customer-order UI history
- Option B: replace `OrderPayment` reads with `OrderPaymentAllocation + Payment`

**Recommended minimal path:** keep `OrderPayment` for now, but make it a projection generated from allocations for customer-side history.

### 3. `services/purchase-order.service.ts`

- stop reading only `Payment.referenceOrderId`
- compute paid totals from `OrderPaymentAllocation`
- use allocation totals for payment history and supplier balance updates

### 4. `services/customer.service.ts`

- outstanding balance should remain derived from sales orders
- no direct dependency on payment table totals

---

## Migration Strategy

### Phase A: Additive

- add new table and relations
- keep `referenceOrderId`
- keep `OrderPayment`
- write new allocations for all new payments

### Phase B: Dual Read/Write

- payment create/update/delete uses allocations
- old screens still work
- order totals derive from allocations

### Phase C: Backfill

- backfill existing payments with one allocation each where `referenceOrderId` exists
- optionally backfill `OrderPayment` from allocations where needed

### Phase D: Cleanup

- deprecate ambiguous logic based only on `referenceOrderId`
- optionally retire `OrderPayment` or convert it into a read model

---

## Minimal API Impact

No UI changes are required to begin.

Current API payloads can stay the same:

```ts
{
  payerId,
  payerType,
  amount,
  paymentMethod,
  referenceOrderId?
}
```

Internally:
- one `referenceOrderId` becomes one allocation
- no `referenceOrderId` triggers auto-allocation rows

Later enhancement:

```ts
allocations?: Array<{
  orderType: 'SALES_ORDER' | 'PURCHASE_ORDER';
  orderId: string;
  allocatedAmount: number;
}>
```

That would allow user-controlled split allocation in admin/payment UIs.

---

## Why This Is Minimal

This design:
- fits the existing payment model
- matches the credit allocation pattern already in the repo
- avoids immediate UI refactors
- makes update/delete mathematically safe
- gives exact auditability for every allocated amount

---

## Recommended Next Implementation Order

1. Add `OrderPaymentAllocation` schema and relations.
2. Update `createPayment()` to write allocations.
3. Update payment sync helpers to compute from allocations.
4. Update `updatePayment()` and `deletePayment()` to reverse/reapply allocations.
5. Backfill old `referenceOrderId` payments into allocation rows.
6. Refactor sales-order and purchase-order payment history readers.

---

## Risks

- Keeping both `OrderPayment` and `OrderPaymentAllocation` temporarily means dual-write complexity.
- Backfill must be done carefully for historical data.
- Purchase-order payment history currently assumes direct `referenceOrderId`; that will need a controlled transition.

---

## Recommendation

Proceed with additive schema introduction first.

That gives a safe path to:
- preserve current UI behavior
- unlock correct payment edits/deletes
- remove ambiguity from auto-applied payments

