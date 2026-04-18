# EmptyState Component Refactoring Examples

This document shows real-world examples of refactoring existing inline empty states to use the reusable `EmptyState` component.

## Example 1: Payment Table Component

### Before: Inline Empty State

**File:** `components/payments/payment-table.tsx`

```tsx
import { Wallet } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function PaymentTable({ payments, pagination }: PaymentTableProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Date
              </th>
              {/* ... more headers ... */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Wallet className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-lg font-medium">No payments found</p>
                    <p className="text-sm">Try adjusting your filters or record a new payment</p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                // ... render payment rows ...
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Problems:**

- ❌ 16 lines of empty state markup
- ❌ Coupling styling/layout with business logic
- ❌ Duplicate styling across components
- ❌ Hard to maintain consistent UX
- ❌ No CTA action button

### After: Using EmptyState Component

**File:** `components/payments/payment-table.tsx`

```tsx
import { EmptyState } from '@/components/ui';
import { Wallet } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function PaymentTable({ payments, pagination }: PaymentTableProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Date
              </th>
              {/* ... more headers ... */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={<Wallet className="h-12 w-12" />}
                    title="No payments found"
                    description="Try adjusting your filters or record a new payment"
                    action={{ label: 'Record Payment', href: '/dashboard/payments/new' }}
                    className="py-12"
                  />
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                // ... render payment rows ...
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Benefits:**

- ✅ 7 lines for empty state (56% reduction)
- ✅ Clean, declarative syntax
- ✅ Consistent with entire app
- ✅ CTA action button included
- ✅ Easier to maintain and test

---

## Example 2: Customer Table Component

### Before: Inline Empty State

**File:** `components/customers/customer-table.tsx`

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomerTableProps {
  customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Loyalty</TableHead>
          <TableHead>Segment</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-slate-500">
              No customers found.
            </TableCell>
          </TableRow>
        ) : (
          customers.map((customer) => (
            // ... render customer rows ...
          ))
        )}
      </TableBody>
    </Table>
  );
}
```

**Problems:**

- ❌ Minimal, but still inline
- ❌ No icon or visual feedback
- ❌ No actionable CTA
- ❌ Inconsistent with other empty states

### After: Using EmptyState Component

**File:** `components/customers/customer-table.tsx`

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui';
import { Users } from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Loyalty</TableHead>
          <TableHead>Segment</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9}>
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No customers yet"
                description="Start building your customer base"
                action={{ label: 'Add Customer', href: '/dashboard/customers/new' }}
                className="py-8"
              />
            </TableCell>
          </TableRow>
        ) : (
          customers.map((customer) => (
            // ... render customer rows ...
          ))
        )}
      </TableBody>
    </Table>
  );
}
```

**Benefits:**

- ✅ Rich visual feedback with icon
- ✅ Contextual action button
- ✅ Better UX (users know what to do)
- ✅ 4 additional lines for huge UX improvement

---

## Example 3: Card-Based Empty State

### Before: Inline Empty State

**File:** `components/pricelists/pricelist-list.tsx`

```tsx
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PricelistListProps {
  pricelists: Pricelist[];
}

export function PricelistList({ pricelists }: PricelistListProps) {
  if (pricelists.length === 0) {
    return (
      <Card style={{ padding: '48px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          No pricelists yet
        </h3>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Create your first pricelist to start managing product pricing
        </p>
        <Link href="/dashboard/pricelists/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Pricelist
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    // ... render pricelists ...
  );
}
```

**Problems:**

- ❌ Verbose CSS-in-JS
- ❌ Mixed styling approaches
- ❌ Logic intertwined with presentation
- ❌ Hard to reuse pattern

### After: Using EmptyState Component

**File:** `components/pricelists/pricelist-list.tsx`

```tsx
import { EmptyState } from '@/components/ui';

interface PricelistListProps {
  pricelists: Pricelist[];
}

export function PricelistList({ pricelists }: PricelistListProps) {
  if (pricelists.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No pricelists yet"
        description="Create your first pricelist to start managing product pricing"
        action={{ label: 'Create Pricelist', href: '/dashboard/pricelists/new' }}
        className="p-12 rounded-lg border bg-white"
      />
    );
  }

  return (
    // ... render pricelists ...
  );
}
```

**Benefits:**

- ✅ Clean, declarative code
- ✅ 5 lines vs 20 lines (75% reduction)
- ✅ No CSS-in-JS complexity
- ✅ Consistent styling
- ✅ Easy to test

---

## Example 4: With Filters (No Results State)

### Scenario

A list with filters that returns no results when filters are applied.

### Implementation

```tsx
import { EmptyState } from "@/components/ui";
import { Search } from "lucide-react";

export function ProductList({ products, hasFiltersApplied }) {
  return (
    <>
      <div className="mb-6">{/* Filter UI */}</div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title={
            hasFiltersApplied
              ? "No results match your filters"
              : "No products yet"
          }
          description={
            hasFiltersApplied
              ? "Try adjusting your filters to find what you're looking for"
              : "Create your first product to get started"
          }
          action={
            hasFiltersApplied
              ? { label: "Clear Filters", onClick: () => clearFilters() }
              : { label: "Create Product", href: "/products/new" }
          }
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </>
  );
}
```

**Key Points:**

- ✅ Dynamic title/description based on state
- ✅ Different actions for different contexts
- ✅ Uses onClick for filter clearing
- ✅ Uses href for navigation

---

## Refactoring Checklist

When refactoring inline empty states to use `EmptyState`:

- [ ] Identify all inline empty state markup
- [ ] Choose appropriate icon (emoji or lucide-react component)
- [ ] Create a meaningful title
- [ ] Add helpful description
- [ ] Define appropriate CTA (href or onClick)
- [ ] Test in different screen sizes
- [ ] Verify accessibility with keyboard navigation
- [ ] Test with screen readers
- [ ] Update component exports if needed
- [ ] Update component props if needed

---

## Summary

Using the `EmptyState` component provides:

1. **Code Reduction:** 60-75% fewer lines for empty state markup
2. **Consistency:** Unified empty state UX across the app
3. **Maintainability:** Single source of truth for styling
4. **Flexibility:** Supports icons, descriptions, and CTAs
5. **Accessibility:** Built-in semantic HTML and keyboard support

These examples can be applied to any component with empty state requirements.
