# POS Integration Quick Reference Guide

## 🚀 Quick Start

### Using the Integrated POS Transaction API

```bash
curl -X POST http://localhost:3000/api/pos/transactions-integrated \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "transactionNumber": "TXN-001",
    "cashierId": "cashier-uuid",
    "sessionId": "session-uuid",
    "customerId": "customer-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 2,
        "unitPrice": 299.99,
        "discountApplied": 50
      }
    ],
    "paymentDetails": [
      {
        "paymentMethod": "CASH",
        "amount": 549.98
      }
    ]
  }'
```

---

## 📁 File Structure

### Core Implementation Files

```
services/
├── pos-integration.service.ts      ← Main orchestrator (400+ lines)
│   ├── processIntegratedPOSTransaction()    ← Entry point
│   ├── validatePOSIntegrationInput()        ← Validation
│   └── getTransactionAnalytics()            ← Analytics
│
└── payment.service.ts              ← Payment operations (556 lines)
    ├── createRefund()
    ├── approveRefund()
    ├── processRefund()
    └── getReconciliationMetrics()

app/api/pos/
└── transactions-integrated/
    └── route.ts                    ← API endpoint (150+ lines)

types/
└── payment.types.ts               ← Type definitions (380+ lines)

lib/validations/
└── payment.schema.ts              ← Zod schemas (210+ lines)
```

---

## 🔑 Key Concepts

### 1. Atomic Transactions

```typescript
// All operations succeed together or fail together
return prisma.$transaction(async (tx) => {
  // Step 1: Inventory
  // Step 2: Ledger
  // Step 3: Customer
  // Step 4: Payment
  // Step 5: Transaction
  // Step 6: Session
  // If ANY step fails, ALL changes rollback
});
```

### 2. Split Payments

```typescript
paymentDetails: [
  { paymentMethod: "CASH", amount: 100 },
  { paymentMethod: "CARD", amount: 200 },
  { paymentMethod: "UPI", amount: 100 },
];
// Total: 400 | Automatically detected as "MIXED"
```

### 3. Payment Methods

- **CASH**: Direct cash
- **CARD**: Visa, Mastercard, Amex (track last 4, brand, auth code)
- **UPI**: Immediate transfers (track UPI ID)
- **DIGITAL_WALLET**: Apple Pay, Google Pay, PayPal
- **CHEQUE**: Track cheque number, date, bank, status
- **BANK_TRANSFER**: Track account and routing details
- **CREDIT/DEBIT**: Account-based
- **MOBILE_WALLET**: Third-party wallets

### 4. Ledger Entries (Double-Entry Bookkeeping)

```
Revenue Sale:
  Debit:  Cash/Bank  (Asset increases)
  Credit: Revenue    (Income increases)

COGS (if available):
  Debit:  COGS       (Expense increases)
  Credit: Inventory  (Asset decreases)

Sales Tax:
  Debit:  Cash/Bank
  Credit: Tax Payable (Liability increases)

Discount:
  Debit:  Discount Expense
  Credit: Revenue
```

---

## 💾 Database Schema

### Payment Model (25+ fields)

```typescript
Payment {
  id: UUID
  transactionId: UUID → Transaction
  status: PENDING | COMPLETED | FAILED
  paymentMethod: CASH | CARD | UPI | ... (9 types)
  amount: Decimal
  transactionFee: Decimal
  netAmount: Decimal

  // Card details
  cardLast4: string?
  cardBrand: VISA | MASTERCARD | ...?
  authorizationId: string?

  // Digital wallet
  walletProvider: APPLE_PAY | GOOGLE_PAY | ...?
  walletIdentifier: string?

  // Bank transfer
  bankName: string?
  accountNumber: string?
  routingNumber: string?

  // UPI
  upiId: string?

  // Cheque
  chequeNumber: string?
  chequeDate: DateTime?
  chequeBank: string?
  chequeStatus: PENDING | CLEARED | ...?

  // Reconciliation
  isReconciled: boolean
  reconciledAt: DateTime?
  reconciledBy: string?
}
```

### Payment Refund Model

```typescript
PaymentRefund {
  id: UUID
  paymentId: UUID → Payment
  amount: Decimal
  reason: string
  status: PENDING | APPROVED | REJECTED | COMPLETED | FAILED
  refundMethod: ORIGINAL_PAYMENT | BANK_TRANSFER | ...
  approverNotes: string?
  createdAt: DateTime
}
```

---

## 🎯 8-Step Transaction Workflow

```
1️⃣  VALIDATE
    ✓ Cashier exists
    ✓ Session exists and is open
    ✓ Customer exists (if provided)
    ✓ Products exist
    ✓ Stock available
    ✓ Payment total = Item total

2️⃣  CALCULATE
    ✓ Inventory deduction
    ✓ COGS per item
    ✓ Total tax
    ✓ Total discount
    ✓ Net amount

3️⃣  INVENTORY
    ✓ Deduct stock from each product
    ✓ Create inventory transaction (POS_SALE type)
    ✓ Track COGS per item

4️⃣  ACCOUNTING
    ✓ Revenue entry (Debit Cash → Credit Revenue)
    ✓ COGS entry (Debit COGS → Credit Inventory)
    ✓ Tax entry (Debit Cash → Credit Tax Payable)
    ✓ Discount entry (Debit Expense → Credit Revenue)

5️⃣  CUSTOMER
    ✓ Add loyalty points (amount × rate)
    ✓ Update outstanding balance (if credit sale)
    ✓ Link transaction to customer

6️⃣  PAYMENT
    ✓ Record each payment method
    ✓ Store payment-specific details
    ✓ Calculate transaction fees
    ✓ Detect split payment (auto "MIXED")

7️⃣  TRANSACTION
    ✓ Create main transaction record
    ✓ Attach all items
    ✓ Attach all payments
    ✓ Set completion status

8️⃣  SESSION
    ✓ Increment total sales
    ✓ Increment transaction count
    ✓ Update payment method totals
    ✓ Calculate cash variance
```

---

## 🔧 Common Operations

### Create Simple Cash Transaction

```typescript
const result = await processIntegratedPOSTransaction({
  transactionNumber: "TXN-001",
  cashierId: "cashier-uuid",
  sessionId: "session-uuid",
  customerId: "customer-uuid",
  loyaltyPointsRate: 1.5,
  items: [
    {
      productId: "product-uuid",
      quantity: 2,
      unitPrice: 299.99,
    },
  ],
  paymentDetails: [
    {
      paymentMethod: "CASH",
      amount: 599.98,
    },
  ],
});

// Returns:
// {
//   transactionId: 'txn-uuid',
//   totalAmount: 599.98,
//   pointsEarned: 899,
//   inventoryEntriesCreated: 1,
//   ledgerEntriesCreated: 1
// }
```

### Create Split Payment Transaction

```typescript
const result = await processIntegratedPOSTransaction({
  transactionNumber: "TXN-002",
  cashierId: "cashier-uuid",
  sessionId: "session-uuid",
  customerId: "customer-uuid",
  items: [
    {
      productId: "product1-uuid",
      quantity: 1,
      unitPrice: 100,
    },
    {
      productId: "product2-uuid",
      quantity: 1,
      unitPrice: 200,
    },
  ],
  paymentDetails: [
    {
      paymentMethod: "CARD",
      amount: 200,
      cardBrand: "VISA",
      cardLast4: "4242",
      authorizationId: "auth_12345",
    },
    {
      paymentMethod: "UPI",
      amount: 100,
      upiId: "user@upi",
    },
  ],
});

// Returns:
// {
//   transactionId: 'txn-uuid',
//   totalAmount: 300,
//   pointsEarned: 450,
//   paymentMethods: ['MIXED'],  // Auto-detected
//   ledgerEntriesCreated: 1
// }
```

### Create Card Payment

```typescript
paymentDetails: [
  {
    paymentMethod: "CARD",
    amount: 500,
    cardBrand: "MASTERCARD",
    cardLast4: "5555",
    cardType: "CREDIT",
    authorizationId: "auth_56789",
  },
];
```

### Create Cheque Payment

```typescript
paymentDetails: [
  {
    paymentMethod: "CHEQUE",
    amount: 500,
    chequeNumber: "CHQ-001",
    chequeDate: "2024-01-15",
    chequeBank: "State Bank of India",
    chequeStatus: "PENDING",
  },
];
```

### Create UPI Payment

```typescript
paymentDetails: [
  {
    paymentMethod: "UPI",
    amount: 500,
    upiId: "merchant@upi",
  },
];
```

### Create Bank Transfer

```typescript
paymentDetails: [
  {
    paymentMethod: "BANK_TRANSFER",
    amount: 500,
    bankName: "HDFC Bank",
    accountHolder: "Business Name",
    accountNumber: "123456789",
    routingNumber: "HDFC0000001",
  },
];
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Status | Meaning                | Example                      |
| ------ | ---------------------- | ---------------------------- |
| 201    | ✅ Transaction created | Successful POS transaction   |
| 400    | ❌ Bad request         | Payment total doesn't match  |
| 401    | ❌ Unauthorized        | Missing auth token           |
| 403    | ❌ Forbidden           | User lacks CASHIER role      |
| 409    | ❌ Conflict            | Duplicate transaction number |
| 500    | ❌ Server error        | Database error               |

### Common Errors

```typescript
// Error: Validation failed
{
  "error": "Payment total (300) must equal item total (350)"
}

// Error: Stock insufficient
{
  "error": "Insufficient stock for product: product-uuid"
}

// Error: No permission
{
  "error": "User requires CASHIER or INVENTORY_MANAGER role"
}

// Error: Duplicate transaction
{
  "error": "Transaction TXN-001 already exists"
}
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm test -- --testPathPattern="unit"
```

### Run Integration Tests

```bash
npm test -- --testPathPattern="integration"
```

### Run E2E Tests

```bash
npm test -- --testPathPattern="e2e"
```

### Check Coverage

```bash
npm test -- --coverage
```

---

## 🚨 Validation Rules

### Input Validation

```typescript
✓ transactionNumber: Required, string, 1-50 chars
✓ cashierId: Required, UUID
✓ sessionId: Required, UUID
✓ customerId: Optional, UUID
✓ items: Required, array, min 1 item
  - productId: Required, UUID
  - quantity: Required, positive integer
  - unitPrice: Required, positive number
✓ paymentDetails: Required, array, min 1
  - paymentMethod: Required, one of 9 types
  - amount: Required, positive number
  - Other fields: Depend on payment method
```

### Business Logic Validation

```typescript
✓ Payment total = Sum of item amounts ± discount ± tax
✓ All products must exist in database
✓ All products must have sufficient stock
✓ Cashier must exist and have CASHIER role
✓ Session must exist and be OPEN
✓ Customer (if provided) must exist
✓ Loyalty rate must be > 0 (if provided)
✓ No negative quantities or prices
```

---

## 📊 Analytics & Reporting

### Get Transaction Analytics

```typescript
const analytics = await getTransactionAnalytics(sessionId);

// Returns:
{
  totalTransactions: 15,
  totalRevenue: 5000.00,
  totalTax: 900.00,
  totalDiscount: 250.00,
  averageOrderValue: 333.33,
  paymentMethodBreakdown: {
    CASH: 2000.00,
    CARD: 2500.00,
    UPI: 500.00
  }
}
```

---

## 🔐 Security & Authorization

### Required Roles

- **ADMIN**: Full access to all operations
- **INVENTORY_MANAGER**: Can create transactions, manage inventory
- **CASHIER**: Can create transactions

### Authentication

```
1. User logs in with username/email + password
2. NextAuth creates session token (JWT in httpOnly cookie)
3. Token includes: userId, username, roles, permissions
4. All API calls check token via getServerSession()
5. Authorization verified against session.user.roles
```

---

## 🔄 Rollback & Recovery

### Automatic Rollback Triggers

- ✅ Stock insufficient
- ✅ Product not found
- ✅ Ledger entry fails
- ✅ Payment recording fails
- ✅ Any database error
- ✅ Transaction timeout (30 sec)

### Manual Recovery

```typescript
// If transaction partially completed before crash:
// 1. Check transaction record
const txn = await prisma.transaction.findUnique({
  where: { transactionNumber: "TXN-001" },
});

// 2. Check inventory entries
const invTxns = await prisma.inventoryTransaction.findMany({
  where: { referencedTransactionId: txn.id },
});

// 3. Check ledger entries
const ledger = await prisma.ledgerEntry.findMany({
  where: { referenceId: txn.id },
});

// 4. If incomplete, manually rollback or retry
```

---

## 📚 Related Documentation

- **Architecture**: See `POS_INTEGRATION_ARCHITECTURE.md`
- **Testing**: See `TESTING_PLAN.md`
- **Checklist**: See `IMPLEMENTATION_CHECKLIST.md`
- **Code**: Review `services/pos-integration.service.ts`
- **API**: Review `app/api/pos/transactions-integrated/route.ts`

---

## 🆘 Troubleshooting

### Issue: Transaction Times Out

**Solution**: Check for network issues, increase timeout to 60 seconds, or batch process

### Issue: Ledger Doesn't Balance

**Solution**: Verify all entry calculations, check for missing tax/discount entries

### Issue: Stock Count Inconsistent

**Solution**: Run inventory audit, verify POS_SALE entries, check for concurrent conflicts

### Issue: Loyalty Points Not Awarded

**Solution**: Verify loyaltyPointsRate > 0, customer is registered, rate applied correctly

### Issue: Payment Not Recorded

**Solution**: Check payment method validation, verify payment amount matches item total

---

## 📞 Support

For issues or questions:

1. **Check the error message** - It should be specific
2. **Review the architecture doc** - Understand the flow
3. **Check the testing plan** - See similar scenarios
4. **Review the code** - Inline documentation explains decisions
5. **Run tests** - Verify your changes don't break existing functionality

---

**Version**: 1.0  
**Last Updated**: January 2024  
**Status**: Phase 3 Complete, Phase 4 Ready for Validation  
**Build**: ✅ Passing
