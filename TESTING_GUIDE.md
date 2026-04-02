# 🧪 Comprehensive Testing Guide

## Test Suite Overview

This guide provides systematic testing procedures for all POS, Reporting, and Advanced Features modules.

---

## Phase 1: Authentication & Authorization Testing

### Test 1.1: Login Flow
```bash
# Test valid credentials
POST /api/auth/signin
{
  "username": "admin",
  "password": "password"
}
Expected: 200 OK, session token in httpOnly cookie

# Test invalid credentials
POST /api/auth/signin
{
  "username": "admin",
  "password": "wrong"
}
Expected: 401 Unauthorized
```

### Test 1.2: Role-Based Access Control
```bash
# Test ADMIN access to protected route
GET /api/terminals
Headers: Cookie: next-auth.session-token=VALID_ADMIN_TOKEN
Expected: 200 OK, list of terminals

# Test CASHIER access to admin-only route
POST /api/terminals
Headers: Cookie: next-auth.session-token=VALID_CASHIER_TOKEN
{...}
Expected: 403 Forbidden
```

---

## Phase 2: POS Session Management Testing

### Test 2.1: Session Lifecycle
```javascript
// 1. Open Session
POST /api/pos-sessions
{
  "openingCashBalance": 5000,
  "terminalId": "POS-01"
}
Expected: 201 Created, session ID returned

// 2. Verify Active Session
GET /api/pos-sessions/active
Expected: 200 OK, returns current session

// 3. Get Session Details
GET /api/pos-sessions/{sessionId}
Expected: 200 OK, session details with all metrics

// 4. Close Session
PUT /api/pos-sessions/{sessionId}
{
  "closingCashAmount": 5500
}
Expected: 200 OK, variance calculated
```

### Test 2.2: Session Validation
```javascript
// Test: Cannot open multiple sessions for same cashier
POST /api/pos-sessions { openingCashBalance: 5000 }
// First request: 201 Created
// Second request: 409 Conflict
Expected: Error message about existing active session
```

---

## Phase 3: POS Payment Panel Testing

### Test 3.1: Payment Method Validation
```javascript
// Test: Cash Payment - Insufficient Amount
POST /api/transactions
{
  "paymentMethod": "CASH",
  "amount": 50,
  "orderTotal": 100
}
Expected: 400 Bad Request - "Insufficient amount"

// Test: Credit Payment - No Customer
POST /api/transactions
{
  "paymentMethod": "CREDIT",
  "amount": 100
}
Expected: 400 Bad Request - "Customer required for credit"

// Test: Card Payment - Exact Amount
POST /api/transactions
{
  "paymentMethod": "CARD",
  "amount": 100,
  "orderTotal": 100
}
Expected: 200 OK - Transaction created
```

### Test 3.2: UI Interaction Testing
```
1. Open POS Dashboard
   → Click "Process Payment"
   → Verify modal opens

2. Test Numeric Keypad
   → Click buttons 1,2,3,4,5
   → Verify displays "12345.00"
   → Verify change calculated correctly

3. Test Keyboard Input
   → Press 1,2,3,4,5,Enter
   → Verify same as numeric input
   → Test ESC to cancel

4. Test Payment Method Selector
   → Click each payment method
   → Verify appropriate inputs appear
   → Test customer selector for CREDIT

5. Test Validation Messages
   → Enter amount < order total (CASH)
   → Verify error appears
   → Verify confirm button disabled
```

---

## Phase 4: Day Book Testing

### Test 4.1: Day Book Operations
```javascript
// Open Day Book
POST /api/daybook
{
  "date": "2026-01-07",
  "openingCashBalance": 10000,
  "openingBankBalance": 50000
}
Expected: 201 Created

// Add Entry
POST /api/daybook/{dayBookId}/entries
{
  "entryType": "SALE",
  "amount": 500,
  "paymentMethod": "CASH",
  "description": "Sales"
}
Expected: 201 Created

// Close Day Book
PUT /api/daybook/{dayBookId}
{
  "closingCashAmount": 10500,
  "status": "CLOSED"
}
Expected: 200 OK, variance calculated

// Get Reconciliation
GET /api/daybook/{dayBookId}/reconcile
Expected: 200 OK, variance summary
```

### Test 4.2: Denomination Counting
```javascript
POST /api/daybook/{dayBookId}/reconcile
{
  "denominations": {
    "2000": 5,    // 5 × ₹2000 = ₹10,000
    "500": 10,    // 10 × ₹500 = ₹5,000
    "100": 25,    // 25 × ₹100 = ₹2,500
    "50": 10,     // 10 × ₹50 = ₹500
    "20": 5,      // 5 × ₹20 = ₹100
    "10": 5,      // 5 × ₹10 = ₹50
    "5": 2,       // 2 × ₹5 = ₹10
    "2": 5,       // 5 × ₹2 = ₹10
    "1": 20       // 20 × ₹1 = ₹20
  }
}
Expected: 200 OK, total = ₹18,190
```

---

## Phase 5: Reports & Analytics Testing

### Test 5.1: Daily Cashflow Report
```javascript
POST /api/reports
{
  "type": "DAILY_CASHFLOW",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-07T23:59:59Z"
}
Expected: 200 OK
{
  "data": [{
    "date": "2026-01-01",
    "openingBalance": 5000,
    "salesAmount": 45000,
    "expenses": 1000,
    "closingBalance": 48000,
    "variance": -1000,
    "paymentMethodBreakdown": {...}
  }]
}
```

### Test 5.2: Variance Analysis Report
```javascript
POST /api/reports
{
  "type": "VARIANCE_ANALYSIS",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-07T23:59:59Z"
}
Expected: 200 OK
{
  "data": {
    "totalExpectedAmount": 400000,
    "actualAmount": 399500,
    "variance": -500,
    "variancePercentage": -0.125,
    "variance_type": "SHORTAGE",
    "trend": "IMPROVING"
  }
}
```

### Test 5.3: Trend Analysis Report
```javascript
POST /api/reports
{
  "type": "TREND_ANALYSIS",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-07T23:59:59Z",
  "granularity": "DAILY"
}
Expected: 200 OK with trend data points
```

---

## Phase 6: Advanced POS Features Testing

### Test 6.1: Multi-Terminal Dashboard
```javascript
GET /api/terminals/dashboard
Expected: 200 OK
{
  "totalTerminals": 5,
  "onlineTerminals": 4,
  "totalActiveSessions": 3,
  "terminals": [{...}],
  "activeSessions": [{...}]
}
```

### Test 6.2: Terminal Registration
```javascript
POST /api/terminals
{
  "terminalId": "POS-02",
  "name": "Counter 2",
  "location": "Main Floor",
  "ipAddress": "192.168.1.102"
}
Expected: 201 Created, terminal registered
```

### Test 6.3: Shift Management
```javascript
// Open Shift
POST /api/shifts
{
  "terminalId": "terminal-uuid",
  "type": "MORNING",
  "openingBalance": 5000
}
Expected: 201 Created, shift opened

// Close Shift
PUT /api/shifts/{shiftId}
{
  "closingBalance": 5500,
  "notes": "Morning shift closed"
}
Expected: 200 OK, variance calculated
```

### Test 6.4: Receipt Generation
```javascript
POST /api/receipts
{
  "transactionId": "txn-uuid",
  "format": "THERMAL",
  "items": [{
    "productId": "prod-uuid",
    "productName": "Product Name",
    "quantity": 1,
    "unitPrice": 100,
    "tax": 18,
    "total": 118
  }],
  "subtotal": 100,
  "tax": 18,
  "discount": 0
}
Expected: 201 Created, receipt object returned
```

### Test 6.5: Refund Processing
```javascript
// Create Refund Request
POST /api/refunds
{
  "transactionId": "txn-uuid",
  "refundAmount": 100,
  "reason": "DEFECTIVE_PRODUCT",
  "notes": "Product was damaged"
}
Expected: 201 Created, refund status = PENDING

// Approve Refund (Admin only)
PUT /api/refunds/{refundId}
{
  "status": "APPROVED",
  "notes": "Approved - refund to card"
}
Expected: 200 OK, status updated
```

---

## Phase 7: Integration Testing

### Test 7.1: Complete POS Transaction Flow
```
1. Open session → 201 Created
2. Add products to cart
3. Click "Process Payment"
4. Select payment method (CASH)
5. Enter amount via keypad
6. Confirm payment
   ✓ Payment recorded
   ✓ Session totals updated
   ✓ Day book entry created
   ✓ Receipt generated
   ✓ Success notification shown
7. Verify session metrics updated
8. Check day book has new entry
```

### Test 7.2: End-to-End Reporting Flow
```
1. Process multiple transactions (various methods)
2. Close session
3. Generate daily cashflow report
4. Verify:
   ✓ All transactions included
   ✓ Payment method breakdown correct
   ✓ Totals accurate
   ✓ Charts render correctly
4. Generate variance analysis
5. Verify trend detection works
```

### Test 7.3: Multi-Terminal Flow
```
1. Register 3 terminals
2. Open sessions on 2 terminals
3. Process payments on both
4. View terminal dashboard
   ✓ All 3 terminals visible
   ✓ 2 show as active
   ✓ Sales totals correct
5. View individual terminal metrics
6. Verify payment breakdown
```

---

## Phase 8: Error Handling Testing

### Test 8.1: 400 Bad Request
```
- Missing required fields
- Invalid data types
- Out of range values
- Invalid enum values
```

### Test 8.2: 401 Unauthorized
```
- No authentication token
- Expired token
- Invalid token
```

### Test 8.3: 403 Forbidden
```
- Insufficient role permissions
- Attempting to modify another user's data
```

### Test 8.4: 404 Not Found
```
- Non-existent session
- Non-existent product
- Non-existent report
```

### Test 8.5: 409 Conflict
```
- Multiple active sessions
- Cannot close closed session
- Cannot refund beyond original amount
```

### Test 8.6: 500 Server Error
```
- Database connectivity issues
- Service layer errors
- Unexpected exceptions
```

---

## Performance Testing

### Test 9.1: Response Times
```
- GET /api/terminals/dashboard: < 200ms
- POST /api/transactions: < 500ms
- GET /api/reports: < 1000ms
- PUT /api/pos-sessions/{id}: < 300ms
```

### Test 9.2: Load Testing
```
- Concurrent sessions: 50+
- Concurrent transactions: 100+
- Concurrent report generations: 10+
```

### Test 9.3: Database Performance
```
- Session queries indexed on cashierId, status
- Day book queries indexed on date, status
- Transaction queries optimized
- No N+1 queries
```

---

## Security Testing

### Test 10.1: SQL Injection
```
POST /api/daybook
{
  "notes": "'; DROP TABLE daybook; --"
}
Expected: Zod validation prevents injection
```

### Test 10.2: XSS Prevention
```
- All user input sanitized
- Output properly escaped
- No raw HTML in responses
```

### Test 10.3: CSRF Protection
```
- NextAuth session tokens in httpOnly cookies
- CSRF tokens validated for state-changing operations
```

---

## Manual Testing Checklist

- [ ] POS dashboard loads without errors
- [ ] Payment panel opens on "Process Payment" click
- [ ] Numeric keypad responds to clicks and keyboard
- [ ] Payment validation works correctly
- [ ] Sessions persist across page reloads
- [ ] Day book entries visible after transaction
- [ ] Reports generate without errors
- [ ] Charts render correctly
- [ ] Terminal dashboard shows all terminals
- [ ] Multi-terminal session tracking accurate
- [ ] Refund workflow functions end-to-end
- [ ] Receipt prints/emails successfully
- [ ] All error messages user-friendly
- [ ] Mobile responsive design intact
- [ ] Accessibility features work (keyboard nav, screen readers)

---

## Continuous Integration Testing

Run these commands for complete validation:

```bash
# Type checking
npm run tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build

# Database migrations
npm run prisma:migrate dev

# Seed test data
npm run db:seed
```

---

## Test Data Setup

```bash
# Seed script creates:
- 5 test users (admin, accountant, cashier, etc.)
- 10 test products with categories
- 5 customers with credit limits
- 3 POS terminals
- 2 complete day books with entries
- Sample transactions
```

---

## Success Criteria

✅ All 100+ test cases pass  
✅ No TypeScript errors  
✅ No console errors in browser  
✅ All API endpoints return correct status codes  
✅ All validations working  
✅ All error cases handled gracefully  
✅ Performance benchmarks met  
✅ Security checks passed  
✅ Responsive on mobile/desktop  
✅ Accessibility standards met  

---

## Known Limitations

- Receipt printing requires browser print dialog
- Email sending requires SMTP configuration
- Multi-terminal sync may lag up to 5 seconds
- Offline mode not yet implemented
- PDF export coming in Phase 5D

---

## Support & Debugging

If tests fail:

1. Check database connection: `npm run db:push`
2. Regenerate Prisma client: `npm run prisma:generate`
3. Clear Next.js cache: `rm -rf .next`
4. Restart dev server: `npm run dev`
5. Check terminal logs for detailed error messages
6. Review database migrations: `npx prisma migrate status`

