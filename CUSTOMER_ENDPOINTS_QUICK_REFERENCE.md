# Customer Endpoints - Visual Quick Reference

## 📍 Current State vs. Desired State

### Customer Detail Page (/dashboard/customers/[id])

```
CURRENT STATE                          DESIRED STATE
──────────────────────────────────    ────────────────────────────────────

┌──────────────────────┐              ┌────────────────────────────────┐
│ Customer Details     │              │ Customer Details - Enhanced    │
├──────────────────────┤              ├────────────────────────────────┤
│ Name: John           │              │ [PREMIUM] [Loyalty] [Risk: 🟢] │
│ Email: john@ex.com   │              │                                │
│ Phone: 9876543210    │              │ CREDIT METRICS                 │
│                      │              │ Limit: ₹50k | Balance: ₹20k   │
│ Credit: ₹50k         │              │ Available: ₹30k [████░░░░░░]  │
│ Outstanding: ₹20k    │              │ Status: HEALTHY ✅             │
│ Status: Good         │              │                                │
│                      │              │ OUTSTANDING (AGING)            │
│ RECENT (5):          │              │ ┌──────────────────────────┐   │
│ - Order SO-001       │              │ │ Current: ₹10k            │   │
│ - Order SO-002       │              │ │ 0-30 OD: ₹5k (50%)       │   │
│ - Order SO-003       │              │ │ 30-60 OD: ₹3k (30%) ⚠️   │   │
│                      │              │ │ 60+ OD: ₹2k (20%) 🔴     │   │
│                      │              │ └──────────────────────────┘   │
│ [Edit]               │              │                                │
│ [View Orders]        │              │ RECENT PAYMENTS                │
│ [Back]               │              │ Jan 15: ₹5k (Bank) ✅         │
│                      │              │ Jan 5: ₹3k (Cash) ✅          │
│                      │              │ Dec 28: ₹4.5k (Cheque) ⏳     │
│                      │              │                                │
│                      │              │ RECENT ORDERS (5)              │
│                      │              │ Order# │ Date │ Amt │ Due │   │
│                      │              │ SO-001 │ Jan15│10k │ 5k  │   │
│                      │              │ SO-002 │ Jan10│8.5k│ 0   │   │
│                      │              │ SO-003 │ Jan1 │3.2k│ 3.2k│   │
│                      │              │                                │
│                      │              │ QUICK ACTIONS                  │
│                      │              │ [💳 PAY] [📧 EMAIL] [☎️ CALL] │
│                      │              │                                │
│                      │              │ [Edit] [View All] [Pay] [Back]│
└──────────────────────┘              └────────────────────────────────┘

Missing Info:                          Added Value:
❌ Aged breakdown                      ✅ Visual aging chart
❌ Balance per order                   ✅ Payment tracking
❌ Recent payments                     ✅ Communication tools
❌ Quick actions                       ✅ One-click operations
❌ Payment metrics                     ✅ Analytics
```

---

### Customer Orders Page (/dashboard/customers/[id]/orders)

```
CURRENT TABLE                          ENHANCED TABLE
─────────────────────────────────────  ─────────────────────────────────────

Order# │ Date   │ Amount  │ Status    Order# │ Date │ Amt │ Paid │ Due  │ OD
─────────────────────────────────────  ─────────────────────────────────────
SO-001 │ Jan 15 │ ₹10,000 │ CONFIRMED SO-001 │Jan15│10k │ 5k  │ 5k  │ 5 📊
SO-002 │ Jan 10 │ ₹8,500  │ CONFIRMED SO-002 │Jan10│8.5k│ 8.5k│ 0   │ - ✅
SO-003 │ Jan 1  │ ₹3,200  │ CONFIRMED SO-003 │Jan 1│3.2k│ 0   │ 3.2k│45🔴
                            [+2 more rows]

Missing Info:                          Added Value:
❌ Balance amount                      ✅ Paid vs. Due breakdown
❌ Days overdue                        ✅ Overdue indicators
❌ Payment status                      ✅ Payment progress tracking
❌ Sorting/filtering                   ✅ Advanced filters + sorting
❌ Inline actions                      ✅ Quick action buttons
                                       ✅ Order detail expansion
                                       ✅ Summary statistics

CURRENT FILTERS                        ENHANCED FILTERS
──────────────────────────────────    ──────────────────────────────────
Status: [ALL ▼]                       Status: [CONFIRMED ▼] [PARTIAL ▼]
                                      Date Range: [From] [To]
                                      Amount: [Min] [Max]
                                      ☑️ Show Overdue Only
                                      ☑️ Show Unpaid Only
                                      [APPLY FILTERS]

Summary Stats: (NEW)
─────────────────────────────────────
Total Orders: 45 | Total: ₹2,50,000
Paid: ₹2,00,000 | Due: ₹50,000
Overdue: ₹25,000 (50% of due)
```

---

## 🎯 Priority Matrix

```
        EFFORT
        ↑
        │
  HIGH  │  III        II
        │  (NICE)     (IMPORTANT)
        │
        │       I (CRITICAL)
        │
        │
  LOW   │
        └──────────────────────→
             LOW    BUSINESS VALUE    HIGH

TIER 1 - CRITICAL (Do First)
  • Add balance_amount to orders table
  • Show paid vs. due breakdown
  • Add days overdue indicator
  • Create aged balance widget
  • Add quick payment action

TIER 2 - IMPORTANT (Do Next)
  • Advanced filters (status, date range)
  • Payment history widget
  • Order detail expansion
  • Inline actions (pay, view, etc.)
  • Metrics calculations

TIER 3 - NICE TO HAVE (Future)
  • Trend charts
  • CLV analysis
  • Automated reminders
  • Bulk operations
  • Document generation
```

---

## 📊 Data Model Changes

```
CURRENT                              ENHANCED
────────────────────────────────────────────────────────────────

SalesOrder {                         SalesOrder {
  id                                   id
  customerId                           customerId
  orderDate                            orderDate
  status (enum)                        status (enum)
  totalAmount                          totalAmount
  balanceAmount (calc) ← Problem!      balanceAmount ← STORE THIS
  createdAt                            paidAmount (NEW)
  updatedAt                            paymentStatus (NEW)
}                                      dueDate (NEW)
                                       itemCount (NEW)
                                       lastPaymentDate (NEW)
                                       createdAt
                                       updatedAt
                                     }

Customer {                           Customer {
  id                                   id
  name                                 name
  email                                email
  creditLimit                          creditLimit
  // ... other fields                  paymentTermsDays (NEW)
}                                      totalOrdersCount (NEW)
                                       totalOrdersAmount (NEW)
                                       averageOrderValue (NEW)
                                     }

Payment (Existing)                   Payment (Existing)
  ✅ Already tracks payments            ✅ Use for history widget
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER DETAIL PAGE                      │
└─────────────────────────────────────────────────────────────┘
                           ↑
                    getCustomerById()
                           ↑
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ↓                      ↓                      ↓
Customer Record     Order Metrics           Payment History
- Basic Info        - Aged Balance          - Recent Payments
- Credit Info       - Payment Metrics       - Payment Methods
- Risk Score        - CLV Stats             - Status

        ↓                      ↓                      ↓
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ↓                      ↓                      ↓
  Profile          CreditMetricsPanel    RecentPaymentsCard
  Widget           + AgedBalanceWidget   Widget


┌─────────────────────────────────────────────────────────────┐
│                 CUSTOMER ORDERS PAGE                         │
└─────────────────────────────────────────────────────────────┘
                           ↑
                 getCustomerOrders()
                           ↑
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ↓                      ↓                      ↓
Order List           Summary Stats        Filter/Sort State
- All order data     - Totals             - Status
- Item counts        - Outstanding        - Date Range
- Payment status     - Overdue            - Amount
- Aging calc         - Payment Summary    - Overdue flag

        ↓                      ↓                      ↓
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ↓                      ↓                      ↓
OrdersTable          OrdersSummary      FiltersPanel
- Sortable           - Key metrics       - Status filters
- Expandable         - Quick stats       - Date pickers
- Actionable         - Totals            - Amount range
```

---

## 🏗️ Implementation Phases

```
WEEK 1: DATA LAYER                WEEK 2: UI LAYER               WEEK 3: TESTING
┌──────────────────────────┐    ┌──────────────────────────┐   ┌──────────────────────┐
│ Phase 1: Backend         │    │ Phase 2: Components      │   │ Phase 4: QA          │
├──────────────────────────┤    ├──────────────────────────┤   ├──────────────────────┤
│ • Schema migration       │    │ • CreditMetricsPanel     │   │ • Unit tests         │
│ • Type updates           │    │ • AgedBalanceWidget      │   │ • Integration tests  │
│ • Service enhancements   │    │ • RecentPaymentsCard     │   │ • Performance tests  │
│ • Helper methods         │    │ • QuickActionsBar        │   │ • Accessibility      │
│ • API route updates      │    │ • OrdersTable (enhanced) │   │ • UAT                │
│ • Testing (5h)           │    │ • Page layouts           │   │ • Bug fixes          │
└──────────────────────────┘    │ • Integration (3h)       │   └──────────────────────┘
   5 hours                       │ • Testing (2h)           │      11 hours
                                 └──────────────────────────┘
                                    6.5 hours

                                 PHASE 3: INTEGRATION (1h)
                                 • API endpoint updates
                                 • Data fetching
                                 • Error handling

                    Total: ~25.5 hours over 2-3 weeks
```

---

## 📋 Feature Checklist

### TIER 1: CRITICAL (Week 1)

- [ ] Add `balanceAmount` schema field
- [ ] Add `paidAmount` schema field
- [ ] Add `paymentStatus` schema field
- [ ] Update `getCustomerOrders()` to include balance
- [ ] Display balance in orders table
- [ ] Add days overdue calculation
- [ ] Create aged balance breakdown widget
- [ ] Show aged breakdown on detail page

### TIER 2: IMPORTANT (Week 2)

- [ ] Add recent payments widget
- [ ] Create quick actions bar (Pay, Email, Call)
- [ ] Add advanced filters (status, date, amount, overdue)
- [ ] Add sorting (amount due, days overdue)
- [ ] Add order detail modal/expansion
- [ ] Add order summary stats
- [ ] Create payment recording form

### TIER 3: NICE TO HAVE (Week 3+)

- [ ] Customer metrics (CLV, on-time payment %)
- [ ] Trend charts (orders, revenue, payments)
- [ ] Activity timeline
- [ ] Bulk operations (select multiple, batch email)
- [ ] Export to CSV/PDF
- [ ] Email integration
- [ ] SMS notifications
- [ ] Automated reminders

---

## 🎨 Key UI Patterns to Implement

### Pattern 1: Aged Balance Breakdown

```
┌─────────────────────────────┐
│ OUTSTANDING (AGING)         │
├─────────────────────────────┤
│ Current Due          ₹10k   │ ← Blue
│ 0-30 Days OD         ₹5k    │ ← Yellow
│ 30-60 Days OD        ₹3k    │ ← Orange ⚠️
│ 60+ Days OD          ₹2k    │ ← Red 🔴
│                             │
│ Total Due:           ₹20k   │
│                             │
│ [VIEW DETAILS]              │
└─────────────────────────────┘
```

### Pattern 2: Quick Metrics Bar

```
┌──────────────┬──────────────┬──────────────┐
│ Credit Limit │ Outstanding  │ Available    │
│   ₹50,000    │   ₹20,000    │   ₹30,000    │
│              │              │              │
│ Utilization: 40% [████░░░░░░]             │
└──────────────┴──────────────┴──────────────┘
```

### Pattern 3: Quick Action Bar

```
┌─────────────────────────────────────────┐
│ QUICK ACTIONS                           │
├─────────────────────────────────────────┤
│ [💳 PAY] [📧 EMAIL] [☎️ CALL]           │
│ [📱 SMS] [📋 INVOICE] [📊 STATEMENT]     │
└─────────────────────────────────────────┘
```

### Pattern 4: Enhanced Table Row

```
┌───────┬────────┬───────┬───────┬───────┬────┬────────┬────────┐
│ Order │ Date   │ Total │ Paid  │ Due   │Days│ Status │ Action │
├───────┼────────┼───────┼───────┼───────┼────┼────────┼────────┤
│ SO001 │ Jan 15 │ 10k   │ 5k    │ 5k    │ 5  │ PART.. │ 👁️ 💳│
│       │        │       │       │       │    │        │        │
│ Items: Monitor (1), Mouse (2)                                 │
│ Last Payment: Jan 10, ₹5,000                                  │
│ Due Date: Jan 25, 2025 - 5 days remaining                     │
│ [VIEW DETAILS] [RECORD PAYMENT] [EMAIL REMINDER]              │
└───────┴────────┴───────┴───────┴───────┴────┴────────┴────────┘
```

---

## 💾 Database Optimization

### Indexes to Add

```sql
-- Primary search indexes
CREATE INDEX idx_customer_id_status
  ON sales_orders(customer_id, status);

-- Aging analysis queries
CREATE INDEX idx_due_date
  ON sales_orders(due_date);

-- Payment status filtering
CREATE INDEX idx_payment_status
  ON sales_orders(payment_status);

-- Composite for common query patterns
CREATE INDEX idx_customer_aging
  ON sales_orders(customer_id, payment_status, due_date);
```

### Denormalized Fields (For Performance)

```
SalesOrder
├── itemCount (cached from items count)
├── paidAmount (cached from payments)
├── paymentStatus (calculated field)
├── daysOverdue (calculated daily)
└── lastPaymentDate (cached)
```

### Query Optimization Tips

- ✅ Use joins instead of multiple queries
- ✅ Cache aging calculations (refresh daily)
- ✅ Denormalize frequently calculated fields
- ✅ Use database views for complex reporting
- ✅ Implement pagination (20-50 records per page)

---

## 📱 Mobile Considerations

```
DESKTOP (1200px+)             TABLET (768px-1199px)      MOBILE (<768px)
──────────────────────        ────────────────────       ──────────────
┌──────────────────────┐      ┌──────────────────┐       ┌──────────┐
│ Customer Details     │      │ Details│Payments │       │ Details  │
├──────────────────────┤      ├────────┴─────────┤       ├──────────┤
│ Credit Metrics (full)│      │ Credit Metrics   │       │ Credit..│
│ Aged Breakdown (full)│      │ (stacked)        │       │ Metric.│
│ Recent Payments (5)  │      │ Aged Breakdown   │       │        │
│ Quick Actions (6)    │      │ (pie chart)      │       │ Aged:  │
│ Orders Table (5)     │      │ Actions (4)      │       │ 40% OD │
│                      │      │ Orders (3)       │       │        │
│                      │      │                  │       │ [PAY]  │
│                      │      │                  │       │ [MORE] │
│                      │      │                  │       │        │
└──────────────────────┘      └──────────────────┘       └──────────┘

Mobile UX Tips:
✅ Stack content vertically
✅ Use large touch targets (44px min)
✅ Collapse secondary info
✅ Full-width buttons
✅ Simplified tables (2-3 key columns)
✅ Modal for payment form
✅ Test on real devices
```

---

## 🔗 Cross-Reference Guide

| Feature          | Analysis Doc   | Roadmap Doc | Code Example             |
| ---------------- | -------------- | ----------- | ------------------------ |
| Aged breakdown   | § Tier 1       | Phase 2.2   | components/aged-balance  |
| Balance tracking | § Current Gaps | Phase 1.1   | schema update            |
| Quick payment    | § Tier 1       | Phase 2.4   | components/quick-actions |
| Orders table     | § Tier 1       | Phase 2.5   | components/orders-table  |
| Metrics          | § Tier 2       | Phase 1.5   | service methods          |
| Filters          | § Tier 2       | Phase 3.3   | page enhancements        |
| Research         | ERP Guide      | Phase 0     | 6 systems analyzed       |

---

## 🎓 Learning Order

1. **Read:** CUSTOMER_ENDPOINTS_EXECUTIVE_SUMMARY.md (this)
2. **Study:** CUSTOMER_ENDPOINTS_ANALYSIS.md (detailed gaps)
3. **Research:** ERP_POS_RESEARCH_GUIDE.md (competitor patterns)
4. **Plan:** CUSTOMER_ENDPOINTS_IMPLEMENTATION_ROADMAP.md (tech details)
5. **Build:** Follow roadmap phases sequentially

---

**Last Updated:** January 16, 2026  
**Status:** Ready for Implementation  
**Estimated Timeline:** 2-3 weeks for TIER 1+2 features
