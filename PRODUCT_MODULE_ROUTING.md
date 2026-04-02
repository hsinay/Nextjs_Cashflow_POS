# Product Management Module - Routing & Implementation Guide

**Status:** ✅ Fully Implemented and Integrated into Dashboard

---

## Complete Routing Structure

### Products Module Routes

```
/dashboard/products
├── (List View - Server Component)
│   ├── GET params: search, category, page, limit
│   ├── Features:
│   │   ├── Search by name, SKU, barcode
│   │   ├── Filter by category
│   │   ├── Pagination (default 10 items/page)
│   │   └── Display with product table
│   └── Components:
│       ├── ProductListClient (search/filter UI)
│       └── ProductTable (list display)

/dashboard/products/new
├── (Create Product - Server Component)
│   ├── Permission: ADMIN or INVENTORY_MANAGER
│   ├── Features:
│   │   ├── All product fields
│   │   ├── Category selector
│   │   ├── Image preview
│   │   ├── Profit margin calculator
│   │   └── Form validation
│   └── Component: ProductForm

/dashboard/products/[id]
├── (Product Detail View - Server Component)
│   ├── GET single product
│   ├── Features:
│   │   ├── Full product information
│   │   ├── Stock status badge
│   │   ├── Profit margin display
│   │   ├── Edit button
│   │   ├── Delete button (soft delete)
│   │   └── Delete confirmation dialog
│   └── Custom Components:
│       ├── Alert dialogs
│       ├── Badge for status
│       └── Product details display

/dashboard/products/[id]/edit
├── (Edit Product - Server Component)
│   ├── Permission: ADMIN or INVENTORY_MANAGER
│   ├── Features:
│   │   ├── Pre-filled form with product data
│   │   ├── Same validation as create
│   │   ├── Partial updates allowed
│   │   └── Navigation back on success
│   └── Component: ProductForm (in edit mode)
```

---

## API Endpoints (Backend)

### GET /api/products

- **Authentication:** Required
- **Authorization:** Any authenticated user
- **Query Parameters:**
  - `search` - Search in name, SKU, barcode
  - `categoryId` - Filter by category UUID
  - `isActive` - Filter active/inactive (true/false)
  - `lowStock` - Show only low-stock items (true/false)
  - `page` - Page number (default 1)
  - `limit` - Items per page (default 20, max 100)
- **Response:** `{ success: true, data: Product[], pagination: {...} }`

### POST /api/products

- **Authentication:** Required
- **Authorization:** ADMIN or INVENTORY_MANAGER
- **Body:** `CreateProductInput` with validation
- **Response:** `{ success: true, data: Product }`
- **Error Codes:** 401 (unauth), 403 (forbidden), 400 (validation), 409 (duplicate SKU)

### GET /api/products/[id]

- **Authentication:** Required
- **Authorization:** Any authenticated user
- **Response:** `{ success: true, data: Product }`

### PUT /api/products/[id]

- **Authentication:** Required
- **Authorization:** ADMIN or INVENTORY_MANAGER
- **Body:** `UpdateProductInput` (all fields optional)
- **Response:** `{ success: true, data: Product }`

### DELETE /api/products/[id]

- **Authentication:** Required
- **Authorization:** ADMIN or INVENTORY_MANAGER
- **Behavior:** Soft delete (sets isActive = false)
- **Response:** `{ success: true, message: "..." }`

---

## Dashboard Navigation

### Updated Sidebar (`app/dashboard/layout.tsx`)

```tsx
Navigation Items:
- Dashboard (icon: LayoutGrid)
- Products (icon: Package)      ← NEW
- Categories (icon: Tag)

Features:
- Responsive layout (flex-based)
- Hover effects on nav items
- Icon + label for clarity
- Consistent spacing and styling
```

---

## UI Components Added

All components follow Shadcn UI patterns and are Tailwind-styled:

1. **Card** (`components/ui/card.tsx`)

   - CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Used in dashboard cards and form containers

2. **Badge** (`components/ui/badge.tsx`)

   - Display status badges (in-stock, low-stock, out-of-stock, inactive)
   - Variants: default, secondary, destructive, outline

3. **Table** (`components/ui/table.tsx`)

   - Product list display in tabular format
   - TableHeader, TableBody, TableRow, TableCell
   - Built for pagination and sorting

4. **DropdownMenu** (`components/ui/dropdown-menu.tsx`)

   - Product actions menu (Edit, Delete)
   - Radix UI + Tailwind styled
   - Customizable menu items

5. **AlertDialog** (`components/ui/alert-dialog.tsx`)

   - Delete confirmation dialogs
   - Header, Footer, Action, Cancel buttons
   - Modal with overlay

6. **Button** (Updated)
   - Added variants: default, destructive, outline, secondary, ghost, link
   - Added sizes: default, sm, lg, icon
   - CVA (Class Variance Authority) pattern

---

## Feature Highlights

### 1. Product Search & Filtering

- **Real-time search** on name, SKU, barcode
- **Category filtering** via dropdown
- **Pagination** with configurable items per page
- **Query parameters** preserved during navigation

### 2. Product Management

- **Create:** Full form with category dropdown + image preview
- **Read:** Detail view with calculated profit margin
- **Update:** Partial updates allowed via edit form
- **Delete:** Soft delete with confirmation dialog

### 3. Stock Management

- **Stock status badges:** in-stock, low-stock, out-of-stock
- **Reorder level tracking:** automatic low-stock alerts
- **Stock quantity validation:** non-negative integers

### 4. Business Logic

- **Profit margin calculation:** (price - costPrice) / costPrice \* 100
- **Stock status determination:** Based on quantity and reorder level
- **Category validation:** Ensures category exists before product creation
- **SKU uniqueness:** Prevents duplicate SKU values

### 5. Security & Authorization

- **Authentication required** for all routes
- **Role-based access:**
  - INVENTORY_MANAGER: Can create/edit/delete products
  - ADMIN: Full access
  - Other roles: View-only access
- **Soft delete:** Products marked inactive, not deleted from DB

---

## File Structure

```
app/(dashboard)/
├── products/
│   ├── page.tsx                    (List view - server component)
│   ├── new/
│   │   └── page.tsx                (Create form - server component)
│   └── [id]/
│       ├── page.tsx                (Detail view - server component)
│       └── edit/
│           └── page.tsx            (Edit form - server component)

components/products/
├── product-form.tsx                (Reusable form component)
├── product-list-client.tsx         (Search/filter UI - client component)
├── product-table.tsx               (Tabular display - client component)
├── low-stock-alert.tsx             (Alert component)
├── product-card.tsx                (Card display)
└── product-card.tsx                (Grid display)

components/ui/                       (New UI library)
├── card.tsx                        (Card container components)
├── badge.tsx                       (Status badges)
├── table.tsx                       (Table components)
├── dropdown-menu.tsx               (Dropdown actions menu)
├── alert-dialog.tsx                (Confirmation dialogs)
└── button.tsx                      (Updated with variants)

lib/validations/
└── product.schema.ts               (Zod validation schemas)

services/
└── product.service.ts              (Business logic & DB ops)

types/
└── product.types.ts                (TypeScript interfaces)
```

---

## How to Use

### View Products List

1. Navigate to `/dashboard/products`
2. See all active products in table format
3. Use search bar to find by name/SKU/barcode
4. Use category dropdown to filter
5. Use pagination controls to navigate pages

### Create New Product

1. Click "Add Product" button on products list
2. Navigate to `/dashboard/products/new`
3. Fill in all required fields
4. Select category from dropdown
5. Optional: Add image URL for preview
6. Click "Create" to save

### Edit Existing Product

1. Click product name or Edit button in actions
2. Navigate to `/dashboard/products/[id]`
3. Click "Edit" button
4. Navigate to `/dashboard/products/[id]/edit`
5. Update any fields
6. Click "Save" to update

### Delete Product (Soft Delete)

1. Click product in list or view detail
2. Click "Delete" button
3. Confirm in dialog
4. Product marked inactive (isActive = false)
5. Product still in database, not visible in lists

### Low Stock Alerts

- Products with `stockQuantity <= reorderLevel` shown with yellow badge
- Alert component displays top 10 low-stock items
- Each item linked to product for quick editing

---

## Dependencies Added

```json
{
  "@radix-ui/react-alert-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6"
}
```

All other dependencies already present in project.

---

## Testing Checklist

- [ ] Navigate to `/dashboard/products` - see product list
- [ ] Search for a product by name/SKU/barcode
- [ ] Filter products by category
- [ ] Click "Add Product" - form renders
- [ ] Fill form and create new product
- [ ] Click product name - detail view shows
- [ ] Click Edit button - edit form renders
- [ ] Update product fields
- [ ] Delete product - confirmation dialog appears
- [ ] Confirm delete - product soft deleted (isActive = false)
- [ ] Check low-stock alert - shows items below reorder level
- [ ] Verify pagination works with multiple products
- [ ] Test with different user roles (ADMIN, INVENTORY_MANAGER)

---

## Status: ✅ COMPLETE

The Product Management Module is fully integrated into the dashboard with:

- ✅ Complete routing structure
- ✅ All CRUD operations
- ✅ Search and filtering
- ✅ Authentication & authorization
- ✅ Form validation
- ✅ UI components
- ✅ Error handling
- ✅ Navigation integration
