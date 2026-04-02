# Product Management Module - Architecture & Data Flow

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Next.js 14 Application                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Pages (Server Components)                     │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ ✓ /dashboard/products        (List - SSR)             │ │
│  │ ✓ /dashboard/products/new    (Create - SSR)           │ │
│  │ ✓ /dashboard/products/[id]   (Detail - SSR)           │ │
│  │ ✓ /dashboard/products/[id]/edit (Edit - SSR)          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │      Components (Client & Server)                      │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ SERVER:                      CLIENT:                    │ │
│  │ • LowStockAlert             • ProductListClient        │ │
│  │                             • ProductTable             │ │
│  │                             • ProductForm              │ │
│  │                             • ProductCard              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         API Routes (Next.js)                            │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ GET    /api/products           (list with filters)     │ │
│  │ POST   /api/products           (create)                │ │
│  │ GET    /api/products/[id]      (single)                │ │
│  │ PUT    /api/products/[id]      (update)                │ │
│  │ DELETE /api/products/[id]      (soft delete)           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │    Business Logic & Services                           │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ services/product.service.ts:                           │ │
│  │ • getAllProducts(filters)      → paginated list        │ │
│  │ • getProductById(id)           → single product        │ │
│  │ • createProduct(data)          → new product           │ │
│  │ • updateProduct(id, data)      → updated product       │ │
│  │ • deleteProduct(id)            → soft delete           │ │
│  │                                                        │ │
│  │ Validation:                                            │ │
│  │ • lib/validations/product.schema.ts (Zod)            │ │
│  │ • Input validation on create/update                   │ │
│  │ • Price validation (positive)                         │ │
│  │ • Cost price validation (≤ price)                     │ │
│  │ • Stock quantity validation (≥ 0)                     │ │
│  │ • SKU uniqueness check                                │ │
│  │ • Category existence check                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         Database Layer (Prisma ORM)                    │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ lib/prisma.ts (singleton client)                       │ │
│  │                                                        │ │
│  │ Product model:                                         │ │
│  │ • id (UUID primary key)                               │ │
│  │ • name, description, sku, barcode                     │ │
│  │ • price, costPrice, taxRate (Decimal)                │ │
│  │ • stockQuantity, reorderLevel (Int)                   │ │
│  │ • imageUrl, aiTags, visionEmbedding                   │ │
│  │ • categoryId (FK to Category)                         │ │
│  │ • isActive (soft delete flag)                         │ │
│  │ • createdAt, updatedAt (timestamps)                   │ │
│  │                                                        │ │
│  │ Indexes:                                               │ │
│  │ • @@unique([sku])                                     │ │
│  │ • @@index([categoryId])                               │ │
│  │ • @@index([name])                                     │ │
│  │ • @@index([sku])                                      │ │
│  │ • @@index([barcode])                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           PostgreSQL Database                          │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ products table                                         │ │
│  │ categories table (related)                            │ │
│  │ users table (created_by)                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

### 1. List Products Request

```
USER REQUEST
    ↓
GET /dashboard/products?search=laptop&categoryId=123&page=1
    ↓
Page Component (Server Side)
    ├─ getProducts() function
    │  ├─ Build where clause
    │  ├─ Query database
    │  └─ Return data
    ├─ getCategories()
    └─ Render with <ProductListClient>
    ↓
HTML + JavaScript → Browser
    ↓
RENDERED UI
    ├─ Search/Filter Bar
    ├─ Product Table
    └─ Pagination Controls

USER INTERACTION (Client Side)
    ├─ Type in search box
    │  → handleSearch() → router.push with new params
    ├─ Select category
    │  → handleCategoryChange() → router.push with new params
    └─ Click pagination
       → router.push with new page number
    ↓
Page Reloads with New Params
    ↓
Cycle Repeats (See Database Query above)
```

### 2. Create Product Request

```
USER REQUEST
    ↓
Click "Add Product" → Navigate to /dashboard/products/new
    ↓
Page Component (Server Side)
    ├─ getServerSession() → Check authentication
    ├─ hasRole() → Check authorization (ADMIN/INVENTORY_MANAGER)
    ├─ getCategories() → Fetch for dropdown
    └─ Render ProductForm
    ↓
FORM RENDERED
    ├─ All input fields
    ├─ Category dropdown
    ├─ Image preview
    └─ Submit button
    ↓
USER FILLS FORM → Submit
    ↓
CLIENT SIDE
    ├─ React Hook Form validates
    │  └─ Uses createProductSchema
    ├─ Form errors show if invalid
    └─ Submit on valid
    ↓
POST /api/products
Body: {name, description, sku, ...}
    ↓
API ROUTE HANDLER
    ├─ getServerSession() → 401 if not auth
    ├─ hasRole() check → 403 if wrong role
    ├─ Body validation (Zod) → 400 if invalid
    ├─ Business logic:
    │  ├─ Generate SKU if not provided
    │  ├─ Check SKU uniqueness → 409 if duplicate
    │  ├─ Check category exists → 404 if not
    │  └─ Create in database
    └─ Return { success, data, message }
    ↓
RESPONSE (201 Created)
Body: {success: true, data: Product}
    ↓
CLIENT SIDE
    ├─ Success notification
    ├─ Router redirect to product list
    └─ List refreshes with new product
    ↓
USER SEES NEW PRODUCT IN LIST
```

### 3. Update Product Request

```
USER NAVIGATES
    ↓
Click Product → GET /dashboard/products/[id]
    ↓
Page Component loads product data
    ↓
Click "Edit" → GET /dashboard/products/[id]/edit
    ↓
Form renders with pre-filled data
    ↓
USER MODIFIES FIELD → Submit
    ↓
PUT /api/products/[id]
Body: {name, price, ...}
    ↓
API VALIDATION
    ├─ Auth check → 401
    ├─ Role check → 403
    ├─ Schema validation → 400
    ├─ Product exists → 404
    ├─ SKU unique (if changed) → 409
    ├─ Category exists (if changed) → 404
    └─ Update successful → 200
    ↓
RESPONSE with updated product
    ↓
Client redirects to detail page
    ↓
USER SEES UPDATED DATA
```

### 4. Delete Product Request

```
USER CLICKS DELETE
    ↓
Confirmation dialog appears
    ↓
USER CONFIRMS → fetch() DELETE /api/products/[id]
    ↓
API ROUTE
    ├─ Auth/Role check
    ├─ Product exists check
    ├─ Soft delete:
    │  └─ Set isActive = false
    └─ Return success
    ↓
CLIENT SIDE
    ├─ Success notification
    ├─ router.refresh()
    └─ Product removed from list
    ↓
USER SEES PRODUCT REMOVED
```

---

## Data Models & Relationships

```
DATABASE SCHEMA

┌─────────────────────────────────┐
│         PRODUCT TABLE           │
├──────────────────────┬──────────┤
│ id (UUID)            │ Primary  │
│ name                 │          │
│ description          │          │
│ sku *                │ Unique   │
│ barcode              │          │
│ imageUrl             │          │
│ price (Decimal)      │          │
│ costPrice            │          │
│ stockQuantity (Int)  │          │
│ reorderLevel         │          │
│ taxRate              │          │
│ isActive (Boolean)   │ Soft Del │
│ categoryId (FK)  ─────────┐     │
│ aiTags (Array)      │     │     │
│ visionEmbedding      │     │     │
│ createdAt            │     │     │
│ updatedAt            │     │     │
└──────────────────────┴─────┼─────┘
                             │
                             │ references
                             ↓
┌─────────────────────────────────┐
│       CATEGORY TABLE            │
├──────────────────────┬──────────┤
│ id (UUID)            │ Primary  │
│ name                 │ Unique   │
│ description          │          │
│ imageUrl             │          │
│ parentCategoryId     │ Self-ref │
│ products (relation)  │ 1:Many   │
│ createdAt            │          │
│ updatedAt            │          │
└─────────────────────────────────┘


PRODUCT → CATEGORY: Many-to-One (FK)
```

---

## Authentication & Authorization Flow

```
REQUEST WITH SESSION
    ↓
MIDDLEWARE (middleware.ts)
    ├─ Check if route protected
    ├─ Check if session exists
    └─ Redirect to /login if no session
    ↓
PAGE/API ROUTE
    ├─ getServerSession()
    │  └─ Returns session with user + roles + permissions
    ├─ Check roles for authorization
    │  └─ hasRole(session.user, 'ADMIN')
    │  └─ hasRole(session.user, 'INVENTORY_MANAGER')
    └─ Return 403 Forbidden if insufficient
    ↓
AUTHORIZATION DECISION
    ├─ ✓ AUTHORIZED → Continue processing
    └─ ✗ UNAUTHORIZED → Return error response
    ↓
BUSINESS LOGIC
    ├─ Validate input
    ├─ Access database
    ├─ Return result
    └─ Send response
```

---

## Component Hierarchy

```
app/(dashboard)/
├── products/
│   ├── page.tsx (Server Component)
│   │   ├── getProducts() async
│   │   ├── getCategories() async
│   │   └── ProductListClient (Client Component)
│   │       ├── ProductTable (Client Component)
│   │       │   └── product items with actions
│   │       ├── Input (search)
│   │       ├── Select (category filter)
│   │       └── Pagination controls
│   │
│   ├── new/page.tsx (Server Component)
│   │   ├── getCategories() async
│   │   └── ProductForm (Client Component)
│   │       ├── Form fields
│   │       ├── Category dropdown
│   │       ├── Image preview
│   │       └── Submit/Cancel buttons
│   │
│   ├── [id]/page.tsx (Server Component)
│   │   ├── getProduct(id) async
│   │   ├── Product detail display
│   │   ├── Edit button (link)
│   │   ├── Delete button
│   │   └── AlertDialog (for delete)
│   │
│   └── [id]/edit/page.tsx (Server Component)
│       ├── getProduct(id) async
│       ├── getCategories() async
│       └── ProductForm (Client Component, edit mode)
└── ...
```

---

## State Management

### Server State

```
- Product list (from database)
- Product detail (from database)
- Category list (from database)
- User session (from NextAuth)
```

### Client State

```
React Hook Form:
- Form field values
- Form validation errors
- Form submission state

Client Component State:
- Search input value
- Selected category
- Current page
- Loading state
- Confirmation dialog state
```

### URL State

```
Query Parameters:
- ?search=laptop
- ?category=123
- ?page=2
- ?limit=20

Used for:
- Bookmarkable URLs
- Persistent filters
- Server-side rendering
```

---

## Error Handling Flow

```
REQUEST
    ↓
TRY-CATCH BLOCK
    ├─ Validation Error
    │  └─ 400 Bad Request
    │     └─ {success: false, errors: {...}}
    │
    ├─ Authentication Error
    │  └─ 401 Unauthorized
    │     └─ {success: false, error: "Unauthorized"}
    │
    ├─ Authorization Error
    │  └─ 403 Forbidden
    │     └─ {success: false, error: "Forbidden"}
    │
    ├─ Not Found Error
    │  └─ 404 Not Found
    │     └─ {success: false, error: "Not found"}
    │
    ├─ Conflict Error (duplicate SKU)
    │  └─ 409 Conflict
    │     └─ {success: false, error: "SKU already in use"}
    │
    └─ Server Error
       └─ 500 Internal Server Error
          └─ {success: false, error: "Internal server error"}
    ↓
CLIENT RECEIVES
    └─ Error message displayed to user
```

---

## Performance Optimizations

```
SERVER SIDE
├─ Server-side rendering (faster initial load)
├─ Database indexes on search fields
├─ Pagination (limits result set)
├─ Selective data fetching (only needed fields)
└─ Decimal precision (financial data)

CLIENT SIDE
├─ React Hook Form (efficient re-renders)
├─ Zod validation (once per submission)
├─ Client-side filtering for UI
├─ Optimized image loading
└─ Memoization of components

NETWORK
├─ API response caching
├─ Query string parameters (GET requests)
├─ Minimal JSON payload
└─ Error handling (no repeated requests)
```

---

## Security Layers

```
LAYER 1: Middleware
├─ Route protection
├─ Session validation
└─ Redirect to login if needed

LAYER 2: Authentication
├─ NextAuth.js session
├─ JWT tokens in httpOnly cookies
└─ Password hashing (bcrypt)

LAYER 3: Authorization
├─ Role-based access control
├─ Permission checks on every route
└─ 403 Forbidden for insufficient access

LAYER 4: Validation
├─ Input validation (Zod)
├─ Type checking (TypeScript)
└─ Schema enforcement

LAYER 5: Database
├─ Prisma ORM (SQL injection prevention)
├─ Parameterized queries
└─ Data integrity constraints

LAYER 6: Data Protection
├─ Soft delete (data preservation)
├─ Audit logs possible
└─ No sensitive data in responses
```

---

**This architecture ensures a scalable, secure, and performant Product Management Module.**
