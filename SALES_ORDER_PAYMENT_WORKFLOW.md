# Sales Order Payment Workflow

## Overview

The correct workflow for recording payments on sales orders follows this process:

1. **Navigate to Sales Order** → Edit page
2. **Click "Record Payment" button** (green button in top right)
3. **Fill in payment details:**
   - Payment Amount (pre-filled with balance due)
   - Payment Method (Cash, Bank Transfer, Card, etc.)
   - Payment Date
   - Optional notes
4. **Click "Record Payment"**
5. **System automatically updates:**
   - Order status → PAID or PARTIALLY_PAID
   - Balance amount → Decremented
   - Customer outstanding balance → Updated

## Important Notes

### What Happens When Payment is Recorded

When you create a payment:

- The system finds the sales order by referenceOrderId
- Decrements the order's `balanceAmount`
- If balance reaches 0 → Status becomes "PAID"
- If balance > 0 → Status becomes "PARTIALLY_PAID"
- Customer's outstanding balance is automatically decremented

### Why Not Just Change Status to PAID?

Changing status manually (without payment):

- ❌ Doesn't create a payment record
- ❌ Doesn't update customer's outstanding balance
- ❌ Breaks accounting records
- ❌ Creates discrepancies in financial reporting

### Correct Workflow

- ✅ Create payment → System updates status automatically
- ✅ Payment record exists in the system
- ✅ All financial records are accurate
- ✅ Accounting ledger entries are created

## Files Added/Modified

### New Components

- `components/sales-orders/quick-payment-modal.tsx` - Payment form modal
- `components/sales-orders/quick-payment-button.tsx` - Button to open modal

### Updated Files

- `app/dashboard/sales-orders/[id]/edit/page.tsx` - Added "Record Payment" button

## Example Flow

**Scenario:** Sales Order of $1000

1. Initial status: DRAFT
2. Order confirmed → Status: CONFIRMED
3. Customer pays $400:
   - Click "Record Payment" on edit page
   - Enter Amount: $400
   - Select Payment Method: BANK_TRANSFER
   - Click "Record Payment"
   - Status automatically changes to: PARTIALLY_PAID
   - Balance due: $600
4. Customer pays remaining $600:
   - Click "Record Payment" again
   - Enter Amount: $600
   - Click "Record Payment"
   - Status automatically changes to: PAID
   - Balance due: $0
