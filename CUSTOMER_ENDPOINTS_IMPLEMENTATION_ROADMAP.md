# Customer Endpoints - Implementation Roadmap

## 📋 Quick Summary

This roadmap provides a step-by-step implementation guide to enhance the customer detail and orders pages based on industry best practices from SAP, NetSuite, Shopify, Xero, and Zoho.

---

## 🎯 Phase 1: Critical Data Enhancements (Week 1)

### Goal

Enable balance tracking, aging analysis, and payment history visibility.

### Backend Tasks

#### Task 1.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

Changes needed:

```prisma
model SalesOrder {
  // ... existing fields

  // Add these fields
  paidAmount        Decimal    @default(0) @db.Decimal(12, 2)
  paymentStatus     String     @default("UNPAID")  // UNPAID, PARTIALLY_PAID, PAID
  dueDate           DateTime?
  itemCount         Int        @default(0)
  lastPaymentDate   DateTime?

  // Add indexes for performance
  @@index([customerId, status, paymentStatus])
  @@index([dueDate])
  @@index([paymentStatus])
}

model Customer {
  // ... existing fields

  // Add these fields
  paymentTermsDays     Int        @default(30)
  totalOrdersCount     Int        @default(0)
  totalOrdersAmount    Decimal    @default(0) @db.Decimal(12, 2)
  lastOrderDate        DateTime?
  averageOrderValue    Decimal    @default(0) @db.Decimal(12, 2)
}
```

**Effort:** 30 min  
**Testing:** Migration test locally

#### Task 1.2: Create & Run Migration

```bash
npm run prisma:migrate -- --name add_order_tracking_fields
npm run prisma:generate
```

**Effort:** 15 min

#### Task 1.3: Update Type Definitions

**File:** `types/customer.types.ts`

Add new types:

```typescript
export interface OrderMetrics {
  totalOrders: number;
  totalOrderValue: number;
  avgOrderValue: number;
  mostRecentOrderDate: Date | null;
  avgDaysBetweenOrders: number;
}

export interface PaymentMetrics {
  onTimePaymentPercentage: number;
  averagePaymentDelay: number;
  lastPaymentDate: Date | null;
  paymentReliabilityScore: number; // 0-100
}

export interface AgedBalance {
  current: number; // Not overdue
  overdue_0_30: number;
  overdue_30_60: number;
  overdue_60_plus: number;
}

export interface CreditMetrics {
  creditUtilization: number; // 0-100
  creditStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  agedBalance: AgedBalance;
  availableCredit: number;
}

export interface EnhancedSalesOrder {
  id: string;
  status: string;
  totalAmount: number;
  balanceAmount: number;
  paidAmount: number;
  paymentStatus: string;
  itemCount: number;
  createdAt: Date;
  dueDate?: Date;
  daysOverdue?: number;
  lastPaymentDate?: Date;
}
```

**Effort:** 30 min

### Backend Service Updates

#### Task 1.4: Enhance `getCustomerById()`

**File:** `services/customer.service.ts`

```typescript
async getCustomerById(id: string) {
  const customer = await prisma.customer.findFirst({ where: { id, isActive: true } });
  if (!customer) return null;

  const outstandingBalance = await CustomerService.calculateOutstandingBalance(id);

  // NEW: Get aged balance
  const agedBalance = await CustomerService.getOrderAging(id);

  // NEW: Get payment metrics
  const paymentMetrics = await CustomerService.getCustomerPaymentMetrics(id);

  // NEW: Get recent payments
  const recentPayments = await prisma.payment.findMany({
    where: { customerId: id, payerType: 'CUSTOMER' },
    orderBy: { paymentDate: 'desc' },
    take: 5,
  });

  // Get orders with more details
  const recentOrders = await prisma.salesOrder.findMany({
    where: { customerId: id },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      balanceAmount: true,
      paidAmount: true,
      paymentStatus: true,
      itemCount: true,
      createdAt: true,
      dueDate: true,
      lastPaymentDate: true,
      _count: { select: { items: true } } // Get item count
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    ...convertToNumber(customer),
    outstandingBalance,
    creditMetrics: {
      creditUtilization: Math.round((outstandingBalance / customer.creditLimit) * 100),
      creditStatus: outstandingBalance > (customer.creditLimit * 0.9) ? 'CRITICAL'
        : outstandingBalance > (customer.creditLimit * 0.7) ? 'WARNING' : 'HEALTHY',
      agedBalance: convertToNumber(agedBalance),
      availableCredit: customer.creditLimit.toNumber() - outstandingBalance,
    },
    paymentMetrics: convertToNumber(paymentMetrics),
    recentOrders: convertToNumber(recentOrders),
    recentPayments: convertToNumber(recentPayments),
  };
}
```

**Effort:** 1 hour

#### Task 1.5: Add Helper Methods

```typescript
async getOrderAging(customerId: string): Promise<AgedBalance> {
  const now = new Date();
  const orders = await prisma.salesOrder.findMany({
    where: {
      customerId,
      status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
    },
  });

  const aged = {
    current: 0,
    overdue_0_30: 0,
    overdue_30_60: 0,
    overdue_60_plus: 0,
  };

  for (const order of orders) {
    const balance = order.balanceAmount.toNumber();
    const dueDate = order.dueDate || new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPastDue <= 0) aged.current += balance;
    else if (daysPastDue <= 30) aged.overdue_0_30 += balance;
    else if (daysPastDue <= 60) aged.overdue_30_60 += balance;
    else aged.overdue_60_plus += balance;
  }

  return aged;
}

async getCustomerPaymentMetrics(customerId: string): Promise<PaymentMetrics> {
  const orders = await prisma.salesOrder.findMany({
    where: { customerId, status: { ne: 'DRAFT' } },
  });

  const payments = await prisma.payment.findMany({
    where: { customerId, payerType: 'CUSTOMER' },
    orderBy: { paymentDate: 'desc' },
  });

  // Calculate on-time payments
  const onTimeCount = orders.filter(o => {
    const dueDate = o.dueDate || new Date(o.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    return o.lastPaymentDate && o.lastPaymentDate <= dueDate;
  }).length;

  const onTimePercentage = orders.length > 0 ? (onTimeCount / orders.length) * 100 : 0;

  // Calculate average payment delay
  const delays = orders
    .filter(o => o.lastPaymentDate)
    .map(o => {
      const dueDate = o.dueDate || new Date(o.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      return Math.max(0, Math.floor((o.lastPaymentDate!.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    });

  const avgDelay = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0;

  return {
    onTimePaymentPercentage: Math.round(onTimePercentage),
    averagePaymentDelay: avgDelay,
    lastPaymentDate: payments.length > 0 ? payments[0].paymentDate : null,
    paymentReliabilityScore: Math.round(Math.max(0, 100 - (avgDelay * 2))),
  };
}
```

**Effort:** 1.5 hours

#### Task 1.6: Enhance `getCustomerOrders()`

```typescript
async getCustomerOrders(id: string, { status, page = 1, limit = 20 }: {...}) {
  const where: any = { customerId: id };
  if (status && status !== 'ALL') where.paymentStatus = status;

  const skip = (page - 1) * limit;
  const orders = await prisma.salesOrder.findMany({
    where,
    select: {
      id: true,
      status: true,
      totalAmount: true,
      balanceAmount: true,
      paidAmount: true,
      paymentStatus: true,
      itemCount: true,
      createdAt: true,
      dueDate: true,
      lastPaymentDate: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.salesOrder.count({ where });

  // Calculate days overdue for each order
  const ordersWithAging = orders.map(o => {
    const dueDate = o.dueDate || new Date(o.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      ...o,
      daysOverdue: daysOverdue > 0 ? daysOverdue : null,
    };
  });

  // Summary stats
  const summary = {
    totalOrders: total,
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0),
    totalPaid: orders.reduce((sum, o) => sum + o.paidAmount.toNumber(), 0),
    totalDue: orders.reduce((sum, o) => sum + o.balanceAmount.toNumber(), 0),
    overdueDue: ordersWithAging
      .filter(o => o.daysOverdue && o.daysOverdue > 0)
      .reduce((sum, o) => sum + o.balanceAmount.toNumber(), 0),
    overdueDays: Math.max(...ordersWithAging.map(o => o.daysOverdue || 0)),
  };

  return {
    orders: convertToNumber(ordersWithAging),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    summary: convertToNumber(summary),
  };
}
```

**Effort:** 1 hour

### Summary of Phase 1 Backend Work

- **Total Effort:** ~5 hours
- **Dependencies:** None
- **Testing:** Unit tests for aging calculation, integration tests for service methods

---

## 🎨 Phase 2: UI Components (Week 1-2)

### Goal

Create new components and enhance existing ones with the new data.

### Task 2.1: Create `CreditMetricsPanel` Component

**File:** `components/customers/credit-metrics-panel.tsx`

```typescript
"use client";

import { CreditMetrics } from "@/types/customer.types";

interface Props {
  metrics: CreditMetrics;
  customerId: string;
}

export function CreditMetricsPanel({ metrics, customerId }: Props) {
  const getStatusColor = (status: string) => {
    if (status === "CRITICAL") return "bg-red-50 border-red-200";
    if (status === "WARNING") return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getUtilizationColor = (percent: number) => {
    if (percent > 90) return "bg-red-500";
    if (percent > 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div
      className={`border rounded-lg p-6 ${getStatusColor(
        metrics.creditStatus
      )}`}
    >
      <h3 className="text-lg font-semibold mb-4">Credit & Financial Status</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-600">Credit Limit</p>
          <p className="text-2xl font-bold">
            ₹{metrics.creditLimit?.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Outstanding</p>
          <p className="text-2xl font-bold">
            ₹{metrics.outstandingBalance?.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Available</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{metrics.availableCredit?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <p className="text-sm font-semibold">Credit Utilization</p>
          <p className="text-sm font-semibold">{metrics.creditUtilization}%</p>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getUtilizationColor(
              metrics.creditUtilization
            )} transition-all`}
            style={{ width: `${Math.min(metrics.creditUtilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            metrics.creditStatus === "CRITICAL"
              ? "bg-red-200 text-red-800"
              : metrics.creditStatus === "WARNING"
              ? "bg-yellow-200 text-yellow-800"
              : "bg-green-200 text-green-800"
          }`}
        >
          {metrics.creditStatus}
        </span>
      </div>
    </div>
  );
}
```

**Effort:** 1 hour

### Task 2.2: Create `AgedBalanceWidget` Component

**File:** `components/customers/aged-balance-widget.tsx`

```typescript
"use client";

import { AgedBalance } from "@/types/customer.types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  agedBalance: AgedBalance;
  customerId: string;
}

export function AgedBalanceWidget({ agedBalance, customerId }: Props) {
  const total = Object.values(agedBalance).reduce((a, b) => a + b, 0);

  const categories = [
    {
      label: "Current Due",
      amount: agedBalance.current,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "0-30 Days Overdue",
      amount: agedBalance.overdue_0_30,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "30-60 Days Overdue",
      amount: agedBalance.overdue_30_60,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "60+ Days Overdue",
      amount: agedBalance.overdue_60_plus,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Outstanding Orders (Aging)</h3>

      <div className="space-y-3 mb-6">
        {categories.map((cat) => (
          <div key={cat.label} className={`p-3 rounded ${cat.bgColor}`}>
            <div className="flex justify-between items-center">
              <p className={`font-medium ${cat.color}`}>{cat.label}</p>
              <p className={`text-lg font-semibold ${cat.color}`}>
                ₹{cat.amount?.toLocaleString()}
              </p>
            </div>
            {cat.amount > 0 && (
              <div className="mt-2 text-sm text-slate-600">
                {((cat.amount / total) * 100).toFixed(1)}% of total due
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Link href={`/dashboard/customers/${customerId}/orders?status=UNPAID`}>
          <Button>View Details</Button>
        </Link>
      </div>
    </div>
  );
}
```

**Effort:** 1 hour

### Task 2.3: Create `RecentPaymentsCard` Component

**File:** `components/customers/recent-payments-card.tsx`

```typescript
"use client";

import { Payment } from "@/types/payment.types";

interface Props {
  payments: Payment[];
  customerId: string;
}

export function RecentPaymentsCard({ payments, customerId }: Props) {
  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      CASH: "💵",
      BANK_TRANSFER: "🏦",
      CARD: "💳",
      CHEQUE: "📋",
      DIGITAL_WALLET: "📱",
      UPI: "🔗",
    };
    return icons[method] || "💰";
  };

  const getStatusColor = (status: string) => {
    if (status === "COMPLETED") return "text-green-600";
    if (status === "PENDING") return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>

      {payments.length === 0 ? (
        <p className="text-slate-500">No payments recorded</p>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div>
                <p className="font-medium">
                  {getPaymentMethodIcon(payment.paymentMethod)}{" "}
                  {payment.paymentMethod}
                </p>
                <p className="text-sm text-slate-600">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ₹{payment.amount?.toLocaleString()}
                </p>
                <p
                  className={`text-xs font-semibold ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {payment.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Effort:** 1 hour

### Task 2.4: Create `QuickActionsBar` Component

**File:** `components/customers/quick-actions-bar.tsx`

```typescript
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  customerId: string;
  hasOutstandingBalance: boolean;
}

export function QuickActionsBar({ customerId, hasOutstandingBalance }: Props) {
  return (
    <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
      <h4 className="w-full font-semibold text-slate-900 mb-2">
        Quick Actions
      </h4>

      {hasOutstandingBalance && (
        <Link href={`/dashboard/customers/${customerId}/record-payment`}>
          <Button className="bg-green-600 hover:bg-green-700">
            💳 Record Payment
          </Button>
        </Link>
      )}

      <Link href={`/dashboard/customers/${customerId}/email`}>
        <Button variant="outline">📧 Send Email</Button>
      </Link>

      <Button
        variant="outline"
        onClick={() => alert("SMS feature coming soon")}
      >
        📱 Send SMS
      </Button>

      <Button
        variant="outline"
        onClick={() => alert("Call feature coming soon")}
      >
        ☎️ Call
      </Button>

      <Link href={`/dashboard/customers/${customerId}/statement`}>
        <Button variant="outline">📋 Statement</Button>
      </Link>
    </div>
  );
}
```

**Effort:** 45 min

### Task 2.5: Enhance Orders Table

**File:** `components/customers/orders-table.tsx` (NEW)

```typescript
"use client";

import { EnhancedSalesOrder } from "@/types/customer.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  orders: EnhancedSalesOrder[];
  customerId: string;
}

export function OrdersTable({ orders, customerId }: Props) {
  const getStatusBadgeColor = (status: string) => {
    if (status === "PAID") return "bg-green-100 text-green-800";
    if (status === "PARTIALLY_PAID") return "bg-blue-100 text-blue-800";
    if (status === "UNPAID") return "bg-yellow-100 text-yellow-800";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b-2 border-slate-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Order #
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Date
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
              Amount
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
              Paid
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
              Due
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
              Days OD
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
              Status
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition"
            >
              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                {order.id.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                ₹{order.totalAmount?.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-green-600 text-right font-semibold">
                ₹{order.paidAmount?.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-red-600 text-right font-semibold">
                ₹{order.balanceAmount?.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-center">
                {order.daysOverdue && order.daysOverdue > 0 ? (
                  <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold text-xs">
                    {order.daysOverdue}🔴
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-3 text-sm text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-sm space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800"
                >
                  👁️
                </Button>
                {order.balanceAmount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-800"
                  >
                    💳
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Effort:** 1.5 hours

### Task 2.6: Update Customer Detail Page Layout

**File:** `app/dashboard/customers/[id]/page.tsx`

Replace entire component with enhanced version using new components.

**Effort:** 1 hour

### Summary of Phase 2 UI Work

- **Total Effort:** ~6.5 hours
- **Dependencies:** Phase 1 backend completed
- **Testing:** Component tests, visual regression testing

---

## 🔌 Phase 3: API & Page Integration (Week 2)

### Task 3.1: Update API Route

**File:** `app/api/customers/[id]/route.ts`

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CustomerService } from "@/services/customer.service";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customer = await CustomerService.getCustomerById(params.id);
    if (!customer)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Effort:** 30 min

### Task 3.2: Update Customer Orders API

**File:** `app/api/customers/[id]/orders/route.ts`

```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const status = searchParams.get("status") || "ALL";

  try {
    const result = await CustomerService.getCustomerOrders(params.id, {
      status,
      page,
      limit,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Effort:** 30 min

### Task 3.3: Update Customer Orders Page

**File:** `app/dashboard/customers/[id]/orders/page.tsx`

Enhanced version with:

- Summary stats
- Advanced filters
- Sorting options
- Bulk actions UI
- Modal for order details

**Effort:** 2 hours

### Summary of Phase 3 Integration

- **Total Effort:** ~3 hours
- **Dependencies:** Phases 1 & 2 completed

---

## 🧪 Phase 4: Testing & Refinement (Week 2-3)

### Task 4.1: Unit Tests

- Test aging calculation logic
- Test payment metrics calculation
- Test balance calculations

**Effort:** 3 hours

### Task 4.2: Integration Tests

- Test data flow from service to UI
- Test filters and sorting
- Test payment recording flow

**Effort:** 3 hours

### Task 4.3: Performance Optimization

- Add database indexes
- Optimize queries (N+1 problems)
- Add caching where appropriate
- Test page load times

**Effort:** 2 hours

### Task 4.4: UI/UX Polish

- Mobile responsiveness
- Accessibility (WCAG)
- Empty states
- Error states
- Loading states

**Effort:** 3 hours

### Summary of Phase 4

- **Total Effort:** ~11 hours
- **Includes:** Testing, optimization, accessibility

---

## 📊 Complete Timeline Summary

| Phase     | Component                 | Duration    | Effort         |
| --------- | ------------------------- | ----------- | -------------- |
| 1         | Schema & Backend Services | 3-4 days    | 5 hours        |
| 2         | UI Components             | 3-4 days    | 6.5 hours      |
| 3         | API & Integration         | 1-2 days    | 3 hours        |
| 4         | Testing & Polish          | 3-4 days    | 11 hours       |
| **Total** |                           | **2 weeks** | **25.5 hours** |

---

## 📋 Implementation Checklist

### Phase 1: Backend

- [ ] Update Prisma schema
- [ ] Create & run migration
- [ ] Update type definitions
- [ ] Enhance `getCustomerById()`
- [ ] Enhance `getCustomerOrders()`
- [ ] Add helper methods (aging, metrics)
- [ ] Test all service methods

### Phase 2: Components

- [ ] Create CreditMetricsPanel
- [ ] Create AgedBalanceWidget
- [ ] Create RecentPaymentsCard
- [ ] Create QuickActionsBar
- [ ] Create OrdersTable
- [ ] Update customer detail page
- [ ] Update customer orders page

### Phase 3: Integration

- [ ] Update GET /api/customers/[id]
- [ ] Update GET /api/customers/[id]/orders
- [ ] Integration test all routes
- [ ] Verify data flow end-to-end

### Phase 4: QA & Polish

- [ ] Unit test backend logic
- [ ] Integration tests
- [ ] Performance testing
- [ ] Mobile testing
- [ ] Accessibility audit
- [ ] UAT with users
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 🎯 Success Criteria

✅ All critical TIER 1 features implemented  
✅ Page loads in < 2 seconds  
✅ All tests passing (>80% coverage)  
✅ Mobile responsive (tested on iPhone/Android)  
✅ Accessible (WCAG AA)  
✅ User acceptance testing passed  
✅ Zero critical bugs in staging

---

## 💡 Tips for Implementation

1. **Start with backend** - Ensure data is correct before building UI
2. **Test as you go** - Don't accumulate test debt
3. **Performance first** - Monitor query performance during backend work
4. **Iterate with UX feedback** - Involve users early
5. **Document as you build** - Keep code comments updated
6. **Handle errors gracefully** - Show helpful error messages
7. **Plan for mobile** - Design mobile-first, enhance for desktop

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Status:** Ready for Implementation
