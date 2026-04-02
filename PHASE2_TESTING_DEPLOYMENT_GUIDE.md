# Phase 2 Testing & Deployment Guide

**Status:** Implementation Complete | Ready for Testing  
**Date:** January 16, 2026

---

## 🧪 Testing Plan

### Unit Tests

**Test: Payment Status Calculation**

```typescript
// File: services/purchase-order.service.ts

test("calculatePaymentStatus - PENDING when paid = 0", () => {
  const status = calculatePaymentStatus(1000, 0);
  expect(status).toBe("PENDING");
});

test("calculatePaymentStatus - PARTIALLY_PAID when paid < total", () => {
  const status = calculatePaymentStatus(1000, 500);
  expect(status).toBe("PARTIALLY_PAID");
});

test("calculatePaymentStatus - FULLY_PAID when paid = total", () => {
  const status = calculatePaymentStatus(1000, 1000);
  expect(status).toBe("FULLY_PAID");
});

test("calculatePaymentStatus - OVERPAID when paid > total", () => {
  const status = calculatePaymentStatus(1000, 1100);
  expect(status).toBe("OVERPAID");
});
```

**Test: Balance Calculation**

```typescript
test("calculateBalance - returns max(0, total - paid)", () => {
  expect(calculateBalance(1000, 500)).toBe(500);
  expect(calculateBalance(1000, 1000)).toBe(0);
  expect(calculateBalance(1000, 1100)).toBe(0); // Can't be negative
});
```

### Integration Tests

**Test: Link Payment to PO**

```
Setup:
  - Create PO with $1000 total
  - Create Payment with $600

Test:
  - POST /api/purchase-orders/{poId}/payments
  - Body: { paymentId: "..." }

Expected:
  - Payment.referenceOrderId updated
  - PO.paidAmount = 600
  - PO.balanceAmount = 400
  - PO.paymentStatus = PARTIALLY_PAID
  - GL entry created (Bank → Accounts Payable)
  - Response status 200
  - Data includes updated PO
```

**Test: Link Multiple Payments**

```
Setup:
  - Create PO with $1000 total
  - Create Payment 1: $400
  - Create Payment 2: $600

Test:
  1. Link Payment 1
     - Verify status: PARTIALLY_PAID
     - Verify paid: $400

  2. Link Payment 2
     - Verify status: FULLY_PAID
     - Verify paid: $1000
     - Verify balance: $0
```

**Test: Overpaid Scenario**

```
Setup:
  - Create PO with $1000 total
  - Create Payment: $1100

Test:
  - Link payment

Expected:
  - Status: OVERPAID
  - Paid: $1100
  - Balance: $0 (capped at 0)
```

**Test: Unlink Payment**

```
Setup:
  - PO with $1000 total
  - Link Payment $600 (status: PARTIALLY_PAID)

Test:
  - DELETE /api/purchase-orders/{poId}/payments
  - Body: { paymentId: "..." }

Expected:
  - Payment.referenceOrderId = null
  - PO.paidAmount = 0
  - PO.paymentStatus = PENDING
  - GL entry reversed
  - Supplier balance recalculated
```

**Test: Supplier Balance Update**

```
Setup:
  - Create Supplier
  - Create 2 CONFIRMED POs: $500 each (total $1000)
  - Create 1 DRAFT PO: $300 (should NOT count)

Test:
  - Link payment of $400 to first PO

Expected:
  - Supplier.outstandingBalance = $600
  - (1000 confirmed total - 400 paid)
```

### API Endpoint Tests

**Test: GET /api/purchase-orders/{id}/payments**

```
Auth: Required
  - Without token: 401 Unauthorized
  - With valid token: 200 OK

Response:
  - Body: { success: true, data: [payments...] }
  - Status: 200

Edge Cases:
  - PO with no payments: returns []
  - Invalid PO ID: returns 404
```

**Test: POST /api/purchase-orders/{id}/payments**

```
Auth & Authorization:
  - No token: 401 Unauthorized
  - No ADMIN/INVENTORY_MANAGER role: 403 Forbidden
  - Valid admin: 200 OK

Validation:
  - Missing paymentId: 400 Bad Request
  - Invalid UUID: 400 Bad Request
  - Invalid JSON: 400 Bad Request

Data Validation:
  - PO not found: 404 Not Found
  - Payment not found: 404 Not Found
  - Payment already linked: 400 Bad Request

Success:
  - Status: 200
  - Returns updated PO
  - Includes new amounts
```

**Test: DELETE /api/purchase-orders/{id}/payments**

```
Auth & Authorization:
  - Same as POST

Validation:
  - Same as POST

Success:
  - Status: 200
  - Returns updated PO with corrected amounts
```

### UI Component Tests

**Test: PaymentStatusBadge**

```
Test All Statuses:
  - PENDING: gray background
  - PARTIALLY_PAID: blue background
  - FULLY_PAID: green background
  - OVERPAID: purple background

Test Label Display:
  - PENDING → "Pending"
  - PARTIALLY_PAID → "Partially Paid"
  - FULLY_PAID → "Fully Paid"
  - OVERPAID → "Overpaid"
```

**Test: PaymentHistory**

```
Empty State:
  - Shows "No payments linked yet"

With Payments:
  - Displays all payments in table
  - Shows: ID, Method, Amount, Date, Status
  - Each row has delete button

Delete Button:
  - Shows confirmation dialog
  - Calls API correctly
  - Shows toast notification
  - Removes from table
  - Calls onPaymentRemoved callback
```

**Test: PaymentForm**

```
Dialog:
  - Opens on "Link Payment" click
  - Shows remaining balance
  - Closes after successful link

Payment Loading:
  - Shows loading state while fetching
  - Displays available payments
  - Shows "No payments" if empty

Form Submission:
  - Validates selection
  - Calls API correctly
  - Shows toast on success
  - Shows toast on error
  - Disables submit while loading
```

**Test: PurchaseOrderDetailsClient**

```
Initial State:
  - Shows payment summary cards
  - Displays correct amounts
  - Shows payment history
  - Shows link payment button

After Linking Payment:
  - Updates paid amount
  - Updates balance amount
  - Adds payment to history
  - Shows success notification

After Unlinking Payment:
  - Updates paid amount
  - Updates balance amount
  - Removes payment from history
  - Shows success notification
```

**Test: PO Detail Page**

```
Page Load:
  - Displays PO header with ID & date
  - Shows status badges (PO status + payment status)
  - Displays order items
  - Shows supplier details

Summary Section:
  - Displays total amount
  - Displays paid amount (green)
  - Displays balance amount (orange)
  - Shows payment status badge

Payment Tracking:
  - Shows payment summary cards
  - Shows payment history
  - Shows "Link Payment" button
```

---

## 🚀 Manual Testing Checklist

### Happy Path Test

```
1. Create a new Purchase Order
   - [ ] Select supplier
   - [ ] Add items
   - [ ] Submit

2. View PO Detail Page
   - [ ] Payment status shows PENDING
   - [ ] Balance equals total amount
   - [ ] "No payments linked yet" message

3. Create Payments (via Payment page)
   - [ ] Create Payment 1: $500
   - [ ] Create Payment 2: $300
   - [ ] Verify both in COMPLETED status

4. Link First Payment
   - [ ] Click "Link Payment" button
   - [ ] Modal opens with payment options
   - [ ] Select Payment 1 ($500)
   - [ ] Click "Link Payment"
   - [ ] Success toast appears
   - [ ] Page shows:
     * Paid: $500
     * Balance: $500
     * Status: PARTIALLY_PAID
   - [ ] Payment appears in history

5. Link Second Payment
   - [ ] Click "Link Payment" button
   - [ ] Select Payment 2 ($300)
   - [ ] Click "Link Payment"
   - [ ] Page shows:
     * Paid: $800
     * Balance: $200
     * Status: PARTIALLY_PAID

6. Verify Supplier Balance
   - [ ] Go to Supplier detail page
   - [ ] Outstanding balance shows $200
   - [ ] (Only if this is the only CONFIRMED PO)
```

### Error Cases Test

```
1. Link Payment - Validation Errors
   - [ ] Try to link without selecting payment
     * Shows validation error in form

2. Link Payment - Data Not Found
   - [ ] Try to link deleted payment
     * API returns 404
     * Toast shows error

3. Link Payment - Already Linked
   - [ ] Try to link same payment twice
     * API returns 400
     * Toast shows "already linked" error

4. Authorization
   - [ ] Log in as non-inventory user
   - [ ] Try to link payment
     * API returns 403
     * Toast shows "Forbidden"
```

### Performance Test

```
1. Load PO with 50+ Linked Payments
   - [ ] Page loads without lag
   - [ ] Table scrolls smoothly
   - [ ] Delete/unlink operations responsive

2. Link Payment with Large Dataset
   - [ ] 1000+ unlinked payments available
   - [ ] Dropdown loads payment options
   - [ ] Selection responsive
```

---

## ✅ Pre-Deployment Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual happy path testing complete
- [ ] Error cases tested
- [ ] Responsive design verified (mobile/tablet/desktop)
- [ ] Accessibility checked (keyboard navigation, screen readers)
- [ ] Performance tested
- [ ] Code review completed
- [ ] Type safety verified (no `any` types)
- [ ] Error handling covers all scenarios
- [ ] Toast notifications working
- [ ] GL entries created correctly
- [ ] Supplier balance updates correctly
- [ ] Database transactions working
- [ ] Auth & permissions enforced

---

## 🔧 Build & Deploy

```bash
# Build the application
npm run build

# Run tests (when available)
npm run test

# Lint check
npm run lint

# Start dev server for final testing
npm run dev
```

### Staging Deployment

```bash
# Push to staging branch
git push origin main --force-with-lease

# Deploy to staging environment
# (Use your deployment process)

# Verify on staging
# - Test all manual flows
# - Check API responses
# - Verify database changes
# - Monitor logs for errors
```

### Production Deployment

```bash
# After staging validation, deploy to production
# - Create release tag
# - Deploy to production
# - Monitor for errors
# - Verify with production data
```

---

## 📊 Rollback Plan

If issues occur in production:

1. **Immediate Rollback:**

   - Revert code to previous stable version
   - Redeploy

2. **Data Recovery:**

   - GL entries tracked all changes
   - Supplier balance can be recalculated
   - Payments can be relinked

3. **Communication:**
   - Notify team of rollback
   - Document issues found
   - Plan fixes

---

## 📝 Post-Deployment Verification

**Day 1 After Deployment:**

- [ ] Monitor error logs
- [ ] Check API response times
- [ ] Verify GL entries are created
- [ ] Confirm supplier balances updated
- [ ] Test with real production payment data

**Week 1 After Deployment:**

- [ ] Review usage metrics
- [ ] Check for any reported issues
- [ ] Verify data integrity
- [ ] Confirm GL reconciliation

---

## 🎯 Success Criteria

Payment Tracking is **successful** when:

✅ Payment linking works end-to-end  
✅ Payment status updates correctly  
✅ Supplier balance auto-updates  
✅ GL entries created for all transactions  
✅ All error cases handled gracefully  
✅ UI responsive and intuitive  
✅ Zero data inconsistencies  
✅ Performance meets standards  
✅ Auth & permissions enforced  
✅ Users can manage payments easily

---

**Ready for QA Testing and Deployment** ✅
