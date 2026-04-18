# Pricelist Implementation Design

## Overview

Redesign the pricelist management to follow the Physical Inventory pattern with:

- **Server Component**: Main page that fetches all pricelists
- **Client Component**: Interactive table with filtering, sorting, inline editing, and actions
- **API Routes**: CRUD operations for rules within a pricelist
- **Pagination**: Display rules efficiently with pagination

---

## Architecture

### Page Structure

```
app/dashboard/pricelists/page.tsx (Server Component)
├── Fetches all pricelists from service
├── Passes to client component
└── components/pricelists/pricelist-list.tsx (Client Component)
    ├── Displays pricelists in a table
    ├── Filtering (by product, calculation type, status)
    ├── Sorting (by product name, min qty, max qty, type)
    ├── Pagination (10-20 rules per page)
    ├── Quick actions (view, edit, duplicate, delete)
    └── Bulk actions (if needed)

app/dashboard/pricelists/[id]/page.tsx (Server Component - Detail View)
└── Shows pricelist info + table of rules with inline edit options

components/pricelists/pricelist-rules-table.tsx (Client Component)
├── Displays rules in table format
├── Inline editing of calculation values
├── Quick edit/delete buttons
└── Status toggles (activate/deactivate rule)
```

---

## Data Model - API Enhancement

### New API Routes Needed:

```
GET  /api/pricelists/[id]/rules          - Get rules for a pricelist with pagination
POST /api/pricelists/[id]/rules          - Create a new rule
PUT  /api/pricelists/[id]/rules/[ruleId] - Update a rule
DELETE /api/pricelists/[id]/rules/[ruleId] - Delete a rule
```

### Query Parameters:

```typescript
GET /api/pricelists/[id]/rules?
  page=1&
  limit=20&
  sortBy=minQuantity&
  sortOrder=asc&
  productId=uuid&
  calculationType=PERCENTAGE_DISCOUNT&
  search=productName
```

---

## Table Design (Odoo-Style)

### Main Pricelist Table (page.tsx):

```
┌─────────────────────────────────────────────────────────────────────┐
│ Pricelists (View/Manage All)                                        │
├─────────────────────────────────────────────────────────────────────┤
│  Name     │ Rules │ Status │ Priority │ Created  │ Actions          │
├─────────────────────────────────────────────────────────────────────┤
│ Wholesale │  5    │ Active │ 5        │ Jan 1    │ View | Edit | Del │
│ Retail    │  3    │ Active │ 2        │ Jan 5    │ View | Edit | Del │
│ VIP       │  2    │ Inactive│ 10      │ Jan 10   │ View | Edit | Del │
└─────────────────────────────────────────────────────────────────────┘
```

### Rules Table Within Pricelist (pricelist detail view):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Pricelist: Wholesale                                    [Edit] [+ Add]    │
├──────────────────────────────────────────────────────────────────────────┤
│ Product │ Min Qty │ Max Qty │ Type │ Value │ Status │ Actions            │
├──────────────────────────────────────────────────────────────────────────┤
│ Widget  │ 1       │ 10      │ Disc%│ 5%    │ Active │ [E] [D] [Copy]     │
│ Gadget  │ 11      │ 100     │ Price│ ₹500  │ Active │ [E] [D] [Copy]     │
│ Tool    │ 101     │ ∞       │ Dis$ │ ₹50   │ Inactive│ [E] [D] [Copy]     │
└──────────────────────────────────────────────────────────────────────────┘

Pagination: [< Prev] | Page 1 of 3 (42 total rules) | [Next >]
```

---

## Component Features

### 1. **Pricelist List Component** (`pricelist-list.tsx`)

```typescript
Interface:
- Props: pricelists[], onEdit(), onDelete(), onDuplicate()
- State:
  - currentPage, itemsPerPage
  - sortField, sortOrder
  - searchTerm
  - filters (status, priority range)

Features:
✓ Pagination (10 items per page)
✓ Sorting by: name, rules count, status, priority, created date
✓ Search by: name, description
✓ Filter by: status (active/inactive)
✓ Quick actions: View → Detail, Edit → Edit Form, Duplicate, Delete
✓ Bulk actions: Delete multiple, Activate/Deactivate multiple
✓ Export: Download as CSV
```

### 2. **Rules Table Component** (`pricelist-rules-table.tsx`)

```typescript
Interface:
- Props: pricelistId, rules[], canEdit, onEdit(), onDelete()
- State:
  - currentPage, itemsPerPage
  - sortField, sortOrder
  - searchTerm (product name)
  - filters (calculation type, status)
  - editingRuleId (for inline editing)

Features:
✓ Pagination (20 rules per page)
✓ Sorting by: product name, min qty, max qty, type
✓ Search by: product name, SKU
✓ Filter by: calculation type, status
✓ Inline quick-edit cells:
  - Click discount % to edit inline
  - Click fixed price to edit inline
  - Click fixed discount to edit inline
  - Click formula values to edit inline
✓ Quick actions:
  - [Edit] → Full rule editor (modal or new page)
  - [Delete] → Confirmation → Delete
  - [Copy] → Duplicate rule with same settings
  - [Status] → Toggle active/inactive
✓ Bulk actions: Delete multiple rules, activate/deactivate
```

### 3. **Inline Rule Editor** (Modal)

```typescript
When user clicks [Edit] or inline cell:
- Opens modal/drawer with rule edit form
- Shows: product, min qty, max qty, calc type, value fields
- Validates before saving
- Updates table on save
- Can cancel (lose changes)
```

---

## User Flow

### Flow 1: View All Pricelists

```
User visits /dashboard/pricelists
├─ Server fetches all pricelists
├─ Renders list in table format
├─ Can sort, search, filter
├─ Clicks "View" → Goes to detail page
└─ Clicks "Edit" → Redirects to edit form page
```

### Flow 2: Manage Rules in a Pricelist

```
User visits /dashboard/pricelists/[id]
├─ Server fetches pricelist + rules
├─ Shows pricelist info
├─ Shows rules in table (paginated)
├─ Can sort, search, filter rules
├─ Clicks table row/[Edit] → Opens inline editor
├─ Updates value and saves (API call)
├─ Clicks [Delete] → Confirmation → Deletes
├─ Clicks [Copy] → Duplicates rule
└─ Clicks [+ Add Rule] → Opens form to add new rule
```

### Flow 3: Edit Pricelist Form

```
User visits /dashboard/pricelists/[id]/edit
├─ Shows pricelist fields (name, description, status, priority)
├─ Shows rules management (multi-product as designed)
├─ Can add/remove products
├─ Can add/edit/delete tiers per product
├─ Clicks "Update" → Saves all changes
└─ Redirected to detail page
```

---

## API Design

### Proposal: Separate Rules Endpoint

```typescript
// Instead of managing rules inside pricelist edit,
// Have dedicated rules CRUD endpoints:

GET /api/pricelists/[id]/rules?page=1&limit=20
POST /api/pricelists/[id]/rules

PUT /api/pricelists/[id]/rules/[ruleId]
DELETE /api/pricelists/[id]/rules/[ruleId]

Response format:
{
  success: true,
  data: {
    rules: [...],
    pagination: { page, limit, total, pages }
  }
}
```

---

## Implementation Steps

### Phase 1: List View (Week 1)

- [ ] Create `pricelist-list.tsx` client component
- [ ] Update `app/dashboard/pricelists/page.tsx` to use it
- [ ] Add: sorting, pagination, search, filters
- [ ] Add action buttons (view, edit, delete)

### Phase 2: Detail View Enhancement (Week 2)

- [ ] Create `pricelist-rules-table.tsx` client component
- [ ] Update `app/dashboard/pricelists/[id]/page.tsx`
- [ ] Add: rule-level sorting, pagination, search
- [ ] Create inline rule editor modal
- [ ] Add: quick-edit for calculation values
- [ ] Implement delete, copy, status toggle

### Phase 3: API Routes (Week 2)

- [ ] Create `/api/pricelists/[id]/rules` routes
- [ ] Implement GET (with pagination)
- [ ] Implement POST (create)
- [ ] Implement PUT (update)
- [ ] Implement DELETE (delete)

### Phase 4: Advanced Features (Week 3)

- [ ] Bulk actions (delete, status toggle multiple rules)
- [ ] Duplicate pricelist (copy all rules)
- [ ] Import/Export CSV
- [ ] Audit trail (who changed what, when)

---

## Styling & UX

### Inspired by Odoo:

- ✓ Clean table layout with hover effects
- ✓ Inline editing for quick updates
- ✓ Action buttons in last column (Edit, Delete, etc.)
- ✓ Status badges (Active/Inactive)
- ✓ Filter pills at top
- ✓ Pagination info and controls
- ✓ Search box for each column
- ✓ Confirmation dialogs for destructive actions
- ✓ Toast notifications for actions (saved, deleted, etc.)

### Color Coding:

- **Active Rules**: Green badge
- **Inactive Rules**: Gray badge
- **Hover Row**: Light blue background
- **Danger Actions**: Red text (delete)
- **Success Actions**: Green text (save)

---

## Database Queries Optimization

### Service Layer (`services/pricelist.service.ts`):

```typescript
// Get rules with pagination
export async function getPricelistRules(
  pricelistId: string,
  page: number = 1,
  limit: number = 20,
  filters?: any,
) {
  const skip = (page - 1) * limit;

  const rules = await prisma.pricelistRule.findMany({
    where: {
      pricelistId,
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.type && { calculationType: filters.type }),
    },
    include: {
      product: { select: { id, name, sku, costPrice, price } },
    },
    orderBy: { minQuantity: "asc" },
    skip,
    take: limit,
  });

  const total = await prisma.pricelistRule.count({
    where: { pricelistId, ...filters },
  });

  return { rules, total, page, limit, pages: Math.ceil(total / limit) };
}
```

---

## Summary

This design provides:

- ✅ **List View** - Browse all pricelists with pagination
- ✅ **Detail View** - See all rules for a pricelist, paginated
- ✅ **Inline Editing** - Quick edits without leaving page
- ✅ **Bulk Actions** - Manage multiple rules at once
- ✅ **Full CRUD** - Create, read, update, delete rules
- ✅ **Search & Filter** - Find rules quickly
- ✅ **Sorting** - Sort by any column
- ✅ **Pagination** - Handle large rulesets efficiently
- ✅ **Odoo-style UX** - Familiar interface for users
