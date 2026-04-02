# Customer Credit Management & Payment Tracking Feature

## 1. Executive Summary
A user-friendly credit management system to track customer purchases on credit, partial payments, and payment history. Integrated into the POS/ERP system with real-time balance updates and an intuitive ledger interface.

---

## 2. Feature Overview

### Core Capabilities
- ✅ Track purchases on credit (linked to sales orders)
- ✅ Record partial/full payments
- ✅ View customer credit balance & history
- ✅ Payment status tracking (Pending, Partial, Overdue, Settled)
- ✅ Customer credit ledger with detailed transaction history
- ✅ Easy payment interface with multiple payment methods
- ✅ Reports: Outstanding credit, payment history, overdue customers

---

## 3. Database Schema

### New Models Required

```prisma
// Customer Credit Account Summary
model CustomerCredit {
  id                    String   @id @default(cuid())
  customerId            String   @unique
  customer              Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  // Credit metrics
  totalCreditAmount     Decimal  @default(0)  // Total amount given on credit
  totalPaidAmount       Decimal  @default(0)  // Total amount paid
  outstandingBalance    Decimal  @default(0)  // totalCreditAmount - totalPaidAmount
  
  // Status tracking
  status                CreditStatus  @default(ACTIVE)  // ACTIVE, OVERDUE, SETTLED, CLOSED
  creditLimit           Decimal?      // Max credit limit (optional)
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  transactions          CreditTransaction[]
  payments              CreditPayment[]
  
  @@index([customerId])
  @@index([status])
}

// Individual Credit Transaction (purchase on credit)
model CreditTransaction {
  id                    String   @id @default(cuid())
  
  // Relations
  customerId            String
  customer              Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerCredit        CustomerCredit @relation(fields: [customerId], references: [customerId], onDelete: Cascade)
  
  salesOrderId          String?        // Link to actual sale
  salesOrder            SalesOrder?    @relation(fields: [salesOrderId], references: [id])
  
  // Transaction details
  amount                Decimal
  description           String?
  type                  TransactionType  @default(CREDIT_SALE)  // CREDIT_SALE, ADJUSTMENT, INTEREST
  referenceNumber       String?          // Invoice/Receipt number
  
  // User tracking
  createdByUserId       String?
  createdBy             User?   @relation(fields: [createdByUserId], references: [id])
  
  createdAt             DateTime @default(now())
  
  @@index([customerId])
  @@index([salesOrderId])
  @@index([createdAt])
}

// Credit Payment (payment against credit)
model CreditPayment {
  id                    String   @id @default(cuid())
  
  // Relations
  customerId            String
  customer              Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerCredit        CustomerCredit @relation(fields: [customerId], references: [customerId], onDelete: Cascade)
  
  // Payment details
  amount                Decimal
  paymentMethod         PaymentMethod  // CASH, CHEQUE, BANK_TRANSFER, CARD, UPI
  referenceNumber       String?        // Cheque no, transaction ID, etc.
  notes                 String?
  
  // Status
  status                PaymentStatus  @default(RECORDED)  // RECORDED, VERIFIED, FAILED
  
  // User tracking
  recordedByUserId      String?
  recordedBy            User?   @relation(fields: [recordedByUserId], references: [id])
  
  createdAt             DateTime @default(now())
  verifiedAt            DateTime?
  
  @@index([customerId])
  @@index([createdAt])
  @@index([status])
}

enum CreditStatus {
  ACTIVE      // Has outstanding balance
  PARTIAL     // Some paid, some pending
  OVERDUE     // Payment overdue
  SETTLED     // Fully paid
  CLOSED      // Account closed
}

enum TransactionType {
  CREDIT_SALE   // Purchase on credit
  ADJUSTMENT    // Manual adjustment
  INTEREST      // Late payment interest
  REVERSAL      // Reversed transaction
}

enum PaymentMethod {
  CASH
  CHEQUE
  BANK_TRANSFER
  CARD
  UPI
  OTHER
}

enum PaymentStatus {
  RECORDED      // Recorded but not verified
  VERIFIED      // Payment verified
  FAILED        // Payment failed/cancelled
}
```

### Updated Customer Model
```prisma
model Customer {
  // ... existing fields ...
  
  // Credit relations
  credit              CustomerCredit?
  creditTransactions  CreditTransaction[]
  creditPayments      CreditPayment[]
}
```

---

## 4. API Endpoints

### Credit Management
```
GET    /api/customers/{id}/credit              - Get customer credit summary
GET    /api/customers/{id}/credit/ledger       - Get detailed credit ledger/transactions
GET    /api/customers/{id}/credit/payments     - Get payment history
POST   /api/customers/{id}/credit/payments     - Record a payment
```

### Credit Reports
```
GET    /api/reports/outstanding-credit        - List customers with outstanding balance
GET    /api/reports/overdue-credit            - List overdue accounts
GET    /api/reports/credit-summary            - Credit statistics dashboard
```

---

## 5. UI/UX Design

### Page: Customer Credit Dashboard (`/dashboard/credit`)
**Purpose**: Overview of all customers and their credit status

**Layout**:
```
┌─────────────────────────────────────────────┐
│  Customer Credit Management                  │
├─────────────────────────────────────────────┤
│ [Filters] [Export] [Reports]                 │
├─────────────────────────────────────────────┤
│ Card Grid:                                   │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Active       │  │ Overdue      │         │
│  │ 15 Accounts  │  │ 3 Accounts   │         │
│  │ ₹45,000      │  │ ₹8,500       │         │
│  └──────────────┘  └──────────────┘         │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Total Credit │  │ Total Paid   │         │
│  │ ₹125,000     │  │ ₹80,000      │         │
│  └──────────────┘  └──────────────┘         │
├─────────────────────────────────────────────┤
│ Table: Customer Credit List                  │
│ ┌────┬──────────┬─────────┬─────────┬───┐  │
│ │ ID │ Customer │ Credit  │ Paid    │ OS│  │
│ ├────┼──────────┼─────────┼─────────┼───┤  │
│ │ 1  │ Raj Puri │ ₹5,000  │ ₹2,000  │●●●│  │
│ │ 2  │ Priya    │ ₹3,500  │ ₹0      │🔴  │  │
│ │ 3  │ Arjun    │ ₹10,000 │ ₹10,000 │✓  │  │
│ └────┴──────────┴─────────┴─────────┴───┘  │
└─────────────────────────────────────────────┘
```

### Page: Customer Credit Details (`/dashboard/credit/{customerId}`)
**Purpose**: Detailed view of single customer's credit account

**Layout - 3 Sections**:

#### Section 1: Credit Summary Card
```
┌─────────────────────────────────────┐
│ Raj Puri (raj@gmail.com)            │
├─────────────────────────────────────┤
│ Total Credit Given:    ₹5,000       │
│ Amount Paid:           ₹2,000       │
│ Outstanding Balance:   ₹3,000  🔴   │
│ Status:                PARTIAL      │
│ Credit Limit:          ₹10,000      │
├─────────────────────────────────────┤
│ Created: Jan 15, 2026 | Updated: Today│
│ Last Payment: 3 days ago            │
└─────────────────────────────────────┘
```

#### Section 2: Quick Payment Panel
```
┌─────────────────────────────────────┐
│ Make Payment                        │
├─────────────────────────────────────┤
│ Outstanding: ₹3,000                 │
│                                     │
│ Amount: [___________] ₹            │
│ Payment Method: [Dropdown: Cash ▼]  │
│ Reference No: [___________]         │
│ Notes: [___________]                │
│                                     │
│ [Record Payment]  [Cancel]          │
└─────────────────────────────────────┘
```

#### Section 3: Credit Ledger (Transaction History)
```
┌─────────────────────────────────────────────────────┐
│ Transaction History                [Export] [Print]  │
├─────────────────────────────────────────────────────┤
│ Date      │ Type    │ Ref     │ Amount   │ Balance  │
├───────────┼─────────┼─────────┼──────────┼──────────┤
│ Today     │ Payment │ REC-001 │ -500 ✓   │ 2,500    │
│ 3d ago    │ Payment │ REC-002 │ -1,500 ✓ │ 3,000    │
│ 5d ago    │ Sale    │ INV-245 │ +5,000   │ 4,500    │
│ Jan 15    │ Sale    │ INV-244 │ +500     │ -500     │
└─────────────────────────────────────────────────────┘
```

### Modal: Record Payment
```
┌──────────────────────────────────┐
│  Record Payment                   │
├──────────────────────────────────┤
│ Customer: Raj Puri               │
│ Outstanding: ₹3,000              │
│                                  │
│ Amount: [__________] ₹           │
│ □ Full Payment (₹3,000)          │
│                                  │
│ Payment Method:                  │
│ ○ Cash                           │
│ ○ Cheque  [Check No: ______]     │
│ ○ Bank Transfer [TXN: ______]    │
│ ○ Card [Last 4: ___]             │
│                                  │
│ Notes: [________________]         │
│                                  │
│ [Save] [Cancel]                  │
└──────────────────────────────────┘
```

### Page: Credit Reports (`/dashboard/reports/credit`)
**Purpose**: Credit analytics and reporting

**Sections**:
1. **Outstanding Credit Summary**
   - Total outstanding: ₹XX,XXX
   - Number of customers: X
   - Average outstanding per customer: ₹X,XXX

2. **Overdue Customers**
   ```
   | Customer | Outstanding | Days Overdue | Last Payment |
   |----------|-------------|--------------|--------------|
   | Priya    | ₹3,500      | 30 days      | Jan 1        |
   ```

3. **Payment Trends** (Chart)
   - Daily/Weekly/Monthly payment received
   - Collection rate trend

4. **Customer Credit Tiers**
   ```
   | ₹0-5K      | 8 customers | ₹20,000 total |
   | ₹5-10K     | 5 customers | ₹35,000 total |
   | ₹10K+      | 2 customers | ₹25,000 total |
   ```

---

## 6. Key Features

### 1. Sales Order Integration
- When creating sales order → Option: "Save on Credit"
- Automatically creates CreditTransaction
- Updates CustomerCredit balance

### 2. Smart Payment Recording
- Quick-select: Full payment / Partial payment
- Auto-calculate remaining balance
- Multiple payment methods support
- Payment verification workflow (optional)

### 3. Credit Status Management
- **ACTIVE** → PARTIAL → SETTLED (on full payment)
- **OVERDUE** flag if payment due date passes
- Auto-status updates based on payment records

### 4. Dashboard Widget
Show on `/dashboard` main page:
```
Outstanding Credit at a Glance
┌──────────────────────────────┐
│ Total Outstanding: ₹45,000   │
│ Active Accounts: 15          │
│ Overdue: 3                   │
│ [View Full Report →]         │
└──────────────────────────────┘
```

### 5. Reports & Exports
- **Outstanding Credit Report** (CSV/PDF)
- **Customer Credit Statement** (for customer)
- **Overdue Accounts Report** (for collection tracking)
- **Credit Payment Register** (daily/monthly)

---

## 7. Workflow Examples

### Scenario 1: Purchase on Credit
```
1. Sales Order Created
   Customer: "Raj Puri"
   Items: Milk (₹500), Bread (₹200)
   Total: ₹700
   
2. When saving → Select "Save on Credit"
   
3. Automatically:
   - Creates CreditTransaction (₹700)
   - Updates CustomerCredit:
     * totalCreditAmount = ₹5,700
     * outstandingBalance = ₹3,700
   - Status updates to PARTIAL/ACTIVE
```

### Scenario 2: Partial Payment
```
1. Customer: "Raj Puri" | Outstanding: ₹3,000

2. Go to Customer Credit Details
   
3. Click "Make Payment"
   - Enter: ₹1,000
   - Method: Cash
   - Reference: CASH-001
   
4. System:
   - Creates CreditPayment
   - Updates CustomerCredit:
     * totalPaidAmount = ₹3,000
     * outstandingBalance = ₹2,000
   - Updates CreditTransaction records
```

### Scenario 3: View Credit History
```
1. Navigate: /dashboard/credit/{customerId}

2. See complete ledger:
   - All credit sales
   - All payments made
   - Running balance
   - Payment verification status
```

---

## 8. Implementation Steps

### Phase 1: Database & API (Week 1)
- [ ] Create Prisma migrations for new models
- [ ] Create services: `credit.service.ts`, `payment.service.ts`
- [ ] Create API routes:
  - `/api/customers/{id}/credit`
  - `/api/customers/{id}/credit/payments`
  - `/api/reports/outstanding-credit`

### Phase 2: Core Pages (Week 2)
- [ ] `/dashboard/credit` - Credit dashboard
- [ ] `/dashboard/credit/{customerId}` - Customer credit details
- [ ] Components: CreditSummaryCard, PaymentRecorder, TransactionTable

### Phase 3: Integration (Week 2)
- [ ] Link sales order form to credit system
- [ ] Add "Save on Credit" option to sales order
- [ ] Update CustomerCredit when sales created/deleted

### Phase 4: Reports (Week 3)
- [ ] `/dashboard/reports/credit` - Credit reports page
- [ ] Export functionality (CSV/PDF)
- [ ] Dashboard widget for main dashboard

### Phase 5: Polish (Week 3)
- [ ] Test credit workflows end-to-end
- [ ] Add notifications (overdue alerts, etc.)
- [ ] Mobile-friendly UI adjustments

---

## 9. Benefits

✅ **Easy Credit Tracking** - Know exactly who owes what
✅ **Quick Payments** - Record payments in 30 seconds
✅ **Transparency** - Customers see their transaction history
✅ **Cash Flow Management** - Track outstanding credit
✅ **Overdue Alerts** - Don't miss due payments
✅ **Audit Trail** - Every transaction recorded with user
✅ **Multi-Method Payments** - Support all payment types
✅ **Professional Reports** - Export for accounting

---

## 10. User Personas

| Role | Task | Frequency |
|------|------|-----------|
| **Shopkeeper** | Record credit sales, track payments | Daily |
| **Cashier** | Record customer payments | Daily |
| **Manager** | View outstanding credit, follow-up on overdue | Weekly |
| **Accountant** | Export reports, reconcile accounts | Monthly/Quarterly |
| **Customer** | View credit statement, know balance | As needed |

---

## 11. Next Steps

Would you like me to:
1. ✅ **Proceed with implementation** - Start with database schema + API
2. 📊 **Create visual mockups** - More detailed UI designs
3. 🔍 **Refine the design** - Adjust based on your feedback
4. 📋 **Create detailed specifications** - For each component

**What would be most helpful?**
