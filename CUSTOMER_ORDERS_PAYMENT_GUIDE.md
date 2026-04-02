# Customer Order Payment Feature - Complete Guide

## Overview

The Order Payment feature enables you to track and record payments for customer orders directly from the Customer Orders page. Payments are automatically integrated with the Cashflow/DayBook system for complete financial reconciliation.

---

## Quick Start

### Accessing Customer Orders

1. Go to **Dashboard → Customers**
2. Select a customer
3. Click **"View All Orders"** button
4. You'll see the **Customer Orders** page with a table of all orders

### Recording a Payment

1. **Expand an Order**: Click the order row or the expand icon (▶) to view order details
2. **View Order Summary**: See the total amount, paid amount, and balance due
3. **Click "Record Payment"**: The green button launches the payment dialog
4. **Fill in Payment Details**:
   - **Amount**: How much the customer is paying (max = remaining balance)
   - **Payment Date**: When the payment was received (default = today)
   - **Payment Method**: How the customer paid (Cash, Card, Bank Transfer, etc.)
   - **Reference Number**: Optional - transaction ID, check number, bank confirmation
   - **Notes**: Optional - any additional information about the payment
5. **Click "Record Payment"**: The system processes the payment

### Payment Confirmation

Once a payment is recorded:

- ✅ Payment appears in the **Payment History** table immediately
- ✅ Order's **Paid Amount** is updated
- ✅ Order's **Balance Due** is recalculated
- ✅ Order **Payment Status** updates automatically
- ✅ A cashflow entry is created in DayBook (for cash reconciliation)
- ✅ If fully paid, Payment Status changes to **PAID** (green badge)

---

## Payment Statuses

### UNPAID (Red Badge)

- No payments have been recorded yet
- Full order amount is still due

### PARTIALLY_PAID (Orange Badge)

- Customer has paid some amount but not the full order
- Balance is still outstanding

### PAID (Green Badge)

- Customer has paid the full order amount
- The "Record Payment" button becomes disabled
- Order is complete from payment perspective

---

## Detailed Step-by-Step Example

### Scenario: Customer Order for $1000, paid in two installments

**Step 1: First Payment ($600)**

- Order Total: $1000.00
- Click "Record Payment"
- Enter Amount: 600
- Payment Date: Today
- Payment Method: Bank Transfer
- Reference: "Transfer ref 12345"
- Click "Record Payment"
- ✅ Result: Paid Amount = $600, Balance Due = $400, Status = PARTIALLY_PAID

**Step 2: Second Payment ($400)**

- Order Total: $1000.00
- Paid Amount: $600.00 (shown in green)
- Balance Due: $400.00 (shown in red)
- Click "Record Payment"
- Enter Amount: 400
- Payment Date: Next day
- Payment Method: Cash
- Click "Record Payment"
- ✅ Result: Paid Amount = $1000, Balance Due = $0, Status = PAID
- ✅ "Record Payment" button is now disabled

---

## Payment Methods

The system supports multiple payment methods:

| Method             | Use Case                           |
| ------------------ | ---------------------------------- |
| **CASH**           | Direct cash payment                |
| **BANK_TRANSFER**  | Wire transfer, online banking      |
| **CARD**           | Credit/Debit card payment          |
| **UPI**            | Indian digital payment             |
| **CHEQUE**         | Check payment (store check number) |
| **DIGITAL_WALLET** | Apple Pay, Google Pay, etc.        |
| **MOBILE_WALLET**  | Paytm, PhonePe, etc.               |

---

## Payment History

The **Payment History** table shows all payments recorded for an order:

**Columns:**

- **Payment Date** - When the payment was received
- **Amount** - How much was paid (shown in green)
- **Method** - Payment method badge
- **Reference** - Transaction ID or check number
- **Notes** - Additional payment notes
- **Action** - Delete button (admin only)

### Deleting a Payment

⚠️ **Admin Only Feature**

If a payment was recorded incorrectly:

1. Click the **Delete** button (trash icon) next to the payment
2. Confirm the deletion
3. ✅ Payment is removed
4. ✅ Order amounts are recalculated
5. ✅ DayBook entry for that payment is cancelled

---

## Cashflow Integration

### Automatic DayBook Entry

When you record a payment:

- 📊 A **DayBook Entry** is automatically created
- 📌 Entry Type: **CASH_RECEIPT**
- 📅 Entry Date: The payment date you specify
- 💰 Amount: The exact payment amount
- 🔗 Reference: Links to the SalesOrder and customer
- 📋 Description: Format = "Payment received from [Customer] for order [OrderID]"

### Daily Reconciliation

In the **DayBook → Daily Closing**:

- All order payments are listed as cash receipts
- Sum of all payments = total cash received from customers
- Helps match cash count with recorded transactions
- Ensures financial accuracy

---

## Use Cases

### Case 1: One-time Full Payment

Customer pays entire order in one shot

- Amount: Total order amount
- After payment: Status automatically = PAID
- Recording time: < 1 minute

### Case 2: Installment/Partial Payments

Customer pays in multiple installments

- First payment recorded: Status = PARTIALLY_PAID
- Second payment recorded: Status remains PARTIALLY_PAID
- Final payment: Status auto-updates to PAID
- Each payment tracked separately in history

### Case 3: Advance Payment

Customer pays before full order delivery

- Record payment for advance amount
- Status = PARTIALLY_PAID
- When goods delivered, record remaining amount
- Final status = PAID

### Case 4: Different Payment Methods

Customer pays partly cash, partly by check

- First Payment: Cash $500
- Second Payment: Check $500
- Both tracked with their respective methods
- Order fully paid with mixed methods

---

## Validation Rules

### Amount Validation

❌ **Cannot pay more than** remaining balance

- If order balance = $500, max input = $500
- Form prevents entering higher amounts
- Error message shown if limit exceeded

### Payment Date

- Default = Today's date
- Can be any past or today's date
- Cannot be set to future (depends on form constraints)

### Payment Method

- Must select from predefined list
- Cannot leave blank

### Reference Number (Optional)

- Useful for bank transfers: paste bank confirmation number
- For checks: enter check number
- Max length: varies (typically 255 characters)

---

## Admin Functions

### Viewing Payment History

All users can view:

- Payment history table
- Payment details (date, amount, method, reference)
- Order payment summary
- Cash flow summary

### Deleting Payments

Only ADMIN users can:

- Delete incorrect payment records
- System prompts for confirmation before deletion
- Deletion is permanent and updates order totals

### Access Control

- View payments: All authenticated users
- Create payments: All authenticated users
- Delete payments: ADMIN role only

---

## Troubleshooting

### Issue: "Payment amount exceeds remaining balance"

**Solution**:

- Entry shows "Max amount:" with the allowed limit
- Reduce payment amount to match or fall below this limit

### Issue: Payment recorded but order status didn't update

**Solution**:

- Click "Refresh" button to reload data
- If still shows old status, refresh page (F5)
- Check that payment amount was correct

### Issue: Can't delete a payment

**Solution**:

- Only ADMIN users can delete payments
- Check your user role (Dashboard → Settings → Profile)
- Contact administrator if you need delete permission

### Issue: Payment shows in table but not reflected in order totals

**Solution**:

- Click "Refresh" button on the expanded order details
- Page may need reload if using multiple tabs
- Check browser network tab for API errors

---

## Best Practices

✅ **DO:**

- Record payment date accurately (matches when customer actually paid)
- Use reference numbers for traceability (bank ref, check number)
- Use proper payment method (helps with bank reconciliation)
- Add notes if payment is part of agreed installment plan
- Review payment history before recording new payment

❌ **DON'T:**

- Record payments without validating customer payment first
- Use wrong payment method (helps tracking later)
- Leave reference blank for bank transfers (needed for bank match)
- Record same payment twice (duplicate entries confuse cashflow)

---

## Keyboard Shortcuts

| Shortcut    | Action                     |
| ----------- | -------------------------- |
| `Tab`       | Move to next field         |
| `Shift+Tab` | Move to previous field     |
| `Enter`     | Submit form (on any field) |
| `Esc`       | Close dialog               |

---

## Related Features

- **DayBook**: View all daily cash receipts from order payments
- **Customer Credit System**: Track customer credit limits and outstanding balance
- **Sales Orders**: Create and manage customer orders
- **Reports**: Generate payment reports by customer, date range, or method

---

## FAQ

**Q: Can I edit a recorded payment?**  
A: No direct edit. Delete the incorrect payment and record a new one with correct details.

**Q: What if customer partially pays then cancels?**  
A: Keep the payment recorded. If they cancel, delete the payment to reverse it.

**Q: Are partial payments automatically tracked for each customer?**  
A: Yes. Each payment is tracked individually. Use Payment History to see all payments for an order.

**Q: Can payments be recorded offline?**  
A: Not with current system. You need internet to access the system and record payments.

**Q: What happens if I delete a payment by mistake?**  
A: Contact your administrator. They should be able to see if the payment was permanently deleted or help restore it.

**Q: Can I print payment receipts?**  
A: Use the browser print function (Ctrl+P) to print the payment history table.

---

## Version Information

- Feature Released: 2026
- Last Updated: 2026
- Status: Production Ready
