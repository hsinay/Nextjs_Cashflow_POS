# POS Integration Testing Plan

## Test Overview

This document outlines comprehensive testing strategy for the integrated POS system, covering unit tests, integration tests, and end-to-end scenarios.

---

## Test Environment Setup

### Prerequisites

```bash
# Ensure test database is available
# Create separate test database: pos_system_test
# Environment variables in .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/pos_system_test"
NEXTAUTH_SECRET="test-secret-key-12345"
NEXTAUTH_URL="http://localhost:3000"
```

### Test Data Fixtures

```typescript
// Sample fixtures to use across tests
fixtures = {
  cashier: { id: "cashier-1", username: "john_cashier", role: "CASHIER" },
  session: { id: "session-1", status: "OPEN", totalSales: 0 },
  customer: { id: "customer-1", name: "Jane Doe", loyaltyPoints: 100 },
  product1: {
    id: "product-1",
    name: "Item A",
    price: 100,
    stock: 50,
    costPrice: 60,
  },
  product2: {
    id: "product-2",
    name: "Item B",
    price: 200,
    stock: 30,
    costPrice: 120,
  },
};
```

---

## Unit Tests

### Test Suite 1: Input Validation

#### Test Case 1.1: Valid Input

```typescript
describe("validatePOSIntegrationInput", () => {
  it("should validate correct input", async () => {
    const input = {
      transactionNumber: "TXN-001",
      cashierId: cashier.id,
      sessionId: session.id,
      customerId: customer.id,
      items: [{ productId: product1.id, quantity: 2, unitPrice: 100 }],
      paymentDetails: [{ paymentMethod: "CASH", amount: 200 }],
    };

    const result = await validatePOSIntegrationInput(input);
    expect(result.valid).toBe(true);
  });
});
```

#### Test Case 1.2: Missing Required Fields

```typescript
it("should reject missing transactionNumber", async () => {
  const input = { ...validInput, transactionNumber: undefined };
  expect(() => validatePOSIntegrationInput(input)).toThrow(
    "Transaction number required"
  );
});

it("should reject missing cashierId", async () => {
  const input = { ...validInput, cashierId: undefined };
  expect(() => validatePOSIntegrationInput(input)).toThrow(
    "Cashier ID required"
  );
});
```

#### Test Case 1.3: Invalid Data Types

```typescript
it("should reject invalid quantity (negative)", async () => {
  const input = {
    ...validInput,
    items: [{ ...validInput.items[0], quantity: -1 }],
  };
  expect(() => validatePOSIntegrationInput(input)).toThrow(
    "Quantity must be positive"
  );
});

it("should reject invalid price (non-numeric)", async () => {
  const input = {
    ...validInput,
    items: [{ ...validInput.items[0], unitPrice: "invalid" }],
  };
  expect(() => validatePOSIntegrationInput(input)).toThrow(
    "Price must be numeric"
  );
});
```

#### Test Case 1.4: Payment Total Mismatch

```typescript
it("should reject when payment total != item total", async () => {
  const input = {
    ...validInput,
    paymentDetails: [{ paymentMethod: "CASH", amount: 100 }], // Should be 200
  };
  expect(() => validatePOSIntegrationInput(input)).toThrow(
    "Payment total must equal item total"
  );
});
```

#### Test Case 1.5: Empty Items

```typescript
it("should reject empty items array", async () => {
  const input = { ...validInput, items: [] };
  expect(() => validatePOSIntegrationInput(input)).toThrow(
    "At least one item required"
  );
});

it("should reject empty paymentDetails array", async () => {
  const input = { ...validInput, paymentDetails: [] };
  expect(() => validatePOSIntegrationInput(input)).toThrow(
    "At least one payment method required"
  );
});
```

---

### Test Suite 2: Helper Functions

#### Test Case 2.1: convertToNumber

```typescript
describe("convertToNumber", () => {
  it("should convert Decimal to number", () => {
    const decimal = new Decimal("123.45");
    expect(convertToNumber(decimal)).toBe(123.45);
  });

  it("should handle zero", () => {
    const decimal = new Decimal("0");
    expect(convertToNumber(decimal)).toBe(0);
  });

  it("should handle large numbers", () => {
    const decimal = new Decimal("999999.99");
    expect(convertToNumber(decimal)).toBe(999999.99);
  });

  it("should handle negative numbers", () => {
    const decimal = new Decimal("-50.25");
    expect(convertToNumber(decimal)).toBe(-50.25);
  });
});
```

#### Test Case 2.2: toDecimal

```typescript
describe("toDecimal", () => {
  it("should convert number to Decimal", () => {
    const result = toDecimal(100.5);
    expect(result).toEqual(new Decimal("100.50"));
  });

  it("should preserve string decimals", () => {
    const result = toDecimal("999.99");
    expect(result).toEqual(new Decimal("999.99"));
  });

  it("should handle Decimal input", () => {
    const input = new Decimal("50");
    const result = toDecimal(input);
    expect(result).toEqual(new Decimal("50"));
  });
});
```

---

### Test Suite 3: Analytics Helper

#### Test Case 3.1: Transaction Analytics Calculation

```typescript
describe("getTransactionAnalytics", () => {
  it("should calculate correct totals", async () => {
    // Setup: Create multiple transactions
    const analytics = await getTransactionAnalytics(sessionId);

    expect(analytics).toHaveProperty("totalTransactions");
    expect(analytics).toHaveProperty("totalRevenue");
    expect(analytics).toHaveProperty("totalTax");
    expect(analytics).toHaveProperty("totalDiscount");
    expect(analytics.totalTransactions).toBeGreaterThan(0);
  });

  it("should break down by payment method", async () => {
    const analytics = await getTransactionAnalytics(sessionId);

    expect(analytics.paymentMethodBreakdown).toHaveProperty("CASH");
    expect(analytics.paymentMethodBreakdown.CASH).toBeGreaterThan(0);
  });

  it("should calculate average order value", async () => {
    const analytics = await getTransactionAnalytics(sessionId);

    const expectedAvg = analytics.totalRevenue / analytics.totalTransactions;
    expect(analytics.averageOrderValue).toBe(expectedAvg);
  });
});
```

---

## Integration Tests

### Test Suite 4: Inventory Integration

#### Test Case 4.1: Single Item Stock Deduction

```typescript
describe("Inventory Integration", () => {
  it("should deduct stock correctly for single item", async () => {
    const before = await getProductStock(product1.id);

    const result = await processIntegratedPOSTransaction({
      ...validInput,
      items: [{ productId: product1.id, quantity: 5, unitPrice: 100 }],
      paymentDetails: [{ paymentMethod: "CASH", amount: 500 }],
    });

    const after = await getProductStock(product1.id);
    expect(before - after).toBe(5);
    expect(result.inventoryEntriesCreated).toBe(1);
  });
});
```

#### Test Case 4.2: Multiple Items Stock Deduction

```typescript
it("should deduct stock for multiple items", async () => {
  const before1 = await getProductStock(product1.id);
  const before2 = await getProductStock(product2.id);

  const result = await processIntegratedPOSTransaction({
    ...validInput,
    items: [
      { productId: product1.id, quantity: 2, unitPrice: 100 },
      { productId: product2.id, quantity: 3, unitPrice: 200 },
    ],
    paymentDetails: [{ paymentMethod: "CASH", amount: 800 }],
  });

  const after1 = await getProductStock(product1.id);
  const after2 = await getProductStock(product2.id);

  expect(before1 - after1).toBe(2);
  expect(before2 - after2).toBe(3);
  expect(result.inventoryEntriesCreated).toBe(2);
});
```

#### Test Case 4.3: Insufficient Stock

```typescript
it("should rollback entire transaction if stock insufficient", async () => {
  const before1 = await getProductStock(product1.id);
  const before2 = await getProductStock(product2.id);
  const beforeBalance = await getCustomerBalance(customer.id);

  // Try to deduct more than available
  expect(() =>
    processIntegratedPOSTransaction({
      ...validInput,
      items: [{ productId: product1.id, quantity: 1000, unitPrice: 100 }],
      paymentDetails: [{ paymentMethod: "CASH", amount: 100000 }],
    })
  ).toThrow("Insufficient stock");

  // Verify rollback - no changes made
  const after1 = await getProductStock(product1.id);
  const after2 = await getProductStock(product2.id);
  const afterBalance = await getCustomerBalance(customer.id);

  expect(after1).toBe(before1);
  expect(after2).toBe(before2);
  expect(afterBalance).toBe(beforeBalance);
});
```

#### Test Case 4.4: Inventory Transaction Creation

```typescript
it("should create inventory transactions with correct type", async () => {
  const result = await processIntegratedPOSTransaction(validInput);

  const transactions = await getInventoryTransactionsByType("POS_SALE");
  const ourTransaction = transactions.find(
    (t) => t.referencedTransactionId === result.transactionId
  );

  expect(ourTransaction).toBeDefined();
  expect(ourTransaction.type).toBe("POS_SALE");
  expect(ourTransaction.quantity).toBe(2);
});
```

---

### Test Suite 5: Ledger Integration

#### Test Case 5.1: Revenue Entry Creation

```typescript
describe("Ledger Integration", () => {
  it("should create revenue ledger entry", async () => {
    const result = await processIntegratedPOSTransaction(validInput);

    const entries = await getLedgerEntries({
      referenceId: result.transactionId,
      accountType: "REVENUE",
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].debitAmount).toBeGreaterThan(0); // Cash/Bank debit
    expect(entries[0].creditAmount).toBe(entries[0].debitAmount); // Revenue credit
  });
});
```

#### Test Case 5.2: COGS Entry Creation

```typescript
it("should create COGS ledger entry if cost price available", async () => {
  const result = await processIntegratedPOSTransaction(validInput);

  const entries = await getLedgerEntries({
    referenceId: result.transactionId,
    accountType: "COGS",
  });

  // Product has costPrice: 60
  expect(entries).toHaveLength(1);
  expect(entries[0].debitAmount).toBe(120); // 2 items * 60
  expect(entries[0].creditAccount).toBe("INVENTORY");
});
```

#### Test Case 5.3: Tax Entry Creation

```typescript
it("should create tax ledger entry", async () => {
  const inputWithTax = {
    ...validInput,
    items: [
      {
        ...validInput.items[0],
        tax: 50, // Add tax
      },
    ],
  };

  const result = await processIntegratedPOSTransaction(inputWithTax);

  const entries = await getLedgerEntries({
    referenceId: result.transactionId,
    accountType: "TAX",
  });

  expect(entries).toHaveLength(1);
  expect(entries[0].creditAmount).toBe(50); // Tax Payable credit
});
```

#### Test Case 5.4: Discount Entry Creation

```typescript
it("should create discount ledger entry", async () => {
  const inputWithDiscount = {
    ...validInput,
    items: [
      {
        ...validInput.items[0],
        discountApplied: 30,
      },
    ],
  };

  const result = await processIntegratedPOSTransaction(inputWithDiscount);

  const entries = await getLedgerEntries({
    referenceId: result.transactionId,
    accountType: "DISCOUNT",
  });

  expect(entries).toHaveLength(1);
  expect(entries[0].debitAmount).toBe(30); // Discount expense debit
});
```

#### Test Case 5.5: Ledger Balance Verification

```typescript
it("should maintain ledger balance (debits = credits)", async () => {
  const result = await processIntegratedPOSTransaction(validInput);

  const entries = await getLedgerEntries({
    referenceId: result.transactionId,
  });

  const totalDebits = entries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredits = entries.reduce((sum, e) => sum + e.creditAmount, 0);

  expect(totalDebits).toBe(totalCredits); // Double-entry bookkeeping
});
```

---

### Test Suite 6: Customer Integration

#### Test Case 6.1: Loyalty Points Addition

```typescript
describe("Customer Integration", () => {
  it("should add loyalty points correctly", async () => {
    const beforePoints = await getCustomerLoyaltyPoints(customer.id);

    const result = await processIntegratedPOSTransaction({
      ...validInput,
      loyaltyPointsRate: 2, // 2 points per rupee
    });

    const afterPoints = await getCustomerLoyaltyPoints(customer.id);
    const expectedPoints = Math.floor(200 * 2); // 200 total amount * 2 rate

    expect(afterPoints - beforePoints).toBe(expectedPoints);
    expect(result.pointsEarned).toBe(expectedPoints);
  });
});
```

#### Test Case 6.2: Outstanding Balance Update

```typescript
it("should update customer outstanding balance", async () => {
  const beforeBalance = await getCustomerOutstandingBalance(customer.id);

  const result = await processIntegratedPOSTransaction({
    ...validInput,
    paymentMethod: "CREDIT", // Credit sale
  });

  const afterBalance = await getCustomerOutstandingBalance(customer.id);
  expect(afterBalance - beforeBalance).toBe(200); // 2 items * 100
});
```

#### Test Case 6.3: No Points for Unregistered Customers

```typescript
it("should not award points to unregistered customers", async () => {
  const inputNoCustomer = { ...validInput, customerId: null };

  const result = await processIntegratedPOSTransaction(inputNoCustomer);

  expect(result.pointsEarned).toBe(0);
});
```

---

### Test Suite 7: Payment Integration

#### Test Case 7.1: Single Payment Method

```typescript
describe("Payment Integration", () => {
  it("should record single payment method", async () => {
    const result = await processIntegratedPOSTransaction({
      ...validInput,
      paymentDetails: [{ paymentMethod: "CASH", amount: 200 }],
    });

    expect(result.paymentMethods).toContain("CASH");

    const payments = await getPaymentsByTransaction(result.transactionId);
    expect(payments).toHaveLength(1);
    expect(payments[0].paymentMethod).toBe("CASH");
  });
});
```

#### Test Case 7.2: Split Payment (Multiple Methods)

```typescript
it("should record split payment with multiple methods", async () => {
  const result = await processIntegratedPOSTransaction({
    ...validInput,
    paymentDetails: [
      { paymentMethod: "CASH", amount: 100 },
      { paymentMethod: "CARD", amount: 100 },
      { paymentMethod: "UPI", amount: 0 },
    ],
  });

  expect(result.paymentMethods).toContain("CASH");
  expect(result.paymentMethods).toContain("CARD");

  const payments = await getPaymentsByTransaction(result.transactionId);
  expect(payments).toHaveLength(3);
});
```

#### Test Case 7.3: Card Payment Details

```typescript
it("should capture card payment details", async () => {
  const result = await processIntegratedPOSTransaction({
    ...validInput,
    paymentDetails: [
      {
        paymentMethod: "CARD",
        amount: 200,
        cardBrand: "VISA",
        cardLast4: "4242",
        authorizationId: "auth_12345",
      },
    ],
  });

  const payments = await getPaymentsByTransaction(result.transactionId);
  const cardPayment = payments[0];

  expect(cardPayment.cardBrand).toBe("VISA");
  expect(cardPayment.cardLast4).toBe("4242");
  expect(cardPayment.authorizationId).toBe("auth_12345");
});
```

#### Test Case 7.4: Payment Method Detection

```typescript
it("should detect split payment automatically", async () => {
  const result = await processIntegratedPOSTransaction({
    ...validInput,
    paymentDetails: [
      { paymentMethod: "CASH", amount: 100 },
      { paymentMethod: "CARD", amount: 100 },
    ],
  });

  expect(result.paymentMethods[0]).toBe("MIXED"); // Auto-detected
});
```

---

### Test Suite 8: POS Session Integration

#### Test Case 8.1: Session Update with Single Transaction

```typescript
describe("POS Session Integration", () => {
  it("should update session totals", async () => {
    const beforeSession = await getSessionById(session.id);

    const result = await processIntegratedPOSTransaction(validInput);

    const afterSession = await getSessionById(session.id);

    expect(afterSession.totalSales - beforeSession.totalSales).toBe(200);
    expect(afterSession.transactionCount - beforeSession.transactionCount).toBe(
      1
    );
  });
});
```

#### Test Case 8.2: Session Payment Breakdown

```typescript
it("should update payment method breakdown in session", async () => {
  const result = await processIntegratedPOSTransaction({
    ...validInput,
    paymentDetails: [
      { paymentMethod: "CASH", amount: 100 },
      { paymentMethod: "CARD", amount: 100 },
    ],
  });

  const session = await getSessionById(session.id);

  expect(session.paymentBreakdown.CASH).toBe(100);
  expect(session.paymentBreakdown.CARD).toBe(100);
});
```

#### Test Case 8.3: Multiple Transactions in Session

```typescript
it("should aggregate multiple transactions correctly", async () => {
  // First transaction
  await processIntegratedPOSTransaction(validInput); // 200

  // Second transaction
  const input2 = {
    ...validInput,
    transactionNumber: "TXN-002",
    items: [{ productId: product2.id, quantity: 1, unitPrice: 200 }],
    paymentDetails: [{ paymentMethod: "CARD", amount: 200 }],
  };
  await processIntegratedPOSTransaction(input2);

  const session = await getSessionById(session.id);

  expect(session.totalSales).toBe(400); // 200 + 200
  expect(session.transactionCount).toBe(2);
});
```

---

## End-to-End Tests

### Test Suite 9: Complete Workflows

#### Test Case 9.1: Simple Cash Transaction

```typescript
describe("End-to-End Workflows", () => {
  it("should process complete cash transaction", async () => {
    const response = await fetch("/api/pos/transactions-integrated", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${validSessionToken}`,
      },
      body: JSON.stringify({
        transactionNumber: "TXN-E2E-001",
        cashierId: cashier.id,
        sessionId: session.id,
        customerId: customer.id,
        items: [{ productId: product1.id, quantity: 2, unitPrice: 100 }],
        paymentDetails: [{ paymentMethod: "CASH", amount: 200 }],
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.transactionId).toBeDefined();
    expect(data.data.pointsEarned).toBe(3); // 200 * 1.5 loyalty rate
    expect(data.data.inventoryEntriesCreated).toBe(1);
    expect(data.data.ledgerEntriesCreated).toBe(1);
  });
});
```

#### Test Case 9.2: Complex Split Payment Transaction

```typescript
it("should process split payment with discount and tax", async () => {
  const response = await fetch("/api/pos/transactions-integrated", {
    method: "POST",
    headers: { ...headers },
    body: JSON.stringify({
      transactionNumber: "TXN-E2E-002",
      cashierId: cashier.id,
      sessionId: session.id,
      customerId: customer.id,
      items: [
        {
          productId: product1.id,
          quantity: 1,
          unitPrice: 100,
          discountApplied: 10, // 10 discount
        },
        {
          productId: product2.id,
          quantity: 2,
          unitPrice: 200,
          tax: 72, // 18% tax
        },
      ],
      paymentDetails: [
        { paymentMethod: "CARD", amount: 300 },
        { paymentMethod: "UPI", amount: 182 }, // 90 + 400 + 72 - 10 - 10 = 542
      ],
    }),
  });

  expect(response.status).toBe(201);
  const data = await response.json();

  expect(data.data.totalAmount).toBe(482);
  expect(data.data.totalTax).toBe(72);
  expect(data.data.totalDiscount).toBe(10);
  expect(data.data.paymentMethods).toContain("MIXED");
  expect(data.data.ledgerEntriesCreated).toBe(4); // Revenue, COGS, Tax, Discount
});
```

#### Test Case 9.3: Authorization Failures

```typescript
it("should reject unauthorized user", async () => {
  const response = await fetch("/api/pos/transactions-integrated", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // No auth token
  });

  expect(response.status).toBe(401);
});

it("should reject user without CASHIER role", async () => {
  const response = await fetch("/api/pos/transactions-integrated", {
    method: "POST",
    headers: {
      ...headers,
      Cookie: `next-auth.session-token=${userWithoutCashierRole}`,
    },
  });

  expect(response.status).toBe(403);
});
```

#### Test Case 9.4: Invalid Request Handling

```typescript
it("should reject invalid payment total", async () => {
  const response = await fetch("/api/pos/transactions-integrated", {
    method: "POST",
    headers: { ...headers },
    body: JSON.stringify({
      ...validBody,
      paymentDetails: [{ paymentMethod: "CASH", amount: 100 }], // Should be 200
    }),
  });

  expect(response.status).toBe(400);
  const data = await response.json();
  expect(data.error).toContain("Payment total must equal");
});
```

#### Test Case 9.5: Duplicate Transaction Prevention

```typescript
it("should reject duplicate transaction number", async () => {
  const body = { ...validInput, transactionNumber: "TXN-DUPLICATE" };

  // First request
  const response1 = await fetch("/api/pos/transactions-integrated", {
    method: "POST",
    headers: { ...headers },
    body: JSON.stringify(body),
  });
  expect(response1.status).toBe(201);

  // Second request with same transaction number
  const response2 = await fetch("/api/pos/transactions-integrated", {
    method: "POST",
    headers: { ...headers },
    body: JSON.stringify(body),
  });

  expect(response2.status).toBe(409); // Conflict
  const data = await response2.json();
  expect(data.error).toContain("already exists");
});
```

---

## Regression Test Suite

### Critical Paths to Monitor

1. **Inventory Accuracy**

   - Before & after stock counts match expected deduction
   - No phantom inventory created
   - Negative stock prevented

2. **Financial Accuracy**

   - Ledger entries balance (debits = credits)
   - Revenue recorded correctly
   - COGS accounted for
   - Tax calculated correctly

3. **Customer Data**

   - Loyalty points awarded accurately
   - Outstanding balance updates
   - Transaction history maintained

4. **Payment Recording**

   - All payment methods tracked
   - Split payments handled correctly
   - No duplicate payments

5. **Data Consistency**
   - Transaction created successfully
   - Inventory transaction linked
   - Session updated
   - Ledger entries created

---

## Performance Benchmarks

| Scenario                  | Target    | Acceptable | Alert  |
| ------------------------- | --------- | ---------- | ------ |
| Single item transaction   | 50ms      | 100ms      | >200ms |
| 5-item transaction        | 100ms     | 200ms      | >400ms |
| Split payment (3 methods) | 120ms     | 250ms      | >500ms |
| Peak hour (50 tx/min)     | <2sec avg | <5sec avg  | >10sec |

---

## Test Execution Strategy

### Phase 1: Unit Tests

```bash
npm test -- --testPathPattern="unit" --coverage
```

Expected: >90% coverage of utils and helpers

### Phase 2: Integration Tests

```bash
npm test -- --testPathPattern="integration" --coverage
```

Expected: All modules correctly integrated

### Phase 3: E2E Tests

```bash
npm test -- --testPathPattern="e2e" --coverage
```

Expected: Full workflows operational

### Continuous Integration

```bash
npm test -- --watch --coverage --onlyChanged
```

Run on every commit, report coverage

---

## Success Criteria

✓ All unit tests pass
✓ All integration tests pass
✓ All E2E tests pass
✓ Code coverage >85%
✓ No critical bugs found
✓ No data inconsistencies
✓ Performance within benchmarks
✓ Error handling comprehensive
✓ API response times acceptable
✓ Database integrity maintained

---

## Known Issues & Workarounds

### Issue 1: Decimal Precision

**Problem**: Floating point arithmetic can introduce precision errors
**Solution**: Always use Decimal type, convert only at display layer
**Test**: convertToNumber precision test

### Issue 2: Transaction Lock Timeout

**Problem**: Long-running transactions might timeout
**Solution**: Monitor transaction execution time, increase timeout if needed
**Test**: Performance benchmark suite

### Issue 3: Concurrent Transaction Conflicts

**Problem**: Multiple simultaneous transactions might conflict
**Solution**: Database serialization handles this, but verify performance
**Test**: Load testing with concurrent requests

---

## Documentation

All test files should include:

- Clear test names describing the scenario
- Setup/teardown with fixture data
- Assertions with meaningful messages
- Comments explaining complex logic

Example:

```typescript
it('should rollback all changes if stock check fails', async () => {
  // Setup: Record initial state
  const initialStock = await db.product.findUnique(...);
  const initialBalance = await db.customer.findUnique(...);

  // Execute: Attempt transaction with insufficient stock
  await expect(processIntegratedPOSTransaction({...}))
    .rejects.toThrow('Insufficient stock');

  // Assert: Verify complete rollback
  const finalStock = await db.product.findUnique(...);
  const finalBalance = await db.customer.findUnique(...);

  expect(finalStock).toEqual(initialStock);
  expect(finalBalance).toEqual(initialBalance);
});
```
