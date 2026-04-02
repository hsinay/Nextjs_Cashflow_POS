# POS System Architecture - Phase 4 Complete

## Visual System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────┐      ┌──────────────────────────────────────┐  │
│  │  POS PAYMENT PANEL     │      │     DASHBOARD (Future)               │  │
│  │  (Enhanced)            │      │  ├─ Session List                     │  │
│  ├────────────────────────┤      │  ├─ Session Details                  │  │
│  │ ✓ Session Status       │      │  ├─ Reports & Analytics             │  │
│  │ ✓ Validate Session     │      │  └─ Reconciliation                  │  │
│  │ ✓ Process Payment      │      │                                      │  │
│  │ ✓ Create Day Book Entry│      └──────────────────────────────────────┘  │
│  │ ✓ Update Totals        │                                                 │
│  └──────────┬─────────────┘                                                 │
│             │                                                               │
└─────────────┼───────────────────────────────────────────────────────────────┘
              │
              │ usePOSSession Hook
              │ Auto-fetch active session
              │
┌─────────────▼───────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js Routes)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ POST /api/pos-sessions              Create session with day book    │   │
│  │ GET  /api/pos-sessions              List user sessions             │   │
│  │ GET  /api/pos-sessions/active       Get current active session     │   │
│  │ GET  /api/pos-sessions/[id]         Get session details            │   │
│  │ PUT  /api/pos-sessions/[id]         Close session                  │   │
│  │ GET  /api/pos-sessions/[id]/summary Get summary                    │   │
│  │ POST /api/pos-sessions/[id]/update-totals  Update totals [NEW]     │   │
│  │                                                                     │   │
│  │ POST /api/daybook/[id]/entries      Create SALE entry [USED]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Authentication: NextAuth                                            │   │
│  │ • Validate session token                                            │   │
│  │ • Check user ownership                                              │   │
│  │ • Return 401/403 if unauthorized                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────┬───────────────────────────────────────────────────────────────┘
              │
              │ Service Layer
              │
┌─────────────▼───────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER (Business Logic)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────┐                                    │
│  │ posSessionService                   │                                    │
│  ├─────────────────────────────────────┤                                    │
│  │ • createSession()                   │ ──┐                                │
│  │   ├─ Find/create day book          │   │ Auto-links                     │
│  │   └─ Link to session               │   │ day book                       │
│  │                                     │ ──┘                                │
│  │ • getActiveSession()                │                                    │
│  │   └─ Filter by OPEN status         │                                    │
│  │                                     │                                    │
│  │ • updateSessionTotals()             │ ◄─── Called on every payment     │
│  │   ├─ Increment totalCashReceived    │                                    │
│  │   ├─ Increment totalCardReceived    │                                    │
│  │   └─ Increment totalTransactions    │                                    │
│  │                                     │                                    │
│  │ • closeSession()                    │                                    │
│  │   ├─ Calculate variance             │                                    │
│  │   └─ Set status to CLOSED           │                                    │
│  │                                     │                                    │
│  │ • getSessionSummary()               │                                    │
│  │   └─ Format metrics for display     │                                    │
│  │                                     │                                    │
│  │ • suspendSession() / resumeSession()│                                    │
│  │   └─ Pause/resume                  │                                    │
│  └─────────────────────────────────────┘                                    │
│                                                                               │
│  ┌─────────────────────────────────────┐                                    │
│  │ daybookService (Existing)           │                                    │
│  ├─────────────────────────────────────┤                                    │
│  │ • createEntry()                     │ ◄─── Called on every payment     │
│  │   └─ Create SALE entry linked       │                                    │
│  │      to session via referenceId     │                                    │
│  └─────────────────────────────────────┘                                    │
│                                                                               │
└─────────────┬───────────────────────────────────────────────────────────────┘
              │
              │ Prisma ORM
              │
┌─────────────▼───────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────┐                                     │
│  │ pos_sessions Table (NEW)           │                                     │
│  ├────────────────────────────────────┤                                     │
│  │ id                  UUID PK        │                                     │
│  │ cashierId           UUID FK (users)│                                     │
│  │ dayBookId           UUID FK (day_books) [NEW]                           │
│  │ terminalId          VARCHAR        │                                     │
│  │ status              ENUM           │ OPEN | CLOSED | SUSPENDED          │
│  │ openingCashAmount   DECIMAL(12,2)  │                                     │
│  │ closingCashAmount   DECIMAL(12,2)  │                                     │
│  │ totalSalesAmount    DECIMAL(12,2)  │                                     │
│  │ totalCashReceived   DECIMAL(12,2)  │ [UPDATED on payment]               │
│  │ totalCardReceived   DECIMAL(12,2)  │ [UPDATED on payment]               │
│  │ totalDigitalReceived DECIMAL(12,2) │ [UPDATED on payment]               │
│  │ totalTransactions   INT            │ [UPDATED on payment]               │
│  │ cashVariance        DECIMAL(12,2)  │ (closing - expected)               │
│  │ openedAt            TIMESTAMP      │                                     │
│  │ closedAt            TIMESTAMP      │                                     │
│  │ notes               TEXT           │                                     │
│  │ createdAt           TIMESTAMP      │                                     │
│  │ updatedAt           TIMESTAMP      │                                     │
│  │                                    │                                     │
│  │ Indexes:                           │                                     │
│  │ • cashierId                        │                                     │
│  │ • dayBookId                        │ [NEW]                              │
│  │ • status                           │                                     │
│  └────────────────────────────────────┘                                     │
│           ▲                    │                                             │
│           │                    │ 1..N                                        │
│           │                    ▼                                             │
│           │  1          ┌────────────────────────────────────┐              │
│           └─────────────│ day_books Table (UPDATED)          │              │
│                         ├────────────────────────────────────┤              │
│                         │ id                  UUID PK        │              │
│                         │ date                TIMESTAMP      │              │
│                         │ status              ENUM           │              │
│                         │ ...existing fields...              │              │
│                         │ posSessions         Relation [NEW] │              │
│                         └────────────────────────────────────┘              │
│                                    △                                         │
│                                    │                                         │
│                         ┌──────────┴──────────────┐                          │
│                         │                         │                          │
│              ┌──────────▼─────────┐  ┌──────────▼─────────┐                │
│              │ day_book_entries   │  │ cash_denominations │                │
│              │ (SALE entries)     │  │                    │                │
│              │ [CREATED on pmt]   │  │                    │                │
│              └────────────────────┘  └────────────────────┘                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Payment Processing Flow

```
USER INITIATES PAYMENT
        │
        ▼
┌─────────────────────────────────┐
│ POS Payment Panel Opens          │
├─────────────────────────────────┤
│ • usePOSSession hook runs        │
│ • GET /api/pos-sessions/active   │
│ • Display session status banner  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ User Enters Payment Amount       │
├─────────────────────────────────┤
│ • Selects payment method         │
│ • Enters amount                  │
│ • Clicks "Confirm Payment"       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ VALIDATION LAYER                │
├─────────────────────────────────┤
│ ✓ Session exists?               │
│ ✓ Amount valid?                 │
│ ✓ Payment method valid?         │
│ ✓ Customer set (if credit)?     │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ [1] CREATE TRANSACTION          │
│ (Parent component responsibility)│
├─────────────────────────────────┤
│ POST /api/transactions          │
│ • Records sale                  │
│ • Stores payment method         │
│ • Returns transactionId         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ [2] UPDATE SESSION TOTALS       │
│ (posSessionService.update...)   │
├─────────────────────────────────┤
│ POST /api/pos-sessions/[id]/... │
│ • totalCashReceived += amount   │
│   (if CASH)                     │
│ • totalCardReceived += amount   │
│   (if CARD)                     │
│ • totalDigitalReceived += amount│
│   (if UPI/WALLET)               │
│ • totalTransactions += 1        │
│ • totalSalesAmount += amount    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ [3] CREATE DAY BOOK ENTRY       │
│ (daybookService.createEntry)    │
├─────────────────────────────────┤
│ POST /api/daybook/[id]/entries  │
│ • entryType: 'SALE'             │
│ • amount: payment amount        │
│ • paymentMethod: from payment   │
│ • description: "POS Sale - ..." │
│ • referenceId: sessionId        │
│ • referenceType: 'POS_SESSION'  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ SUCCESS NOTIFICATION            │
├─────────────────────────────────┤
│ • Toast: "Payment successful"   │
│ • Close dialog                  │
│ • Refresh parent UI             │
│ • Session updated in real-time  │
└─────────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────┐
│           POS Dashboard / Session Manager               │
│  ┌──────────────────────────────────────────────────────┐│
│  │                                                      ││
│  │  ┌──────────────────┐     ┌──────────────────┐    ││
│  │  │ SessionOpener    │     │ SessionCloser    │    ││
│  │  │ (Open Session)   │     │ (Close Session)  │    ││
│  │  └────────┬─────────┘     └────────┬─────────┘    ││
│  │           │                        │              ││
│  │           └─────────┬──────────────┘              ││
│  │                     │                             ││
│  │           ┌─────────▼─────────┐                  ││
│  │           │ usePOSSession     │                  ││
│  │           │ • session state   │                  ││
│  │           │ • loading/error   │                  ││
│  │           │ • API wrapper     │                  ││
│  │           └────────┬──────────┘                  ││
│  │                    │                             ││
│  │           ┌────────▼─────────┐                  ││
│  │           │ SessionDisplay   │                  ││
│  │           │ (Show session)   │                  ││
│  │           └──────────────────┘                  ││
│  │                                                  ││
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │          POS PAYMENT PANEL                      ││
│  │  ┌──────────────────────────────────────────────┐││
│  │  │                                              │││
│  │  │  ┌──────────────────────────────────────┐   │││
│  │  │  │ usePOSSession (Hook)                │   │││
│  │  │  │ • Fetch active session              │   │││
│  │  │  │ • Handle errors                     │   │││
│  │  │  │ • Provide createSession/closeSession│   │││
│  │  │  └───────────┬────────────────────────┘   │││
│  │  │              │                             │││
│  │  │  ┌───────────▼────────────────────────┐   │││
│  │  │  │ Dialog Content                     │   │││
│  │  │  ├───────────────────────────────────┤   │││
│  │  │  │ ┌─────────────────────────────┐   │   │││
│  │  │  │ │ SessionStatusBadge          │   │   │││
│  │  │  │ │ (Display current status)    │   │   │││
│  │  │  │ └─────────────────────────────┘   │   │││
│  │  │  │                                   │   │││
│  │  │  │ OrderSummary                      │   │││
│  │  │  │ PaymentMethodSelector             │   │││
│  │  │  │ NumericKeypad                     │   │││
│  │  │  │                                   │   │││
│  │  │  │ ┌─────────────────────────────┐   │   │││
│  │  │  │ │ Confirm Button              │   │   │││
│  │  │  │ │ [Disabled if no session]    │   │   │││
│  │  │  │ └─────────────────────────────┘   │   │││
│  │  │  └───────────────────────────────────┘   │││
│  │  │                                          │││
│  │  └──────────────────────────────────────────┘││
│  │                                               │
│  └──────────────────────────────────────────────┘
│                                                   │
└──────────────────────────────────────────────────┘
         │
         ├─ onConfirmPayment (parent handler)
         │
         └─ Updates parent state & refreshes UI
```

---

## State Management Diagram

```
usePOSSession Hook (React)
│
├─ session: POSSessionWithRelations | null
│  ├─ id, cashierId, dayBookId, terminalId
│  ├─ status (OPEN | CLOSED | SUSPENDED)
│  ├─ openingCashAmount, closingCashAmount
│  ├─ totalSalesAmount, totalCashReceived
│  ├─ totalCardReceived, totalDigitalReceived
│  ├─ totalTransactions, cashVariance
│  ├─ openedAt, closedAt
│  ├─ cashier (User)
│  └─ dayBook (DayBook)
│
├─ summary: POSSessionSummary | null
│  ├─ sessionId, cashierId, terminalId
│  ├─ status, openingCash, closingCash
│  ├─ totalSales, totalTransactions
│  ├─ paymentBreakdown { cash, card, digital, total }
│  ├─ variance, openedAt, closedAt
│  └─ dayBookStatus
│
├─ loading: boolean
│  └─ true during API calls
│
├─ error: string | null
│  └─ Contains error message if operation failed
│
├─ createSession(amount, terminalId?)
│  └─ POST /api/pos-sessions → session linked to day book
│
├─ closeSession(amount, notes?)
│  └─ PUT /api/pos-sessions/[id] → session status = CLOSED
│
├─ fetchActive()
│  └─ GET /api/pos-sessions/active → updates session state
│
└─ fetchSession(id)
   └─ GET /api/pos-sessions/[id] → get specific session
```

---

## Transaction Flow (Detailed)

```
PAYMENT CONFIRMATION SEQUENCE
════════════════════════════════════════════════════════════

1. Check Session Exists
   if (!session) {
     Show error message
     Disable confirm button
     Return early
   }

2. Call Parent's onConfirmPayment()
   ├─ Creates Transaction record
   ├─ Updates Product inventory
   └─ Returns success

3. Update Session Totals
   POST /api/pos-sessions/{id}/update-totals
   ├─ Validates session ownership
   ├─ Validates session is OPEN
   ├─ Updates payment method counter
   │  ├─ CASH → totalCashReceived += amount
   │  ├─ CARD → totalCardReceived += amount
   │  └─ DIGITAL → totalDigitalReceived += amount
   ├─ Increments totalTransactions
   └─ Updates totalSalesAmount

4. Create Day Book Entry
   POST /api/daybook/{dayBookId}/entries
   ├─ Creates SALE entry
   ├─ Stores payment amount
   ├─ Records payment method
   ├─ Links to session via referenceId
   └─ Returns entry ID

5. Show Success
   ├─ Display success toast
   ├─ Log transaction details
   ├─ Close dialog
   └─ Refresh parent component

ERROR HANDLING AT EACH STEP
══════════════════════════════

If step 3 fails (update totals):
  └─ Log error
  └─ Don't fail payment (transaction already recorded)

If step 4 fails (create day book entry):
  └─ Log error
  └─ Don't fail payment (session totals updated)

If step 5 fails (show success):
  └─ Still notify user (operations completed)
```

---

## Performance Optimization

```
INDEXED QUERIES
═══════════════

GET active session:
  SELECT * FROM pos_sessions
  WHERE cashierId = ? AND status = 'OPEN'
  ORDER BY openedAt DESC
  LIMIT 1
  └─ Index on (cashierId, status)

Update totals:
  UPDATE pos_sessions
  SET totalCashReceived = totalCashReceived + ?
  WHERE id = ?
  └─ Direct update on PK

Close session:
  UPDATE pos_sessions
  SET status = ?, closedAt = ?, cashVariance = ?
  WHERE id = ?
  └─ Direct update on PK

QUERY OPTIMIZATION TECHNIQUES
════════════════════════════════

✓ Avoid N+1 with Prisma includes
✓ Index on cashierId for user lookups
✓ Index on status for filtering
✓ Index on dayBookId for day book links
✓ Use Decimal type for financial accuracy
✓ Atomic updates (not read-modify-write)
```

---

**Architecture Diagram Status: COMPLETE**  
**Build Status: PRODUCTION READY**  
**Last Updated: January 7, 2026**
