# Customer Credit Management System - Complete Design v2.0

## 1. Executive Summary
A comprehensive credit management system for grocery shops with payment tracking, credit limits, due dates, automatic late fees, bulk operations, and return handling. Designed for ease of use with POS integration.

---

## 2. Feature Overview

### Core Features
✅ Track purchases on credit (linked to sales orders)
✅ Record partial/full payments
✅ View customer credit balance & history
✅ Payment status tracking (Pending, Partial, Overdue, Settled)
✅ Customer credit ledger with detailed transaction history

### Enhanced Features
✅ **Payment Due Dates** - Set terms, auto-calculate due dates, overdue detection
✅ **Credit Limit Enforcement** - Set limits, block exceeded sales, show warnings
✅ **Return/Refund Handling** - Reverse credit on returns, automatic balance adjustment
✅ **Bulk Payment Recording** - Record multiple payments at once, batch processing
✅ **Quick Payment on POS** - Show outstanding during checkout, quick payment option
✅ **Payment Reminders** - Auto SMS/Email, escalating notices, delivery tracking
✅ **Late Fees/Interest** - Auto-calculation, compound interest, customizable rates

### Reports & Analytics
✅ Outstanding credit dashboard
✅ Overdue accounts report
✅ Collection rate analysis
✅ Customer credit tiers
✅ Late fee tracking

---

## 3. Enhanced Database Schema

### New Models Required

```prisma
enum CreditStatus {
  ACTIVE      // Has outstanding balance
  PARTIAL     // Some paid, some pending
  OVERDUE     // Payment overdue
  SETTLED     // Fully paid
  CLOSED      // Account closed
}

enum PaymentTerms {
  IMMEDIATE   // Due immediately
  NET_7       // Due in 7 days
  NET_15      // Due in 15 days
  NET_30      // Due in 30 days
  NET_60      // Due in 60 days
  END_OF_MONTH // Due at end of month
  CUSTOM      // Custom days
}

enum TransactionType {
  CREDIT_SALE     // Purchase on credit
  PAYMENT         // Payment received
  ADJUSTMENT      // Manual adjustment
  INTEREST        // Late payment interest
  REFUND          // Refund/Return
  REVERSAL        // Reversed transaction
}

enum PaymentStatus {
  PENDING         // Awaiting payment
  PARTIALLY_PAID  // Some amount received
  FULLY_PAID      // Complete payment
  OVERDUE         // Past due date
  CANCELLED       // Cancelled transaction
}

enum ReminderType {
  FIRST_NOTICE    // First reminder
  SECOND_NOTICE   // Second reminder  
  URGENT_NOTICE   // Urgent/final notice
}

enum ReminderStatus {
  SCHEDULED   // Scheduled to send
  SENT        // Successfully sent
  FAILED      // Failed to send
  READ        // Customer read (if digital)
}

// Customer Credit Account Summary
model CustomerCredit {
  id                    String   @id @default(cuid())
  customerId            String   @unique
  customer              Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  // Credit metrics
  totalCreditAmount     Decimal  @default(0)  // Total amount given on credit
  totalPaidAmount       Decimal  @default(0)  // Total amount paid
  outstandingBalance    Decimal  @default(0)  // totalCreditAmount - totalPaidAmount
  
  // Credit limit & terms
  creditLimit           Decimal?      // Max credit limit
  paymentTerms          PaymentTerms  @default(NET_30)
  customPaymentDays     Int?          // If CUSTOM, number of days
  
  // Late fees
  interestRate          Decimal?      @db.Decimal(5, 2) // Annual interest rate as percentage
  lateFeePercentage     Decimal?      @db.Decimal(5, 2) // Percentage of overdue amount
  lateFeeFixed          Decimal?      @db.Decimal(12, 2) // Fixed amount per overdue period
  totalInterestCharged  Decimal       @default(0)  // Total interest applied
  totalLateFees         Decimal       @default(0)  // Total late fees applied
  
  // Status tracking
  status                CreditStatus  @default(ACTIVE)
  lastPaymentDate       DateTime?
  lastTransactionDate   DateTime?
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  transactions          CreditTransaction[]
  payments              CreditPayment[]
  reminders             PaymentReminder[]
  interestEntries       InterestEntry[]
  
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
  
  salesOrderId          String?
  salesOrder            SalesOrder?    @relation(fields: [salesOrderId], references: [id])
  
  // Transaction details
  amount                Decimal
  amountPaid            Decimal       @default(0)
  amountPending         Decimal       // amount - amountPaid
  description           String?
  type                  TransactionType  @default(CREDIT_SALE)
  referenceNumber       String?
  
  // Due date tracking
  dueDate               DateTime?      // When payment is due
  isOverdue             Boolean        @default(false)
  daysOverdue           Int            @default(0)
  
  // Status
  status                PaymentStatus  @default(PENDING)
  
  // User tracking
  createdByUserId       String?
  createdBy             User?          @relation(fields: [createdByUserId], references: [id])
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([customerId])
  @@index([salesOrderId])
  @@index([dueDate])
  @@index([status])
  @@index([createdAt])
}

// Credit Payment
model CreditPayment {
  id                    String   @id @default(cuid())
  
  // Relations
  customerId            String
  customer              Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerCredit        CustomerCredit @relation(fields: [customerId], references: [customerId], onDelete: Cascade)
  
  // Which transaction(s) this payment is for
  transactionIds        String[]  // JSON array of CreditTransaction IDs being paid
  
  // Payment details
  amount                Decimal
  paymentMethod         String  // CASH, CHEQUE, BANK_TRANSFER, CARD, UPI, DIGITAL_WALLET
  referenceNumber       String?
  notes                 String?
  
  // Status
  status                PaymentStatus  @default(PENDING)
  
  // User tracking
  recordedByUserId      String?
  recordedBy            User?          @relation(fields: [recordedByUserId], references: [id])
  
  createdAt             DateTime @default(now())
  verifiedAt            DateTime?
  
  @@index([customerId])
  @@index([createdAt])
  @@index([status])
}

// Late Fee / Interest Tracking
model InterestEntry {
  id                    String   @id @default(cuid())
  
  customerCreditId      String
  customerCredit        CustomerCredit @relation(fields: [customerCreditId], references: [customerCredit], onDelete: Cascade)
  
  // Which overdue transaction triggered this
  transactionId         String?
  
  // Interest details
  amount                Decimal  @db.Decimal(12, 2)
  type                  String   @default("INTEREST") // INTEREST, LATE_FEE
  calculationBasis      String   // "DAILY", "MONTHLY", "FIXED"
  applicableFromDate    DateTime
  
  status                String   @default("PENDING") // PENDING, COLLECTED, WAIVED
  
  createdAt             DateTime @default(now())
  collectedDate         DateTime?
  
  @@index([customerCreditId])
}

// Return / Refund Transactions
model CreditRefund {
  id                    String   @id @default(cuid())
  
  customerId            String
  customer              Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerCredit        CustomerCredit @relation(fields: [customerId], references: [customerCredit], onDelete: Cascade)
  
  // Original transaction being reversed
  creditTransactionId   String
  creditTransaction     CreditTransaction @relation(fields: [creditTransactionId], references: [id])
  
  // Return details
  reason                String
  amount                Decimal
  notes                 String?
  
  // Status
  status                String   @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedByUserId      String?
  approvedBy            User?    @relation(fields: [approvedByUserId], references: [id])
  
  createdAt             DateTime @default(now())
  approvedAt            DateTime?
  
  @@index([customerId])
  @@index([creditTransactionId])
}

// Payment Reminders
model PaymentReminder {
  id                    String   @id @default(cuid())
  
  customerCreditId      String
  customerCredit        CustomerCredit @relation(fields: [customerCreditId], references: [customerCredit], onDelete: Cascade)
  
  customerId            String
  customer              Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  // Reminder details
  type                  ReminderType
  amountDue             Decimal
  daysOverdue           Int
  
  // Delivery
  deliveryMethod        String   @default("SMS") // SMS, EMAIL, BOTH
  phoneNumber           String?
  emailAddress          String?
  
  // Status
  status                ReminderStatus @default(SCHEDULED)
  scheduledFor          DateTime
  sentAt                DateTime?
  readAt                DateTime?
  
  // Response tracking
  acknowledged          Boolean  @default(false)
  acknowledgmentDate    DateTime?
  
  createdAt             DateTime @default(now())
  
  @@index([customerCreditId])
  @@index([status])
  @@index([daysOverdue])
}

// Bulk Payment Operation Record
model BulkPaymentBatch {
  id                    String   @id @default(cuid())
  
  // Batch details
  batchName             String?
  totalAmount           Decimal
  totalRecords          Int
  
  // User who created
  createdByUserId       String
  createdBy             User          @relation(fields: [createdByUserId], references: [id])
  
  // Status
  status                String   @default("CREATED") // CREATED, PROCESSING, COMPLETED
  
  // Records in this batch
  payments              CreditPayment[]
  
  createdAt             DateTime @default(now())
  completedAt           DateTime?
  
  @@index([createdByUserId])
  @@index([status])
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
  creditRefunds       CreditRefund[]
  paymentReminders    PaymentReminder[]
}

model User {
  // ... existing fields ...
  
  // Credit relations
  creditTransactionsCreated CreditTransaction[]    @relation("CreatedBy")
  creditPaymentsRecorded    CreditPayment[]        @relation("RecordedBy")
  creditRefundsApproved     CreditRefund[]         @relation("ApprovedBy")
  bulkPaymentBatches        BulkPaymentBatch[]
}
```

---

## 4. API Endpoints

### Customer Credit Management
```
GET    /api/customers/{id}/credit              - Get customer credit summary
GET    /api/customers/{id}/credit/balance      - Get current balance
GET    /api/customers/{id}/credit/ledger       - Get detailed transactions
GET    /api/customers/{id}/credit/payments     - Get payment history
POST   /api/customers/{id}/credit/payments     - Record single payment
POST   /api/customers/{id}/credit/refunds      - Record refund
PUT    /api/customers/{id}/credit/terms        - Update payment terms
```

### Bulk Operations
```
POST   /api/credit/bulk-payments               - Record multiple payments
GET    /api/credit/bulk-payments/{batchId}    - Get batch details
POST   /api/credit/bulk-reminders              - Send batch reminders
```

### Late Fees & Interest
```
POST   /api/customers/{id}/credit/apply-interest    - Calculate & apply interest
GET    /api/customers/{id}/credit/interest-history  - Get interest charges
POST   /api/customers/{id}/credit/interest/waive    - Waive interest charges
```

### Reminders
```
POST   /api/credit/reminders/{id}/send         - Send specific reminder
GET    /api/credit/reminders/pending           - Get pending reminders
PUT    /api/credit/reminders/{id}/acknowledge  - Mark as acknowledged
```

### Reports
```
GET    /api/reports/outstanding-credit        - List outstanding accounts
GET    /api/reports/overdue-credit            - List overdue accounts
GET    /api/reports/credit-summary            - Credit statistics
GET    /api/reports/collection-analysis       - Collection trends
GET    /api/reports/customer-statement        - Customer statement PDF
```

---

## 5. UI/UX Design

### Page: Customer Credit Dashboard (`/dashboard/credit`)

**Top Metrics Cards:**
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total Credit │  │ Overdue      │  │ Collection   │
│ ₹2,45,000    │  │ ₹35,000      │  │ Rate: 85%    │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Filters & Actions:**
```
[Search Customer] [Status: All ▼] [Sort: Latest ▼]
[Bulk Payment] [Send Reminders] [Export] [Reports]
```

**Customer List Table:**
```
┌────┬──────────────┬──────────┬────────┬───────────┬──────────┐
│    │ Customer     │ Credit   │ Paid   │ Outstand  │ Due Date │
├────┼──────────────┼──────────┼────────┼───────────┼──────────┤
│ □  │ Raj Puri     │ ₹5,000   │ ₹2,000 │ ₹3,000    │ Today 🔴 │
│ □  │ Priya        │ ₹3,500   │ ₹0     │ ₹3,500    │ 5d ago   │
│ □  │ Arjun        │ ₹10,000  │ ₹10,000│ ₹0        │ Settled  │
└────┴──────────────┴──────────┴────────┴───────────┴──────────┘
```

---

### Page: Customer Credit Details (`/dashboard/credit/{customerId}`)

**Section 1: Credit Summary Card (Enhanced)**
```
┌──────────────────────────────────────┐
│ Raj Puri (raj@gmail.com)             │
├──────────────────────────────────────┤
│ Total Credit Given:    ₹5,000        │
│ Amount Paid:           ₹2,000        │
│ Outstanding Balance:   ₹3,000  🔴    │
│ Status:                OVERDUE       │
│ Credit Limit:          ₹10,000       │
│                                      │
│ Payment Terms:         NET 15 Days   │
│ Next Due Date:         April 5       │
│ Days Overdue:          6 Days        │
│                                      │
│ Late Fees Charged:     ₹150          │
│ Interest Applied:      ₹75           │
│                                      │
│ Last Payment:          3 days ago    │
│ Last Transaction:      Today         │
└──────────────────────────────────────┘
```

**Section 2: Quick Actions Panel**
```
┌──────────────────────────────────────┐
│ Quick Actions                        │
├──────────────────────────────────────┤
│ [Record Payment]  [Request Return]   │
│ [Send Reminder]   [Adjust Terms]     │
│ [View Statement]  [Waive Fees]       │
└──────────────────────────────────────┘
```

**Section 3: Payment Panel (Enhanced)**
```
┌──────────────────────────────────────┐
│ Record Payment                       │
├──────────────────────────────────────┤
│ Outstanding: ₹3,000 (6 days overdue) │
│                                      │
│ Amount: [___________] ₹              │
│ □ Full Payment (₹3,000 + ₹225 fees)  │
│                                      │
│ Payment Method:                      │
│ ○ Cash   ○ Cheque  ○ Bank Transfer   │
│ ○ Card   ○ UPI     ○ Digital Wallet  │
│                                      │
│ Reference: [___________]             │
│ Notes: [___________]                 │
│                                      │
│ □ Waive late fees (if approved)      │
│                                      │
│ [Record Payment]  [Cancel]           │
└──────────────────────────────────────┘
```

**Section 4: Transaction Ledger (Enhanced)**
```
┌─────────────────────────────────────────────────────────┐
│ Transaction History                [Export] [Print]     │
├─────────────────────────────────────────────────────────┤
│ Date   │ Type      │ Amount   │ Due Date │ Status      │
├────────┼───────────┼──────────┼──────────┼─────────────┤
│ Today  │ Sale      │ +₹500    │ Apr 15   │ Pending 🔴  │
│ 3d ago │ Payment   │ -₹1,500  │ -        │ Received ✓  │
│ 3d ago │ Late Fee  │ +₹75     │ Apr 5    │ Overdue     │
│ 5d ago │ Interest  │ +₹25     │ -        │ Applied     │
│ 1w ago │ Sale      │ +₹4,500  │ Apr 1    │ Overdue 🔴  │
└─────────────────────────────────────────────────────────┘
```

---

### Page: Bulk Payment Recording (`/dashboard/credit/bulk-payment`)

**Batch Creation Interface:**
```
┌────────────────────────────────────────────────┐
│ Bulk Payment Recording                         │
├────────────────────────────────────────────────┤
│ Batch Name: [My Payment Batch     ]            │
│                                                │
│ Add Customers:                                 │
│ ┌─────────────────────────────────────────┐  │
│ │ Customer Name OR Contact                 │  │
│ │ [Type to search...]                      │  │
│ └─────────────────────────────────────────┘  │
│                                                │
│ Batch Items:                                   │
│ ┌────┬──────────┬──────────┬───────────────┐  │
│ │    │ Customer │ Amount   │ Method        │  │
│ ├────┼──────────┼──────────┼───────────────┤  │
│ │ □  │ Raj      │ ₹1,500   │ Cash          │  │
│ │ □  │ Priya    │ ₹2,000   │ Bank Transfer │  │
│ │ □  │ Arjun    │ ₹500     │ Card          │  │
│ └────┴──────────┴──────────┴───────────────┘  │
│                                                │
│ Total Amount: ₹4,000 (3 customers)             │
│                                                │
│ [+ Add More] [Save Batch] [Process Batch]     │
└────────────────────────────────────────────────┘
```

---

### Page: Return/Refund Request (`/dashboard/credit/{customerId}/return`)

```
┌────────────────────────────────────────────┐
│ Request Refund                             │
├────────────────────────────────────────────┤
│ Customer: Raj Puri                         │
│ Outstanding Balance: ₹3,000                │
│                                            │
│ Select Transaction to Return:               │
│ ○ Sale INV-245: ₹5,000 (5d ago)            │
│ ○ Sale INV-244: ₹500 (1w ago)              │
│                                            │
│ Refund Amount: [_________] ₹               │
│ Reason: [Select: Damaged ▼]                │
│ Notes: [_________________________]         │
│                                            │
│ Requires Approval: YES                     │
│ Approver: [Select Manager ▼]               │
│                                            │
│ Effect on Credit:                          │
│ New Outstanding: ₹2,000 (if approved)      │
│                                            │
│ [Submit Request] [Cancel]                  │
└────────────────────────────────────────────┘
```

---

### Page: Payment Reminders (`/dashboard/credit/reminders`)

**Reminder Management:**
```
┌──────────────────────────────────────────────┐
│ Payment Reminders                            │
├──────────────────────────────────────────────┤
│ [Send Batch Reminders] [Reminder Settings]  │
├──────────────────────────────────────────────┤
│ Pending Reminders: 15                        │
│                                              │
│ ┌────┬──────────┬─────────┬──────────────┐  │
│ │ ID │ Customer │ Amount  │ Type         │  │
│ ├────┼──────────┼─────────┼──────────────┤  │
│ │ 1  │ Raj      │ ₹3,000  │ First Notice │  │
│ │ 2  │ Priya    │ ₹3,500  │ 2nd Notice   │  │
│ │ 3  │ Arjun    │ ₹500    │ Urgent       │  │
│ └────┴──────────┴─────────┴──────────────┘  │
│                                              │
│ Sent Reminders: 45                           │
│ Failed: 2 (retry)                            │
│ Acknowledged: 20                             │
└──────────────────────────────────────────────┘
```

---

### Page: Credit Analytics & Reports (`/dashboard/reports/credit`)

**Dashboard Metrics:**
```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Total Credit   │  │ Collection %   │  │ Avg Days to    │
│ ₹5,50,000      │  │ 78%            │  │ Collect: 18    │
└────────────────┘  └────────────────┘  └────────────────┘

┌────────────────────────────────────────────────────────┐
│ Collection Trend (30 days)                             │
│ ████ ████ ███░ ░░░░ █████ ░░░░ (Line chart)           │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Customer Credit Tiers                                  │
│ Green (0-5K):   15 customers | ₹45,000      | 82% paid │
│ Yellow (5-10K):  8 customers | ₹65,000      | 75% paid │
│ Red (10K+):      3 customers | ₹40,000      | 60% paid │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Overdue Summary                                        │
│ 0-7 days:    5 customers | ₹8,500                     │
│ 8-15 days:   3 customers | ₹12,000                    │
│ 16-30 days:  2 customers | ₹9,500                     │
│ 30+ days:    1 customer  | ₹5,000                     │
└────────────────────────────────────────────────────────┘
```

---

## 6. Complete Feature List

### A. Core Credit Tracking
- [x] Create credit on sales order
- [x] View outstanding balance
- [x] Transaction history/ledger
- [x] Record payments (single or bulk)
- [x] Auto-calculate due dates based on terms

### B. Credit Limits & Enforcement
- [x] Set credit limit per customer
- [x] Block sales if limit exceeded
- [x] Warning when approaching limit
- [x] Alert dashboard widget

### C. Payment Terms
- [x] Flexible terms (NET_7, NET_15, NET_30, NET_60, END_OF_MONTH, CUSTOM)
- [x] Auto-calculate due dates
- [x] Update terms per customer
- [x] Overdue detection & tracking

### D. Late Fees & Interest
- [x] Configurable annual interest rate
- [x] Automatic interest calculation
- [x] Fixed late fees option
- [x] Percentage-based late charges
- [x] Compound interest calculation
- [x] Manual waiver capability

### E. Return/Refund Handling
- [x] Record product returns
- [x] Auto-reverse credit transactions
- [x] Adjust outstanding balance
- [x] Approval workflow for refunds
- [x] Audit trail of all returns

### F. Payment Recording
- [x] Single payment input
- [x] Bulk payment recording
- [x] Multiple payment methods (Cash, Cheque, Bank, Card, UPI, Wallet)
- [x] Automatic balance updates
- [x] Payment verification
- [x] Batch processing

### G. Payment Reminders
- [x] Auto-schedule reminders (1st, 2nd, urgent)
- [x] SMS delivery
- [x] Email delivery
- [x] Both SMS + Email options
- [x] Track send status
- [x] Receipt acknowledgment
- [x] Escalating reminder sequence

### H. POS Integration
- [x] Show outstanding balance at checkout
- [x] Quick "Add to Credit" option
- [x] Quick payment on POS
- [x] Block sale if limit exceeded
- [x] Warning message to cashier

### I. Reporting & Analytics
- [x] Outstanding credit dashboard
- [x] Overdue accounts report
- [x] Collection rate analysis
- [x] Customer credit tiers
- [x] Late fee summary
- [x] Interest charged report
- [x] Collection trends
- [x] Customer statement PDF
- [x] Export capabilities

### J. Account Management
- [x] View credit summary
- [x] Update payment terms
- [x] Adjust credit limit
- [x] Close/reopen account
- [x] Waive fees/interest
- [x] Transaction search & filter

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database schema with all models
- [ ] Zod validation schemas
- [ ] Type definitions
- [ ] Service layer (credit.service.ts)

### Phase 2: Core API (Week 1-2)
- [ ] Credit CRUD endpoints
- [ ] Payment recording endpoints
- [ ] Balance calculation endpoints
- [ ] Query/filter endpoints

### Phase 3: Late Fees & Terms (Week 2)
- [ ] Interest calculation logic
- [ ] Late fee application
- [ ] Due date calculation
- [ ] Overdue detection

### Phase 4: Advanced Features (Week 2-3)
- [ ] Return/refund handling
- [ ] Bulk operations
- [ ] Reminder system
- [ ] POS integration

### Phase 5: Pages & UI (Week 3-4)
- [ ] Dashboard page
- [ ] Customer details page
- [ ] Bulk payment page
- [ ] Reports page
- [ ] Components (modals, tables, cards)

### Phase 6: Polish & Integration (Week 4)
- [ ] PDF generation (statements)
- [ ] Export functionality
- [ ] Error handling
- [ ] Testing & validation

---

## 8. Configuration Settings

### Configurable Parameters

**Default Interest/Late Fee Settings:**
```typescript
{
  defaultInterestRate: 10,      // % per annum
  lateFeeFixedAmount: 100,      // Fixed fee in ₹
  lateFeePercentage: 2,         // % of overdue amount
  compoundingMethod: "DAILY",   // DAILY, MONTHLY, YEARLY
  reminderDays: [1, 7, 15],     // Send reminders on 1st, 7th, 15th day overdue
}
```

**Payment Terms Templates:**
```typescript
[
  { name: "Immediate", days: 0 },
  { name: "NET 7", days: 7 },
  { name: "NET 15", days: 15 },
  { name: "NET 30", days: 30 },
  { name: "NET 60", days: 60 },
  { name: "EOM", type: "END_OF_MONTH" },
]
```

---

## 9. User Roles & Permissions

| Role | Can Record Payment | Can Record Return | Can Waive Fee | Can Adjust Term | Can View Report |
|------|-------------------|------------------|---------------|-----------------|-----------------|
| Cashier | ✓ | ✗ | ✗ | ✗ | ✗ |
| Sales Manager | ✓ | ✓ | ✗ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 10. Technical Stack

✓ Next.js 14 (App Router)
✓ TypeScript
✓ Prisma ORM v6.19.2
✓ PostgreSQL
✓ NextAuth v4
✓ React Hook Form
✓ Zod (validation)
✓ Tailwind CSS
✓ shadcn/ui components

---

## 11. Success Metrics

Once live, measure:
- Average days to collect payment
- Collection rate %
- % customers with credit
- Outstanding credit value
- Overdue accounts %
- Late fee revenue
- Bulk payment time savings

---

## 12. Future Enhancements (Not in MVP)

- Customer credit portal (view balance online)
- SMS integration for actual delivery
- Payment plan scheduling
- Credit approval workflow
- Write-off management
- Bank reconciliation
- Customer credit rating
- Predictive collection analysis

---

**Status:** Ready for implementation ✅
**Estimated Duration:** 3-4 weeks
**Complexity:** Medium-High
