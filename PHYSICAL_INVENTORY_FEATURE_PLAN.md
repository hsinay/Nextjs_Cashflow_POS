# Physical Inventory Feature - Analysis & Implementation Plan

## Executive Summary

This document provides a detailed comparison between **Odoo's Physical Inventory** feature and your current application's inventory management system, followed by a comprehensive implementation plan tailored to your application's architecture.

---

## 1. Odoo Physical Inventory Feature Overview

### 1.1 Core Functionality

Odoo Physical Inventory is a module that enables users to:

1. **Create Physical Inventory Adjustments** (Stock Count Sessions)
   - Initiate periodic stock counting operations
   - Support full inventory counts or partial location-based counts
   - Track date/time of the count

2. **Count Products** (Line-by-Line)
   - Record actual physical quantity observed
   - Compare against system quantity
   - Calculate variance (difference)
   - Add notes/observations per product

3. **Barcode Scanning** (Optional)
   - Scan product barcodes to quickly locate and count items
   - Mass product entry through scanning
   - Reduces manual data entry errors

4. **Variance Tracking**
   - Difference = Physical Count - System Quantity
   - Identify missing stock, damaged items, data entry errors
   - Flag high-variance items for investigation

5. **Approval Workflow**
   - Draft → Confirm → Done (3-state workflow)
   - Only approved counts update system inventory
   - Audit trail of who counted and when

6. **Auto-Reconciliation**
   - Generate automatic adjustment entries for variances
   - Create inventory transactions for differences
   - Update product stock levels

7. **Location-Based Counting**
   - Count by warehouse location
   - Separate counts for different storage areas
   - Can count partial inventory (e.g., only one warehouse)

8. **Reports & Analytics**
   - Variance reports by product/category
   - Discrepancy analysis
   - Inventory accuracy metrics
   - Historical count data

---

## 2. Current Application Inventory System Analysis

### 2.1 Existing Features

**Models:**

- `Product` - With stockQuantity field
- `InventoryTransaction` - Tracks movements (PURCHASE, SALE, ADJUSTMENT, RETURN, POS_SALE)
- `GoodsReceivedNote (GRN)` - For purchase receipts
- `StockPosting` - For stock finalization
- `PartialReceipt` - For incomplete purchase orders

**Services:**

- `inventory.service.ts` - Create transactions, retrieve history
- `stock-posting.service.ts` - Post stock with GL entries
- `grn.service.ts` - Generate goods received notes

**UI Components:**

- `AdjustmentForm` - Manual quantity adjustments
- `InventoryTransactionTable` - Transaction history
- `InventoryTransactionListClient` - Filtered listing with pagination

**API Routes:**

- `GET/POST /api/inventory-transactions` - CRUD operations
- `GET /api/inventory/stock-posting` - Stock posting endpoints

### 2.2 Existing Capabilities

| Feature                 | Status     | Details                                        |
| ----------------------- | ---------- | ---------------------------------------------- |
| Manual Adjustments      | ✅ Full    | Via AdjustmentForm, updates stockQuantity      |
| Transaction Tracking    | ✅ Full    | Detailed history with filters                  |
| Stock Posting           | ✅ Full    | Finalizes purchases with GL entries            |
| Date/Time Tracking      | ✅ Full    | All transactions timestamped                   |
| Permission Controls     | ✅ Full    | ADMIN, INVENTORY_MANAGER roles                 |
| Barcode Support         | ⚠️ Partial | Barcode field exists but not used for counting |
| Approval Workflow       | ❌ Missing | No draft/confirm/done states                   |
| Physical Count Sessions | ❌ Missing | No dedicated physical inventory module         |
| Variance Tracking       | ❌ Missing | No calculated discrepancies                    |
| Location-Based Counts   | ❌ Missing | No warehouse/location support                  |
| Variance Reports        | ❌ Missing | No analytics/reporting                         |
| Batch/Expiry Tracking   | ✅ Partial | GRN/PartialReceipt support but not in core     |

### 2.3 Data Model Gaps

| Feature                | Required | Current | Gap                                   |
| ---------------------- | -------- | ------- | ------------------------------------- |
| Physical Count Records | YES      | No      | Need PhysicalInventory model          |
| Count Line Items       | YES      | No      | Need PhysicalInventoryLine model      |
| Variance Calculation   | YES      | No      | Virtual/computed field needed         |
| Location/Warehouse     | YES      | No      | Need Location model                   |
| Status Workflow        | YES      | No      | Need Status enum (DRAFT→CONFIRM→DONE) |
| Approver Tracking      | YES      | No      | Need approvedBy/approvedDate fields   |
| Batch Numbers          | OPTIONAL | Partial | Exists in GRN but not central         |
| Expiry Dates           | OPTIONAL | Partial | Exists in GRN but not central         |

---

## 3. Comparative Analysis: Odoo vs Your Application

### 3.1 Feature Comparison Matrix

```
┌──────────────────────────────┬─────────┬────────────────────────┐
│ Feature                      │ Odoo    │ Your App (Current/Plan) │
├──────────────────────────────┼─────────┼────────────────────────┤
│ Create Count Session         │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Record Physical Counts       │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ System vs Physical Variance  │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Barcode Scanning             │ ✅ Full │ ⚠️ Partial / 🔄 Plan   │
│ Manual Entry Option          │ ✅ Full │ ✅ Full (would use)    │
│ Multi-Location Support       │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Approval Workflow            │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Auto-Reconciliation          │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Variance Reports             │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Audit Trail                  │ ✅ Full │ ✅ Full (timestamps)   │
│ Inventory Accuracy Score     │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Partial Count Support        │ ✅ Full │ ❌ Missing / 🔄 Plan   │
│ Batch/Expiry Tracking        │ ✅ Full │ ⚠️ Partial / 🔄 Plan   │
└──────────────────────────────┴─────────┴────────────────────────┘
```

### 3.2 Architecture Alignment

| Aspect            | Odoo                                | Your App                 | Alignment                      |
| ----------------- | ----------------------------------- | ------------------------ | ------------------------------ |
| **Data Model**    | Hierarchical, highly normalized     | Relational (Prisma)      | ✅ Good - Can map directly     |
| **Workflow**      | State machines (DRAFT→CONFIRM→DONE) | Event-driven             | ✅ Good - Can implement states |
| **User Roles**    | Module-level + document-level       | Role-based (RBAC)        | ✅ Perfect match               |
| **Permissions**   | Complex rule engine                 | Simple role checks       | ⚠️ May need refinement         |
| **API Style**     | REST + domain-specific              | REST with Zod validation | ✅ Compatible                  |
| **Audit Trail**   | Built-in (ir.model.access)          | Manual timestamps        | ✅ Can enhance                 |
| **Multi-Tenancy** | Native                              | Single tenant            | ✅ Not needed                  |
| **Transactional** | Database-level                      | Prisma $transaction      | ✅ Perfect                     |

---

## 4. Implementation Plan for Your Application

### 4.1 Phase 1: Data Model & Schema (Week 1)

#### 4.1.1 New Models to Add

**A. Location / Warehouse Model**

```typescript
// Supports multi-location inventory
model Location {
  id              String      @id @default(uuid())
  name            String      @unique
  code            String      @unique
  description     String?
  type            String      // WAREHOUSE, SECTION, SHELF
  parentLocationId String?    // For hierarchical locations
  isActive        Boolean     @default(true)

  physicalCounts  PhysicalInventory[]
  stockLevels     StockLevel[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([parentLocationId])
}
```

**B. StockLevel Model (Current Stock by Location)**

```typescript
// Tracks actual system stock by location
model StockLevel {
  id              String      @id @default(uuid())
  productId       String
  locationId      String
  quantity        Int         @default(0)

  product         Product     @relation(fields: [productId], references: [id])
  location        Location    @relation(fields: [locationId], references: [id])

  @@unique([productId, locationId])
  @@index([productId])
  @@index([locationId])
}
```

**C. PhysicalInventory Model (Count Session)**

```typescript
// Main physical inventory count session
model PhysicalInventory {
  id                  String      @id @default(uuid())
  referenceNumber     String      @unique // PI-2024-001
  locationId          String
  location            Location    @relation(fields: [locationId], references: [id])

  // Status Workflow
  status              String      // DRAFT, CONFIRMED, DONE
  // Enum: enum PhysicalInventoryStatus { DRAFT CONFIRMED DONE }

  // Dates & Users
  countDate           DateTime
  createdById         String
  createdBy           User        @relation("PhysicalInventoryCreatedBy", fields: [createdById], references: [id])
  confirmedById       String?
  confirmedBy         User?       @relation("PhysicalInventoryConfirmedBy", fields: [confirmedById], references: [id])

  // Details
  countMethod         String      // FULL_COUNT, PARTIAL_COUNT, CYCLE_COUNT
  notes               String?

  // Variance Summary (Computed)
  totalVariance       Int         @default(0)  // Total qty difference
  variancePercentage  Decimal?    @db.Decimal(5,2)

  // Relations
  lines               PhysicalInventoryLine[]

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@index([locationId])
  @@index([status])
  @@index([countDate])
}
```

**D. PhysicalInventoryLine Model (Count Details)**

```typescript
// Individual product counts per physical inventory
model PhysicalInventoryLine {
  id                      String      @id @default(uuid())
  physicalInventoryId     String
  physicalInventory       PhysicalInventory @relation(fields: [physicalInventoryId], references: [id], onDelete: Cascade)

  productId               String
  product                 Product     @relation(fields: [productId], references: [id])

  // Quantities
  systemQuantity          Int         // Stock in system before count
  physicalQuantity        Int?        // Actual count (null = not counted yet)
  variance                Int?        // physicalQuantity - systemQuantity (computed)

  // Optional Details
  batchNumber             String?
  expiryDate              DateTime?
  uomId                   String?     // Future: Unit of Measure

  // Notes from Counting
  notes                   String?
  countedBy               String?     // User who did the count
  countedAt               DateTime?   // When was it counted

  // Verification
  isVerified              Boolean     @default(false)
  verifiedBy              String?
  verifiedAt              DateTime?

  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  @@unique([physicalInventoryId, productId, batchNumber]) // Composite unique
  @@index([physicalInventoryId])
  @@index([productId])
}
```

**E. Update Product Model**

```typescript
// Add relation to StockLevel
model Product {
  // ... existing fields ...
  stockLevels         StockLevel[]
  physicalInventoryLines PhysicalInventoryLine[]
  // ... existing relations ...
}
```

**F. New Enums**

```typescript
enum PhysicalInventoryStatus {
  DRAFT       // Being created/edited, not finalized
  CONFIRMED   // Submitted for approval/finalization
  DONE        // Completed, inventory adjusted
}

enum CountMethod {
  FULL_COUNT      // Count all products
  PARTIAL_COUNT   // Count selected products/location
  CYCLE_COUNT     // Continuous rolling count
}
```

#### 4.1.2 Migration Steps

```bash
# 1. Create new models in prisma/schema.prisma
# 2. Generate migration
npm run prisma:migrate -- --name "add-physical-inventory-models"

# 3. Generate Prisma client
npm run prisma:generate

# 4. Seed locations (optional, can do through UI)
npm run db:seed
```

---

### 4.2 Phase 2: Service Layer (Week 1-2)

#### 4.2.1 Create Physical Inventory Service

**File: `services/physical-inventory.service.ts`**

```typescript
// Main service for physical inventory operations

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Types
export interface CreatePhysicalInventoryInput {
  locationId: string;
  countDate: Date;
  countMethod: "FULL_COUNT" | "PARTIAL_COUNT" | "CYCLE_COUNT";
  productIds?: string[]; // For partial count
  notes?: string;
  createdById: string;
}

export interface AddCountLineInput {
  physicalInventoryId: string;
  productId: string;
  physicalQuantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  notes?: string;
  countedBy?: string;
}

export interface ConfirmPhysicalInventoryInput {
  physicalInventoryId: string;
  confirmedById: string;
}

export interface CompletePhysicalInventoryInput {
  physicalInventoryId: string;
  confirmedById: string;
  autoAdjust?: boolean; // Auto-create adjustment transactions
}

// Service Functions
export async function createPhysicalInventory(
  data: CreatePhysicalInventoryInput,
): Promise<any> {
  // 1. Validate location exists
  // 2. Generate reference number (PI-YYYY-MM-001)
  // 3. Get current stock levels for location
  // 4. Create PhysicalInventory record
  // 5. If FULL_COUNT, auto-populate all products in location
  // 6. Return created record
}

export async function addCountLine(data: AddCountLineInput): Promise<any> {
  // 1. Validate physical inventory exists and is DRAFT
  // 2. Get system quantity from StockLevel
  // 3. Calculate variance
  // 4. Create PhysicalInventoryLine
  // 5. Return with variance
}

export async function updateCountLine(
  lineId: string,
  physicalQuantity: number,
  notes?: string,
): Promise<any> {
  // Update physical count and notes
}

export async function confirmPhysicalInventory(
  data: ConfirmPhysicalInventoryInput,
): Promise<any> {
  // 1. Validate all products counted (or allow partial)
  // 2. Calculate total variance
  // 3. Set status to CONFIRMED
  // 4. Record confirmer
}

export async function completePhysicalInventory(
  data: CompletePhysicalInventoryInput,
): Promise<any> {
  // 1. Check if already DONE
  // 2. For each line with variance:
  //    a. Create InventoryTransaction (ADJUSTMENT)
  //    b. Update StockLevel
  //    c. Update Product.stockQuantity
  // 3. Set status to DONE
  // 4. Generate variance report
}

export async function getPhysicalInventory(id: string): Promise<any> {
  // Get single PI with all lines and variances
}

export async function listPhysicalInventories(
  filters: any,
  pagination: any,
): Promise<any> {
  // List all PIs with filters (location, status, date range)
}

export async function getVarianceReport(
  physicalInventoryId: string,
): Promise<any> {
  // Calculate and return variance statistics
  // - Total variance
  // - High variance products
  // - Missing items
  // - Excess items
  // - Accuracy percentage
}
```

#### 4.2.2 Update Stock Posting Service

Add batch/expiry support:

```typescript
// In stock-posting.service.ts
// Add batch number and expiry date tracking
// Map to PhysicalInventoryLine for historical records
```

#### 4.2.3 Validation Schemas

**File: `lib/validations/physical-inventory.schema.ts`**

```typescript
import { z } from "zod";

export const createPhysicalInventorySchema = z.object({
  locationId: z.string().uuid(),
  countDate: z.coerce.date(),
  countMethod: z.enum(["FULL_COUNT", "PARTIAL_COUNT", "CYCLE_COUNT"]),
  productIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

export const addCountLineSchema = z.object({
  physicalInventoryId: z.string().uuid(),
  productId: z.string().uuid(),
  physicalQuantity: z.number().int().min(0),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  countedBy: z.string().optional(),
});

export const confirmPhysicalInventorySchema = z.object({
  physicalInventoryId: z.string().uuid(),
});

export const completePhysicalInventorySchema = z.object({
  physicalInventoryId: z.string().uuid(),
  autoAdjust: z.boolean().default(true),
});

export type CreatePhysicalInventoryInput = z.infer<
  typeof createPhysicalInventorySchema
>;
export type AddCountLineInput = z.infer<typeof addCountLineSchema>;
```

---

### 4.3 Phase 3: API Routes (Week 2)

#### 4.3.1 Create Physical Inventory Endpoints

**File: `app/api/physical-inventory/route.ts`**

- `GET` - List physical inventories with pagination/filters
- `POST` - Create new physical inventory session

**File: `app/api/physical-inventory/[id]/route.ts`**

- `GET` - Get single PI with all lines
- `PUT` - Update PI (notes, dates in DRAFT state)

**File: `app/api/physical-inventory/[id]/lines/route.ts`**

- `GET` - Get all count lines
- `POST` - Add count line
- `PUT` - Update count line quantity

**File: `app/api/physical-inventory/[id]/confirm/route.ts`**

- `POST` - Move from DRAFT to CONFIRMED

**File: `app/api/physical-inventory/[id]/complete/route.ts`**

- `POST` - Move from CONFIRMED to DONE + auto-adjust stock

**File: `app/api/physical-inventory/[id]/reports/variance/route.ts`**

- `GET` - Get variance report

#### 4.3.2 Endpoint Structure Example

```typescript
// POST /api/physical-inventory
// Create new physical inventory session
Request: {
  locationId: "uuid",
  countDate: "2024-04-15T10:00:00Z",
  countMethod: "FULL_COUNT",
  notes: "Monthly stocktake"
}

Response: {
  success: true,
  data: {
    id: "uuid",
    referenceNumber: "PI-2024-04-001",
    status: "DRAFT",
    location: { name: "Main Warehouse" },
    lines: [], // Empty lines to be filled
    createdAt: "2024-04-15T10:00:00Z"
  }
}
```

---

### 4.4 Phase 4: UI Components (Week 2-3)

#### 4.4.1 Pages

**`app/dashboard/inventory/physical-count/page.tsx`**

- Overview/dashboard
- List of physicalinventory sessions
- Create new count button
- Filter by status, date range, location

**`app/dashboard/inventory/physical-count/[id]/page.tsx`**

- Single PI detail view
- Show location, date, status
- Tables for:
  - Counted products (with system vs physical comparison)
  - Uncounted products
  - Variance summary
- Action buttons (Count, Confirm, Complete)

**`app/dashboard/inventory/physical-count/[id]/count/page.tsx`**

- Counting interface (active counting page)
- Product list with search/filter
- Input fields for physical count
- Barcode scanner integration
- Mark as counted
- Show variance in real-time

**`app/dashboard/inventory/physical-count/[id]/reports/page.tsx`**

- Variance reports
- Charts: variance by product, category
- High-variance items
- Missing items (negative variance)
- Accuracy metrics

#### 4.4.2 Components

**`components/inventory/physical-count/physical-inventory-list.tsx`**

- Server component
- List of physical inventories
- Status badges
- Quick actions (view, edit, complete)

**`components/inventory/physical-count/physical-inventory-form.tsx`**

- Client component
- Create new PI form
- Location selector
- Count method selector
- Date picker
- Zod validation

**`components/inventory/physical-count/count-interface.tsx`**

- Main counting interface
- Product selector/search
- Quantity input with NumericKeypad
- Batch/Expiry (optional)
- Notes field
- Add count button
- Real-time variance calculation

**`components/inventory/physical-count/count-table.tsx`**

- Display counted items
- System vs physical columns
- Variance column (highlighted if high)
- Actions: edit, remove, verify
- Uncounted products section

**`components/inventory/physical-count/variance-report.tsx`**

- Summary statistics
- Charts (variance distribution)
- High-variance items table
- Approval/completion action

**`components/inventory/physical-count/barcode-scanner.tsx`**

- Barcode input field
- Product lookup on scan
- Auto-populate details
- Focus management for rapid scanning

---

### 4.5 Phase 5: Integration & Testing (Week 3-4)

#### 4.5.1 Database Seeding

**`prisma/seed.ts`** - Add locations:

```typescript
// Create default locations
const locations = await prisma.location.createMany({
  data: [
    { name: "Main Warehouse", code: "WH-001", type: "WAREHOUSE" },
    { name: "Display Section", code: "WH-001-DS", type: "SECTION" },
    { name: "Storage Shelf A", code: "WH-001-SA", type: "SHELF" },
  ],
});
```

#### 4.5.2 Testing Scenarios

1. **Create Full Count**
   - Select location → Count date → FULL_COUNT
   - Verify all products auto-populated
   - Check initial system quantities

2. **Add Counts**
   - Scan barcode → Enter quantity → Add
   - Edit count → Update quantity
   - Verify variance calculation

3. **Confirm & Complete**
   - Confirm PI → Check status
   - Complete PI → Auto-adjust stock
   - Verify InventoryTransactions created
   - Check StockLevel updates

4. **Variance Reports**
   - Generate variance report
   - Check accuracy percentage
   - Verify high-variance products flagged

---

## 5. Implementation Roadmap

### Timeline: 4-5 Weeks

```
WEEK 1:
  Day 1-2:  Design data models (approved)
  Day 3-4:  Create Prisma schema + migration
  Day 5:    Generate client + seed locations

WEEK 2:
  Day 1-2:  Build physical-inventory.service.ts
  Day 3:    Create Zod validation schemas
  Day 4-5:  Implement API routes (6 main endpoints)

WEEK 3:
  Day 1-2:  Build UI pages (overview, detail, count)
  Day 3-4:  Build components (form, table, count interface)
  Day 5:    Integrate counting interface with keyboard + barcode

WEEK 4:
  Day 1-2:  Build variance reports & components
  Day 3:    Integration testing (full workflows)
  Day 4:    Performance testing (large inventories)
  Day 5:    Bug fixes + documentation

WEEK 5 (Optional):
  Advanced features:
  - Cycle counting support
  - Batch reconciliation
  - Email notifications
  - Integration with POS
```

---

## 6. Feature Requirements by Priority

### MVP (Must-Have) - Week 1-3

- [x] Create physical inventory sessions
- [x] Add/edit count lines
- [x] Variance calculation
- [x] Status workflow (DRAFT→CONFIRMED→DONE)
- [x] Auto-reconciliation (update stock)
- [x] Location-based counting
- [x] Basic variance report

### Phase 2 (Should-Have) - Week 3-4

- [ ] Barcode scanning integration
- [ ] Multi-product bulk entry
- [ ] Email notifications on completion
- [ ] Inventory accuracy metrics
- [ ] High-variance alerts
- [ ] Batch/Expiry tracking

### Phase 3 (Nice-to-Have) - Future

- [ ] Cycle counting workflow
- [ ] Mobile app for counting (PWA)
- [ ] AI-powered variance prediction
- [ ] Integration with purchase orders
- [ ] Multi-warehouse transfers tracking
- [ ] RFID integration

---

## 7. Compatibility with Current Architecture

### 7.1 Strengths (What Works Well)

✅ **Database Architecture**

- Prisma ORM supports complex relationships
- Can easily add new models without breaking existing code
- Transaction support ($transaction) for consistency

✅ **Authentication & Authorization**

- NextAuth already handles user identities
- Role-based access (ADMIN, INVENTORY_MANAGER) fits perfectly
- Can add more granular permissions later

✅ **Form Validation**

- Zod schemas already in use
- Consistent validation pattern established
- Easy to extend

✅ **API Pattern**

- Consistent REST routes structure
- Error handling patterns established
- Pagination/filtering patterns ready

✅ **Component Library**

- Shadcn UI provides all needed components
- NumericKeypad ready for counting interface
- Form components robust

### 7.2 Potential Challenges

⚠️ **Multi-Location Complexity**

- Current system doesn't track stock by location
- Will need StockLevel model to map products × locations
- Requires migration strategy for existing stock

⚠️ **Barcode Scanning**

- Needs frontend library (Quagga.js or similar)
- Camera permissions in browser
- Error handling for invalid barcodes

⚠️ **Real-Time Variance**

- Variance calculated after each count entry
- May need caching for large inventories
- Database query optimization important

⚠️ **Performance with Large Catalogs**

- If 10,000+ SKUs, count interface could slow
- Need pagination/infinite scroll in product picker
- Search optimization critical

---

## 8. Database Schema Additions Summary

### Models to Create

| Model                 | Purpose            | Key Fields                                            |
| --------------------- | ------------------ | ----------------------------------------------------- |
| Location              | Warehouse/sections | id, name, code, type, parentId                        |
| StockLevel            | Stock by location  | id, productId, locationId, quantity                   |
| PhysicalInventory     | Count session      | id, refNo, locationId, status, countDate              |
| PhysicalInventoryLine | Count details      | id, piId, productId, systemQty, physicalQty, variance |

### Enums to Create

| Enum                    | Values                                 |
| ----------------------- | -------------------------------------- |
| PhysicalInventoryStatus | DRAFT, CONFIRMED, DONE                 |
| CountMethod             | FULL_COUNT, PARTIAL_COUNT, CYCLE_COUNT |

### Relations to Update

| Model   | Additions                                                    |
| ------- | ------------------------------------------------------------ |
| Product | stockLevels[], physicalInventoryLines[]                      |
| User    | physicalInventoriesCreated[], physicalInventoriesConfirmed[] |

---

## 9. Security & Permissions

### Permission Matrix

| Action            | ADMIN | INVENTORY_MANAGER | STAFF  | Customer |
| ----------------- | ----- | ----------------- | ------ | -------- |
| Create Count      | ✅    | ✅                | ❌     | ❌       |
| Add Counts        | ✅    | ✅                | ✅     | ❌       |
| Confirm Count     | ✅    | ✅                | ❌     | ❌       |
| Complete Count    | ✅    | ✅                | ❌     | ❌       |
| View Reports      | ✅    | ✅                | ✅     | ❌       |
| Edit (DRAFT only) | ✅    | ✅                | ⚠️ Own | ❌       |
| Delete            | ✅    | ❌                | ❌     | ❌       |

---

## 10. Migration Strategy

### For Existing Inventory

When introducing multi-location:

```typescript
// Add migration script to populate StockLevel
async function migrateToLocationBasedStock() {
  const products = await prisma.product.findMany();
  const defaultLocation = await prisma.location.findUnique({
    where: { code: "DEFAULT" },
  });

  for (const product of products) {
    await prisma.stockLevel.create({
      data: {
        productId: product.id,
        locationId: defaultLocation.id,
        quantity: product.stockQuantity,
      },
    });
  }
}
```

---

## 11. Comparison with Odoo - Feature Parity

### Achieving 100% Parity

| Feature             | Odoo | Your App (After Plan) | Notes              |
| ------------------- | ---- | --------------------- | ------------------ |
| Create Count        | ✅   | ✅                    | Full support       |
| Count Products      | ✅   | ✅                    | Line-by-line       |
| Barcode Scanning    | ✅   | ✅                    | Planned Phase 2    |
| Variance Tracking   | ✅   | ✅                    | Auto-calculated    |
| Approval Workflow   | ✅   | ✅                    | DRAFT→CONFIRM→DONE |
| Auto-Reconciliation | ✅   | ✅                    | Updates stock      |
| Location Counting   | ✅   | ✅                    | Multi-warehouse    |
| Reports             | ✅   | ✅                    | Comprehensive      |
| Batch/Expiry        | ✅   | ✅                    | Planned Phase 2    |
| Cycle Counting      | ✅   | ⚠️                    | Future enhancement |

**Achievement: 85-90% parity by Week 4**

---

## 12. File Structure

### New Files to Create

```
prisma/
  schema.prisma (modified - add models)

services/
  physical-inventory.service.ts (new)

lib/
  validations/
    physical-inventory.schema.ts (new)

app/api/
  physical-inventory/
    route.ts (GET/POST)
    [id]/
      route.ts (GET/PUT)
      confirm/
        route.ts (POST)
      complete/
        route.ts (POST)
      lines/
        route.ts (GET/POST/PUT)
      reports/
        variance/
          route.ts (GET)

app/dashboard/inventory/
  physical-count/
    page.tsx (list)
    [id]/
      page.tsx (detail view)
      count/
        page.tsx (counting interface)
      reports/
        page.tsx (variance reports)

components/inventory/
  physical-count/
    physical-inventory-list.tsx
    physical-inventory-form.tsx
    count-interface.tsx
    count-table.tsx
    variance-report.tsx
    barcode-scanner.tsx
    count-line-input.tsx

types/
  physical-inventory.types.ts (new)
```

---

## 13. Conclusion

Your application has a **solid foundation** for implementing physical inventory:

✅ **Ready Now:**

- Database (Prisma)
- Authentication (NextAuth)
- Validation (Zod)
- API pattern established
- UI components available

🔄 **Need to Build:**

- Location/StockLevel models
- Physical inventory models & service
- Counting workflows
- Variance reporting
- Optional: Barcode integration

📊 **Expected Outcome:**

- 4-5 weeks to MVP
- 85%+ feature parity with Odoo
- Professional-grade physical inventory system
- Ready for production use

---

## 14. Recommended Next Step

**Start with Phase 1 (Data Model Design):**

1. Review and approve the Prisma schema additions
2. Create migration: `npm run prisma:migrate`
3. Seed default locations
4. Begin Phase 2 (Services Development)

Would you like me to proceed with implementing any specific phase?
