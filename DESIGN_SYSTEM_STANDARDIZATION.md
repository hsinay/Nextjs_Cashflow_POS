# Design System Standardization - Complete Application Implementation

**Date:** January 16, 2026  
**Status:** In Progress - Systematically applying to all modules  
**Reference:** CUSTOMER_MODULE_DESIGN_COMPLETE.md

---

## Design Standards (From Customer Module)

### 🎨 Color Palette

```
Primary Text:        text-slate-900
Secondary Text:      text-slate-600
Primary Borders:     border-slate-200
Secondary Borders:   border-slate-100
Light Backgrounds:   bg-slate-50
White Backgrounds:   bg-white
Focus Color:         purple-500 (ring-purple-100)
Status - Success:    Green (text-green-600)
Status - Warning:    Yellow/Amber (text-yellow-600)
Status - Danger:     Red (text-red-600)
```

### 📐 Typography Standards

```
Page Titles:         text-4xl font-bold (text-slate-900)
Section Headers:     text-2xl font-semibold
Card Headers:        text-lg font-semibold
Form Labels:         text-sm font-semibold (text-slate-600)
Body Text:           text-sm or text-base (text-slate-900/600)
Emphasis:            font-semibold or font-bold
```

### 📏 Spacing Patterns

```
Page Sections:       space-y-8
Card Sections:       space-y-4 to space-y-6
Form Fields:         space-y-2
Grid Gaps:           gap-4 or gap-8
Section Padding:     p-6 or p-8
Card Padding:        p-6
Input Padding:       px-4 py-2
```

### 🎯 Component Patterns

#### Cards

```tsx
<div className="rounded-lg border border-slate-200 bg-white shadow-sm">
  {children}
</div>
```

#### Page Headers

```tsx
<div className="space-y-2">
  <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
  <p className="text-slate-600">{subtitle}</p>
</div>
```

#### Section Headers

```tsx
<div className="border-b border-slate-200 pb-4">
  <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
</div>
```

#### Tables

```tsx
// Header row
className = "bg-slate-50 border-b border-slate-200";

// Body rows
className = "border-b border-slate-100 hover:bg-slate-50 transition";

// Text
className = "font-medium text-slate-900"; // Important columns
className = "text-slate-600"; // Secondary columns
```

#### Form Fields

```tsx
// Input focus state
focus:border-purple-500 focus:ring-2 focus:ring-purple-100

// Labels
className="text-sm font-semibold text-slate-600"

// Helpers/errors
className="text-sm text-red-600"
```

#### Buttons

```
Primary:    Primary button with gradient (purple-600 to purple-700)
Secondary:  Outline with slate border (border-slate-300)
Danger:     Red background (bg-red-600)
Disabled:   Gray background (bg-slate-300)
```

#### Status Badges

```
Success:    Green text on light green background
Warning:    Amber text on light amber background
Danger:     Red text on light red background
Info:       Blue text on light blue background
```

---

## Modules to Update

### 1. Purchase Orders Module 🔄

**Status:** Has design token imports but needs styling refactor  
**Files:**

- `app/dashboard/purchase-orders/page.tsx`
- `app/dashboard/purchase-orders/[id]/page.tsx`
- `components/purchase-orders/purchase-order-form.tsx` ✓ (Fixed)
- `components/purchase-orders/purchase-order-list.tsx`
- `components/purchase-orders/purchase-order-details.tsx`

**Tasks:**

- [ ] Apply page header styling (text-4xl, subtitle)
- [ ] Style cards with border/shadow/rounded
- [ ] Update table with hover effects
- [ ] Apply proper color scheme to text
- [ ] Fix form field styling
- [ ] Update status badges

### 2. Supplier Module 📋

**Status:** Needs design implementation  
**Files:**

- `app/dashboard/suppliers/page.tsx`
- `app/dashboard/suppliers/[id]/page.tsx`
- Components for supplier list, details, payments

**Tasks:**

- [ ] Create supplier list page with design
- [ ] Create supplier details page
- [ ] Add payment tracking UI
- [ ] Style aging analysis displays
- [ ] Create statement viewer

### 3. Inventory Module 📦

**Status:** Needs design implementation  
**Files:**

- `app/dashboard/inventory/page.tsx`
- Stock management pages

**Tasks:**

- [ ] Create inventory dashboard
- [ ] Style stock level table
- [ ] Add reorder alerts styling
- [ ] Create receiving tracker
- [ ] Style GRN and receipt pages

### 4. Dashboard 🏠

**Status:** May need refresh  
**Files:**

- `app/dashboard/page.tsx`

**Tasks:**

- [ ] Update KPI cards styling
- [ ] Apply consistent spacing
- [ ] Update chart/graph areas

---

## Implementation Checklist

### Purchase Orders

- [ ] Page header with text-4xl title and subtitle
- [ ] Search/filter section in styled card
  - White background
  - Border and shadow
  - Grid layout for inputs
  - Purple focus states
- [ ] Table with modern styling
  - Header: bg-slate-50
  - Rows: border-slate-100, hover:bg-slate-50
  - Text: text-slate-900 for main, text-slate-600 for secondary
- [ ] Status badge component
  - DRAFT: gray
  - CONFIRMED: purple
  - RECEIVED: green
  - CANCELLED: red
- [ ] Detail page with card sections
- [ ] Form styling with proper labels and spacing

### Suppliers

- [ ] Page header with title/subtitle
- [ ] Supplier list cards or table
- [ ] Details card with two-column layout
- [ ] Payment status section
- [ ] Aging analysis display
- [ ] Statement table

### Inventory

- [ ] Stock summary dashboard
- [ ] Inventory table
- [ ] Reorder alerts
- [ ] GRN creation form
- [ ] Receipt tracking table

---

## Quick Implementation Guide

### For Each Page:

1. **Add Page Header**

   ```tsx
   <div className="space-y-2 mb-8">
     <h1 className="text-4xl font-bold text-slate-900">Page Title</h1>
     <p className="text-slate-600">Descriptive subtitle</p>
   </div>
   ```

2. **Wrap Sections in Cards**

   ```tsx
   <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6">
     {content}
   </div>
   ```

3. **Apply Text Colors**

   - Primary text: `text-slate-900`
   - Secondary text: `text-slate-600`
   - Labels: `text-sm font-semibold text-slate-600`

4. **Add Proper Spacing**

   - Between sections: `space-y-8`
   - Within cards: `space-y-4` or `space-y-6`
   - Form fields: `space-y-2`

5. **Style Tables**

   ```tsx
   // Header
   className = "bg-slate-50 border-b border-slate-200";

   // Rows
   className = "border-b border-slate-100 hover:bg-slate-50 transition";
   ```

6. **Focus States on Inputs**
   ```
   focus:border-purple-500 focus:ring-2 focus:ring-purple-100
   ```

---

## File-by-File Implementation Order

### Phase 1: Purchase Orders (Foundation)

1. `app/dashboard/purchase-orders/page.tsx` - List page
2. `app/dashboard/purchase-orders/[id]/page.tsx` - Detail page
3. `components/purchase-orders/purchase-order-list.tsx` - List component
4. `components/purchase-orders/purchase-order-details.tsx` - Details component

### Phase 2: Suppliers

1. `app/dashboard/suppliers/page.tsx` - Supplier list
2. `app/dashboard/suppliers/[id]/page.tsx` - Supplier details

### Phase 3: Inventory

1. `app/dashboard/inventory/page.tsx` - Inventory overview
2. Related inventory pages

### Phase 4: Dashboard & Navigation

1. `app/dashboard/page.tsx` - Main dashboard
2. Navigation styling consistency

---

## Validation Checklist

For each file updated:

- [ ] Page title is `text-4xl font-bold text-slate-900`
- [ ] Subtitle/description is `text-slate-600`
- [ ] All sections have space-y-8 between them
- [ ] Cards are styled with: `rounded-lg border border-slate-200 bg-white shadow-sm`
- [ ] Form labels are: `text-sm font-semibold text-slate-600`
- [ ] Input focus states are: `focus:border-purple-500 focus:ring-2 focus:ring-purple-100`
- [ ] Tables have: header with `bg-slate-50`, rows with hover effects
- [ ] All text follows color scheme (slate-900 primary, slate-600 secondary)
- [ ] Buttons use Button component with proper variants
- [ ] Status badges use correct colors
- [ ] Spacing is consistent (no hardcoded margins)

---

## Design System Tokens Reference

From `lib/design-tokens.ts`:

- `Colors.text.primary` → #1e293b (text-slate-900)
- `Colors.text.secondary` → #64748b (text-slate-600)
- `Colors.gray[200]` → #e2e8f0 (border-slate-200)
- `Colors.gray[100]` → #fafbfc (border-slate-100)
- `Colors.gray[50]` → #f8fafc (bg-slate-50)
- `Spacing.lg` → 16px (section gaps)
- `Spacing.md` → 12px (card gaps)
- `BorderRadius.lg` → 8px (cards)

---

## Next Steps

1. ✅ Review this standardization document
2. ⏳ Apply to Purchase Orders module
3. ⏳ Apply to Suppliers module
4. ⏳ Apply to Inventory module
5. ⏳ Final polish and consistency check

---

**Goal:** Entire application following Customer Module design standards by end of week.
