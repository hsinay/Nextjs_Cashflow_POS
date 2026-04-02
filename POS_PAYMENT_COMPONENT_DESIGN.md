# POS Payment Component Architecture

## Odoo/Zoho-Inspired Extended Payment Flow

**Date:** December 19, 2025  
**Status:** Design & Implementation  
**Scope:** UI/UX + Orchestration (No business logic duplication)

---

## 1. COMPONENT DESIGN OVERVIEW

### 1.1 Architecture Principles

```
┌─────────────────────────────────────────────────────────┐
│                    POS Page                             │
│                  (pos-client.tsx)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   Products Grid          PAYMENT COMPONENT
   (Existing)             (NEW - This Design)
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
   Order Summary         Payment Methods             Numeric Keypad
   (Read-only)          (Cash/Credit/Card)         (for amount input)
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            Call Existing API            Call Existing
           (createPayment / etc)         Payment Services
            (No new logic here)          (Orchestration only)
```

### 1.2 Component Hierarchy

```
POSPaymentPanel
├── OrderSummary (read-only display)
│   ├── Subtotal
│   ├── Tax
│   ├── Discount
│   └── Grand Total
├── PaymentMethodSelector
│   ├── CASH (auto-change calculation)
│   ├── CREDIT (requires customer)
│   └── CARD / UPI / WALLET (extensible)
├── NumericKeypad
│   ├── Digits (0-9)
│   ├── Decimal
│   ├── Clear
│   └── Backspace
├── CustomerSelector (inline, optional)
│   ├── Walk-in (default)
│   ├── Search Box
│   └── Customer List
└── ConfirmPaymentButton
    └── Calls existing payment API
```

---

## 2. STATE MODEL FOR PAYMENT UI

### 2.1 Payment State Interface

```typescript
interface POSPaymentState {
  // Amount & Input
  paidAmount: number; // Amount entered via keypad
  changeAmount: number; // Auto-calculated for cash

  // Customer
  selectedCustomerId: string | null; // Optional
  paymentAsCredit: boolean; // For credit method

  // Payment Method
  paymentMethod: ConcretePaymentMethod; // 'CASH' | 'CARD' | 'CREDIT' | etc.

  // Submission State
  isConfirming: boolean; // Button disabled while processing
  validationError: string | null; // Display errors

  // Order Summary (read-only, passed from parent)
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
}
```

### 2.2 Action Types

```typescript
type PaymentAction =
  | { type: "SET_PAID_AMOUNT"; payload: number }
  | { type: "SET_PAYMENT_METHOD"; payload: ConcretePaymentMethod }
  | { type: "SET_CUSTOMER"; payload: string | null }
  | { type: "TOGGLE_CREDIT"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CONFIRM_PAYMENT_START" }
  | { type: "CONFIRM_PAYMENT_END" }
  | { type: "RESET" };
```

---

## 3. VALIDATION RULES

### 3.1 Amount Validation

```typescript
// Rules for paidAmount input
✓ Digits 0-9, single decimal point
✓ Max 2 decimal places
✓ Prevent leading zeros (0.50, not 00.50)
✓ For CASH: paidAmount >= grandTotal (must cover full amount)
✓ For CREDIT: paidAmount can be < grandTotal (partial payment allowed)
```

### 3.2 Customer Validation

```typescript
// If CREDIT payment method selected:
  ✗ Customer MUST be selected (not walk-in)
  → Show error: "Select customer to use credit"

// If CASH/CARD:
  ✓ Customer optional (walk-in allowed)
```

### 3.3 Payment Method Validation

```typescript
// CASH Payment:
  → paidAmount must be >= grandTotal
  → Auto-calculate change = paidAmount - grandTotal

// CREDIT Payment:
  → Customer must be selected
  → paidAmount can be < grandTotal (partial payment)
  → Notes: "Credit balance will be added to customer account"

// CARD / UPI / WALLET:
  → paidAmount must be >= grandTotal
  → No change calculation needed
```

---

## 4. NUMERIC KEYPAD COMPONENT

### 4.1 Features

```
┌──────────────────────────┐
│     Paid: 0.00           │  ← Display input
├──────────────────────────┤
│  7    8    9      DEL    │  ← Row 1
│  4    5    6       .     │  ← Row 2
│  1    2    3      CLR    │  ← Row 3
│  0    00        BACK     │  ← Row 4
└──────────────────────────┘
```

### 4.2 Keypad Behavior

```typescript
- DEL: Delete last digit
- CLR: Clear all (reset to 0)
- BACK: Same as DEL
- . : Add decimal (only once)
- 0-9: Append digit (max 8 total before decimal)
- Format: Always display with 2 decimal places (0.00)
```

---

## 5. INTEGRATION POINTS

### 5.1 API Integration (REUSE EXISTING)

**DO NOT CREATE NEW API ENDPOINTS**

```typescript
// Existing API Call (from current POS flow):
POST /api/pos/transactions
{
  transactionNumber: string;
  cashierId: string;
  sessionId: string;
  customerId?: string;
  items: TransactionItem[];
  paymentDetails: PaymentDetail[];  // ← Our component provides this
}

// We will ONLY provide:
paymentDetails: [{
  paymentMethod: 'CASH' | 'CREDIT' | etc,
  amount: number;
}]

// REST handled by existing logic:
// - Ledger entries
// - Payment records
// - Customer balance updates
// - Session totals
```

### 5.2 Service Layer (Reuse)

```typescript
// services/payment.service.ts - Already exists
✓ createPayment()
✓ getPaymentById()
✓ getAllPayments()

// These are called via API route, not directly
// Our component just passes data to the API
```

### 5.3 Component Props (from POSClient)

```typescript
interface POSPaymentPanelProps {
  // Order Data (read-only)
  orderTotal: number;
  orderSubtotal: number;
  orderTax: number;
  orderDiscount: number;

  // Session & Cart
  sessionId: string;
  cartItems: CartItem[];

  // Customer Data
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;

  // Callbacks
  onConfirmPayment: (paymentData: PaymentDetailInput) => Promise<void>;
  onCancel: () => void;

  // UI State
  isProcessing?: boolean;
}
```

---

## 6. USER FLOW

### 6.1 Happy Path (Cash Payment)

```
1. Customer adds items to cart
   └─ POSClient shows cart summary + "Proceed to Payment" button

2. User clicks "Proceed to Payment"
   └─ POSPaymentPanel modal opens

3. Panel shows:
   - Order Summary (read-only): $45.99 (subtotal) + $2.00 (tax) = $47.99
   - Payment Method selector: [CASH] [CREDIT] [CARD]
   - CASH selected by default
   - Numeric keypad

4. Cashier enters paid amount via keypad
   - Enters: 50.00
   - Change shown: $2.01

5. Click "Confirm Payment"
   - API called with paymentDetails: { paymentMethod: 'CASH', amount: 50.00 }
   - Existing logic handles recording payment, ledger, session totals
   - Cart cleared, receipt shown

6. Done! Ready for next transaction
```

### 6.2 Credit Payment Path

```
1. Items in cart
2. Open payment panel
3. Click [CREDIT] button
   └─ Customer selector appears (inline)
   └─ If no customer selected: "Please select customer to use credit"

4. Select customer from dropdown (with search)
5. Amount pre-filled with full order total
   - Can adjust if partial payment
   - Notes show: "This will be added to customer credit"

6. Click "Confirm Payment"
   - API called: { paymentMethod: 'CREDIT', amount: 47.99, customerId }
   - Existing payment logic updates customer balance
   - Transaction recorded as credit
```

---

## 7. ODOO-INSPIRED UX FEATURES

### 7.1 Keyboard Support

```typescript
// Number keys work for digit input
// Enter key = Confirm
// Escape key = Cancel / Close
// Backspace = Delete last digit
```

### 7.2 Touch-Friendly Layout

```typescript
// Large buttons (minimum 50px for touch)
// High contrast colors
// Clear hierarchy: amount display > keypad > confirm
// Minimal navigation (no deep menus)
```

### 7.3 Live Validation Feedback

```typescript
// Real-time change calculation for cash
// Visual indicator if CREDIT needs customer selection
// Clear error messages below input
// Confirm button color changes:
  - Gray/disabled: when insufficient amount or missing customer
  - Green: ready to confirm
```

---

## 8. FILE STRUCTURE

```
components/pos/
├── pos-client.tsx                 (MODIFIED - add payment panel)
├── pos-payment-panel.tsx          (NEW - main payment component)
├── numeric-keypad.tsx             (NEW - keypad component)
├── order-summary.tsx              (NEW - read-only summary)
├── customer-selector.tsx          (NEW - inline customer picker)
└── payment-method-selector.tsx    (NEW - method buttons)

types/
├── pos-payment.types.ts           (NEW - payment UI types)
```

---

## 9. NO BREAKING CHANGES

### 9.1 Backward Compatibility

```typescript
// Existing POS flow continues UNCHANGED:
✓ Session creation
✓ Product selection
✓ Cart management
✓ Payment recording API (same endpoint, same logic)

// NEW:
+ Payment panel opens as modal/overlay
+ Provides structured paymentDetails to existing API
+ Doesn't modify existing payment.service.ts
+ Doesn't create new API endpoints
```

### 9.2 Extensibility

```typescript
// Easy to add payment methods:
1. Add method to CONCRETE_PAYMENT_METHODS in types
2. Add case in validation logic
3. Add button in payment-method-selector.tsx
// No backend changes needed for basic methods
```

---

## 10. IMPLEMENTATION CHECKLIST

- [ ] Create numeric-keypad.tsx
- [ ] Create order-summary.tsx
- [ ] Create customer-selector.tsx
- [ ] Create payment-method-selector.tsx
- [ ] Create pos-payment-panel.tsx (main component)
- [ ] Create pos-payment.types.ts (TypeScript types)
- [ ] Update pos-client.tsx (add payment panel trigger)
- [ ] Add keyboard event handlers (Enter, Escape, Backspace)
- [ ] Test cash payment flow
- [ ] Test credit payment flow
- [ ] Test validation (amount, customer, method)
- [ ] Test numeric keypad input
- [ ] Performance optimization (memoization)
- [ ] Accessibility review (ARIA labels, keyboard nav)

---

## 11. FUTURE ENHANCEMENTS

```
Phase 2:
- Receipt printing component
- Payment history in modal
- Discount code input
- Gift card integration

Phase 3:
- Multi-payment (split payment)
- Tip input field
- Payment plan / installments
- Integration with external payment gateways
```

---

## SUMMARY

**This design ensures:**

1. ✓ No duplication of existing payment logic
2. ✓ Clean UI/UX component layer
3. ✓ Reuses existing payment APIs
4. ✓ Easy to extend with new payment methods
5. ✓ Odoo/Zoho-inspired cashier workflow
6. ✓ No breaking changes to existing system
7. ✓ Touch-friendly for POS terminals
