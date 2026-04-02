# Order Payment Feature - Quick Reference & Testing Guide

## Quick Feature Overview

**What**: Record customer payments for orders with automatic cashflow integration  
**Where**: Dashboard → Customers → Select Customer → View All Orders  
**How**: Click "Record Payment" button on any order row  
**Auto**: Updates DayBook for cash reconciliation

---

## Testing the Feature

### Test Scenario 1: Complete Single Payment

**Steps**:

1. Create a test customer (if not exists)
2. Create a sales order for that customer (e.g., $1000)
3. Go to Customer Dashboard → Orders
4. Expand the order row
5. Click "Record Payment" button
6. Enter:
   - Amount: 1000
   - Payment Date: Today
   - Method: Cash
   - Reference: TEST123
   - Notes: Test payment
7. Click "Record Payment"

**Expected Results**:

- ✅ Payment appears in Payment History table
- ✅ Paid Amount updates to $1000 (green)
- ✅ Balance Due updates to $0 (red)
- ✅ Payment Status badge changes to **PAID** (green)
- ✅ "Record Payment" button becomes disabled
- ✅ DayBook entry created for today

**Verify Cashflow**:

1. Go to Reports → DayBook → Today
2. Look for entry: "Payment received from [Customer] for order [OrderID]"
3. Amount should be $1000

---

### Test Scenario 2: Partial Payments

**Steps**:

1. Create order: $1000
2. Record Payment 1:
   - Amount: $400
   - Method: Bank Transfer
   - Reference: BANK-001
3. Record Payment 2:
   - Amount: $300
   - Method: Card
   - Reference: CARD-001
4. Record Payment 3:
   - Amount: $300
   - Method: Cash

**Expected Results**:

- ✅ After Payment 1: Status = PARTIALLY_PAID, Paid = $400, Balance = $600
- ✅ After Payment 2: Status = PARTIALLY_PAID, Paid = $700, Balance = $300
- ✅ After Payment 3: Status = PAID, Paid = $1000, Balance = $0
- ✅ Payment History shows all 3 payments
- ✅ Three DayBook entries created (one per payment)
- ✅ Total DayBook amount = $1000

---

### Test Scenario 3: Delete Payment (Admin Only)

**Prerequisite**: User must have ADMIN role

**Steps**:

1. Create order with payment: $500
2. In Payment History, click Delete button on the payment
3. Confirm deletion
4. Observe state changes

**Expected Results**:

- ✅ Payment removed from history table
- ✅ Paid Amount reverts to $0
- ✅ Balance Due reverts to $500
- ✅ Status reverts to UNPAID
- ✅ DayBook entry for that payment is deleted
- ✅ If not admin, Delete button should be hidden

---

### Test Scenario 4: Validation Rules

**Test**: Amount validation

**Steps**:

1. Create order: $500
2. Click "Record Payment"
3. Try to enter Amount: 600
4. Observe validation

**Expected**:

- ✅ Max amount shown: "$500.00"
- ✅ Cannot submit form if amount > 500
- ✅ Error message displayed if validation fails

---

### Test Scenario 5: Multiple Orders Same Customer

**Steps**:

1. Customer A has Order 1 ($100), Order 2 ($200)
2. Record Payment for Order 1: $100 (Full)
3. Record Payment for Order 2: $50 (Partial)
4. Go to Customer Dashboard → Orders

**Expected**:

- ✅ Order 1: PAID status
- ✅ Order 2: PARTIALLY_PAID status (Balance = $150)
- ✅ Both tracked independently
- ✅ Customer Payment Stats show 1 paid, 1 partially paid

---

## API Testing (Using cURL/Postman)

### Test Payment Creation

```bash
curl -X POST http://localhost:3000/api/orders/{orderId}/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={token}" \
  -d '{
    "amount": 500,
    "paymentDate": "2026-01-15",
    "paymentMethod": "CASH",
    "referenceNumber": "CHK-001",
    "notes": "Test payment"
  }'
```

**Expected Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "salesOrderId": "order-uuid",
    "customerId": "customer-uuid",
    "amount": 500,
    "paymentDate": "2026-01-15T00:00:00Z",
    "paymentMethod": "CASH"
  }
}
```

### Test Payment Retrieval

```bash
curl http://localhost:3000/api/orders/{orderId}/payments \
  -H "Cookie: next-auth.session-token={token}"
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "amount": 500,
        "paymentDate": "2026-01-15T00:00:00Z",
        "paymentMethod": "CASH"
      }
    ],
    "summary": {
      "totalAmount": 1000,
      "paidAmount": 500,
      "balanceAmount": 500,
      "paymentStatus": "PARTIALLY_PAID"
    }
  }
}
```

### Test Payment Deletion

```bash
curl -X DELETE http://localhost:3000/api/orders/{orderId}/payments/{paymentId} \
  -H "Cookie: next-auth.session-token={admin-token}"
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Payment deleted successfully"
}
```

---

## Common Issues & Fixes

| Issue                                       | Cause                          | Fix                                  |
| ------------------------------------------- | ------------------------------ | ------------------------------------ |
| "Payment amount exceeds remaining balance"  | Trying to pay more than owed   | Enter amount ≤ max shown             |
| Payment recorded but not showing in history | API response not processed     | Click Refresh button                 |
| Can't delete payment                        | Not admin user                 | Contact administrator                |
| Order status didn't update                  | Pending UI state               | Refresh page (F5)                    |
| DayBook entry not created                   | DayBook doesn't exist for date | System auto-creates for current date |
| Form validation errors                      | Invalid input format           | Check field requirements             |

---

## Data Validation Rules

| Field        | Rule                   | Example                                                               |
| ------------ | ---------------------- | --------------------------------------------------------------------- |
| Amount       | > 0 and ≤ balance      | 500 (valid), -100 (invalid), 1500 > balance (invalid)                 |
| Payment Date | Any past/today date    | 2026-01-15 (valid)                                                    |
| Method       | From enum list         | CASH, BANK_TRANSFER, CARD, UPI, CHEQUE, DIGITAL_WALLET, MOBILE_WALLET |
| Reference    | Alphanumeric, optional | CHK-001, BANK-TRF-123, optional                                       |
| Notes        | Text, optional         | "Customer partial payment"                                            |

---

## Database Verification Queries

### Check order payment status

```sql
SELECT
  id,
  totalAmount,
  paidAmount,
  balanceAmount,
  paymentStatus
FROM sales_orders
WHERE customerId = 'customer-uuid'
ORDER BY createdAt DESC;
```

### Check all payments for an order

```sql
SELECT
  id,
  amount,
  paymentDate,
  paymentMethod,
  referenceNumber
FROM order_payments
WHERE salesOrderId = 'order-uuid'
ORDER BY paymentDate DESC;
```

### Check DayBook cash receipts

```sql
SELECT
  id,
  entryDate,
  amount,
  referenceId,
  description
FROM day_book_entries
WHERE referenceType = 'SALES_ORDER_PAYMENT'
  AND entryDate::date = CURRENT_DATE
ORDER BY entryDate DESC;
```

### Customer payment statistics

```sql
SELECT
  COUNT(DISTINCT so.id) as total_orders,
  COUNT(DISTINCT CASE WHEN so.paymentStatus = 'PAID' THEN so.id END) as paid_orders,
  COUNT(DISTINCT CASE WHEN so.paymentStatus = 'PARTIALLY_PAID' THEN so.id END) as partial_orders,
  COUNT(DISTINCT CASE WHEN so.paymentStatus = 'UNPAID' THEN so.id END) as unpaid_orders,
  COALESCE(SUM(so.totalAmount), 0) as total_order_value,
  COALESCE(SUM(so.paidAmount), 0) as total_paid,
  COALESCE(SUM(so.balanceAmount), 0) as total_outstanding
FROM sales_orders so
WHERE so.customerId = 'customer-uuid';
```

---

## Performance Benchmarks

| Operation              | Expected Time | Notes                           |
| ---------------------- | ------------- | ------------------------------- |
| Create payment         | < 500ms       | Includes DayBook entry creation |
| Get payments list      | < 200ms       | For 20 payments                 |
| Delete payment         | < 500ms       | Includes DayBook cleanup        |
| Page load (Orders)     | < 1s          | Initial load                    |
| Payment history expand | < 300ms       | Lazy load payments              |

---

## Checklist for Production Deployment

- [ ] Database migration applied (schema.prisma changes)
- [ ] All new files created in correct locations
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] No runtime errors in development
- [ ] Test scenarios 1-5 verified working
- [ ] API endpoints tested with Postman/cURL
- [ ] DayBook integration verified
- [ ] Admin delete functionality verified
- [ ] UI styling consistent with existing design
- [ ] Error messages are user-friendly
- [ ] Documentation reviewed and accurate
- [ ] Git commits made for all changes

---

## Post-Deployment Monitoring

**Daily Checks**:

- [ ] Payment creation success rate
- [ ] No orphaned DayBook entries
- [ ] Order status updates correctly
- [ ] Payment history data integrity

**Weekly Checks**:

- [ ] Total payments match DayBook entries
- [ ] No duplicate payment records
- [ ] Customer statistics are accurate
- [ ] Performance is within benchmarks

**Monthly Checks**:

- [ ] Full reconciliation: Orders paid = DayBook received
- [ ] No corrupted payment records
- [ ] Admin deletion audit trail

---

## Support Contacts

**For Feature Questions**: Check CUSTOMER_ORDERS_PAYMENT_GUIDE.md  
**For Technical Details**: Check ORDER_PAYMENT_TECHNICAL_GUIDE.md  
**For Bug Reports**: Include order ID, payment ID, timestamp, error message

---
