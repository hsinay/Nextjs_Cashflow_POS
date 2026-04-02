# Physical Inventory - Quick Reference & Code Examples

## Quick Start Guide

This document provides code templates and ready-to-use examples for implementing the physical inventory feature.

---

## 1. Database Schema (Ready to Copy-Paste)

Add these to `prisma/schema.prisma`:

```prisma
// ============== ENUMS ==============

enum PhysicalInventoryStatus {
  DRAFT
  CONFIRMED
  DONE
}

enum CountMethod {
  FULL_COUNT
  PARTIAL_COUNT
  CYCLE_COUNT
}

// ============== MODELS ==============

model Location {
  id              String      @id @default(uuid())
  name            String      @unique
  code            String      @unique
  description     String?
  type            String      // WAREHOUSE, SECTION, SHELF
  parentLocationId String?
  parentLocation  Location?   @relation("LocationHierarchy", fields: [parentLocationId], references: [id])
  childLocations  Location[]  @relation("LocationHierarchy")
  isActive        Boolean     @default(true)

  physicalCounts  PhysicalInventory[]
  stockLevels     StockLevel[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([parentLocationId])
  @@map("locations")
}

model StockLevel {
  id              String      @id @default(uuid())
  productId       String
  locationId      String
  quantity        Int         @default(0)

  product         Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  location        Location    @relation(fields: [locationId], references: [id], onDelete: Cascade)

  updatedAt       DateTime    @updatedAt

  @@unique([productId, locationId])
  @@index([productId])
  @@index([locationId])
  @@map("stock_levels")
}

model PhysicalInventory {
  id                  String                      @id @default(uuid())
  referenceNumber     String                      @unique
  locationId          String
  location            Location                    @relation(fields: [locationId], references: [id])

  status              PhysicalInventoryStatus     @default(DRAFT)

  countDate           DateTime
  countMethod         CountMethod                 @default(FULL_COUNT)
  notes               String?

  createdById         String
  createdBy           User                        @relation("PhysicalInventoryCreatedBy", fields: [createdById], references: [id])
  confirmedById       String?
  confirmedBy         User?                       @relation("PhysicalInventoryConfirmedBy", fields: [confirmedById], references: [id])
  confirmedAt         DateTime?

  totalVariance       Int                         @default(0)
  variancePercentage  Decimal?                    @db.Decimal(5,2)

  lines               PhysicalInventoryLine[]

  createdAt           DateTime                    @default(now())
  updatedAt           DateTime                    @updatedAt

  @@index([locationId])
  @@index([status])
  @@index([countDate])
  @@map("physical_inventories")
}

model PhysicalInventoryLine {
  id                      String                  @id @default(uuid())
  physicalInventoryId     String
  physicalInventory       PhysicalInventory       @relation(fields: [physicalInventoryId], references: [id], onDelete: Cascade)

  productId               String
  product                 Product                 @relation(fields: [productId], references: [id])

  systemQuantity          Int                     // Stock before count
  physicalQuantity        Int?                    // Actual count
  variance                Int?                    // Computed: physical - system

  batchNumber             String?
  expiryDate              DateTime?
  notes                   String?

  countedBy               String?
  countedAt               DateTime?
  isVerified              Boolean                 @default(false)

  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt

  @@unique([physicalInventoryId, productId, batchNumber])
  @@index([physicalInventoryId])
  @@index([productId])
  @@map("physical_inventory_lines")
}

// Update Product Model - Add these relations:
// In existing model Product, add:
// stockLevels         StockLevel[]
// physicalInventoryLines PhysicalInventoryLine[]

// Update User Model - Add these relations:
// In existing model User, add:
// physicalInventoriesCreatedBy    PhysicalInventory[] @relation("PhysicalInventoryCreatedBy")
// physicalInventoriesConfirmedBy  PhysicalInventory[] @relation("PhysicalInventoryConfirmedBy")
```

---

## 2. Type Definitions

**File: `types/physical-inventory.types.ts`**

```typescript
export interface Location {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: string;
  parentLocationId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLevel {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  updatedAt: Date;
}

export interface PhysicalInventoryLine {
  id: string;
  physicalInventoryId: string;
  productId: string;
  systemQuantity: number;
  physicalQuantity: number | null;
  variance: number | null;
  batchNumber: string | null;
  expiryDate: Date | null;
  notes: string | null;
  countedBy: string | null;
  countedAt: Date | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  product?: {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
  };
}

export interface PhysicalInventory {
  id: string;
  referenceNumber: string;
  locationId: string;
  status: "DRAFT" | "CONFIRMED" | "DONE";
  countDate: Date;
  countMethod: "FULL_COUNT" | "PARTIAL_COUNT" | "CYCLE_COUNT";
  notes: string | null;

  createdById: string;
  confirmedById: string | null;
  confirmedAt: Date | null;

  totalVariance: number;
  variancePercentage: number | null;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  location?: Location;
  lines?: PhysicalInventoryLine[];
  createdBy?: { id: string; username: string };
  confirmedBy?: { id: string; username: string };
}

export interface VarianceReport {
  totalProductsCount: number;
  countedProductsCount: number;
  uncountedProductsCount: number;
  totalVariance: number;
  accuracyPercentage: number;

  highVarianceItems: Array<{
    productId: string;
    productName: string;
    sku: string;
    systemQty: number;
    physicalQty: number;
    variance: number;
    variancePercent: number;
  }>;

  missingItems: Array<{
    productId: string;
    productName: string;
    systemQty: number;
    notes?: string;
  }>;

  excessItems: Array<{
    productId: string;
    productName: string;
    physicalQty: number;
  }>;
}
```

---

## 3. Zod Validation Schemas

**File: `lib/validations/physical-inventory.schema.ts`**

```typescript
import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  type: z.enum(["WAREHOUSE", "SECTION", "SHELF"]),
  parentLocationId: z.string().uuid().optional().nullable(),
});

export const createPhysicalInventorySchema = z.object({
  locationId: z.string().uuid("Location must be a valid UUID"),
  countDate: z.coerce.date(),
  countMethod: z.enum(["FULL_COUNT", "PARTIAL_COUNT", "CYCLE_COUNT"]),
  productIds: z.array(z.string().uuid()).optional(),
  notes: z.string().max(500).optional(),
});

export const addCountLineSchema = z.object({
  physicalInventoryId: z.string().uuid(),
  productId: z.string().uuid(),
  physicalQuantity: z.number().int().min(0).max(999999),
  batchNumber: z.string().max(100).optional(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
  countedBy: z.string().optional(),
});

export const updateCountLineSchema = z.object({
  physicalQuantity: z.number().int().min(0).max(999999).optional(),
  notes: z.string().max(500).optional(),
  isVerified: z.boolean().optional(),
});

export const confirmPhysicalInventorySchema = z.object({
  physicalInventoryId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const completePhysicalInventorySchema = z.object({
  physicalInventoryId: z.string().uuid(),
  autoAdjust: z.boolean().default(true),
});

// Type exports
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreatePhysicalInventoryInput = z.infer<
  typeof createPhysicalInventorySchema
>;
export type AddCountLineInput = z.infer<typeof addCountLineSchema>;
export type UpdateCountLineInput = z.infer<typeof updateCountLineSchema>;
export type ConfirmPhysicalInventoryInput = z.infer<
  typeof confirmPhysicalInventorySchema
>;
export type CompletePhysicalInventoryInput = z.infer<
  typeof completePhysicalInventorySchema
>;
```

---

## 4. Service Implementation (Core Functions)

**File: `services/physical-inventory.service.ts`**

```typescript
import { prisma } from "@/lib/prisma";
import {
  CreatePhysicalInventoryInput,
  AddCountLineInput,
} from "@/lib/validations/physical-inventory.schema";

// Generate reference number
async function generateReferenceNumber(locationCode: string): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const countToday = await prisma.physicalInventory.count({
    where: {
      createdAt: {
        gte: new Date(year, today.getMonth(), today.getDate()),
        lt: new Date(year, today.getMonth(), today.getDate() + 1),
      },
    },
  });

  const sequence = String(countToday + 1).padStart(3, "0");
  return `PI-${locationCode}-${year}${month}${day}-${sequence}`;
}

/**
 * Create a new physical inventory session
 */
export async function createPhysicalInventory(
  data: CreatePhysicalInventoryInput,
  userId: string,
): Promise<any> {
  const location = await prisma.location.findUnique({
    where: { id: data.locationId },
  });

  if (!location) throw new Error("Location not found");

  const referenceNumber = await generateReferenceNumber(location.code);

  return await prisma.$transaction(async (tx) => {
    // Create PI record
    const pi = await tx.physicalInventory.create({
      data: {
        referenceNumber,
        locationId: data.locationId,
        countDate: data.countDate,
        countMethod: data.countMethod,
        notes: data.notes,
        createdById: userId,
        status: "DRAFT",
      },
      include: {
        location: true,
        createdBy: { select: { id: true, username: true } },
      },
    });

    // Get products to count
    let productsToCount;
    if (data.countMethod === "FULL_COUNT") {
      // Get all products with stock in this location
      productsToCount = await tx.stockLevel.findMany({
        where: { locationId: data.locationId },
        include: { product: true },
      });
    } else if (data.productIds?.length) {
      // Get specific products
      productsToCount = await tx.stockLevel.findMany({
        where: {
          locationId: data.locationId,
          productId: { in: data.productIds },
        },
        include: { product: true },
      });
    }

    // Create count lines
    if (productsToCount?.length) {
      await tx.physicalInventoryLine.createMany({
        data: productsToCount.map((sl) => ({
          physicalInventoryId: pi.id,
          productId: sl.productId,
          systemQuantity: sl.quantity,
          physicalQuantity: null,
          variance: null,
        })),
      });
    }

    return pi;
  });
}

/**
 * Add or update a count line
 */
export async function addCountLine(
  data: AddCountLineInput,
  userId: string,
): Promise<any> {
  const pi = await prisma.physicalInventory.findUnique({
    where: { id: data.physicalInventoryId },
  });

  if (!pi) throw new Error("Physical inventory not found");
  if (pi.status !== "DRAFT")
    throw new Error("Can only add counts to DRAFT inventories");

  // Check if line exists
  const existingLine = await prisma.physicalInventoryLine.findFirst({
    where: {
      physicalInventoryId: data.physicalInventoryId,
      productId: data.productId,
      batchNumber: data.batchNumber || null,
    },
  });

  if (existingLine) {
    // Update existing
    const variance = data.physicalQuantity - existingLine.systemQuantity;
    return await prisma.physicalInventoryLine.update({
      where: { id: existingLine.id },
      data: {
        physicalQuantity: data.physicalQuantity,
        variance,
        notes: data.notes,
        countedBy: userId,
        countedAt: new Date(),
      },
      include: { product: true },
    });
  } else {
    // Create new
    const variance =
      data.physicalQuantity -
        (await getSystemQuantity(data.productId, data.physicalInventoryId)) ||
      0;
    return await prisma.physicalInventoryLine.create({
      data: {
        physicalInventoryId: data.physicalInventoryId,
        productId: data.productId,
        systemQuantity: await getSystemQuantity(
          data.productId,
          data.physicalInventoryId,
        ),
        physicalQuantity: data.physicalQuantity,
        variance,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        notes: data.notes,
        countedBy: userId,
        countedAt: new Date(),
      },
      include: { product: true },
    });
  }
}

/**
 * Get system quantity for a product in PI
 */
async function getSystemQuantity(
  productId: string,
  piId: string,
): Promise<number> {
  const pi = await prisma.physicalInventory.findUnique({
    where: { id: piId },
  });

  const stockLevel = await prisma.stockLevel.findUnique({
    where: {
      productId_locationId: {
        productId,
        locationId: pi!.locationId,
      },
    },
  });

  return stockLevel?.quantity || 0;
}

/**
 * Confirm physical inventory (move to CONFIRMED state)
 */
export async function confirmPhysicalInventory(
  piId: string,
  userId: string,
): Promise<any> {
  const pi = await prisma.physicalInventory.findUnique({
    where: { id: piId },
    include: { lines: true },
  });

  if (!pi) throw new Error("Physical inventory not found");
  if (pi.status !== "DRAFT")
    throw new Error("Can only confirm DRAFT inventories");

  // Calculate total variance
  const totalVariance = pi.lines.reduce(
    (sum, line) => sum + (line.variance || 0),
    0,
  );
  const countedLines = pi.lines.filter(
    (l) => l.physicalQuantity !== null,
  ).length;
  const variancePercentage =
    pi.lines.length > 0
      ? Number(((countedLines / pi.lines.length) * 100).toFixed(2))
      : 0;

  return await prisma.physicalInventory.update({
    where: { id: piId },
    data: {
      status: "CONFIRMED",
      confirmedById: userId,
      confirmedAt: new Date(),
      totalVariance,
      variancePercentage,
    },
  });
}

/**
 * Complete physical inventory and auto-adjust stock
 */
export async function completePhysicalInventory(
  piId: string,
  userId: string,
): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const pi = await tx.physicalInventory.findUnique({
      where: { id: piId },
      include: { lines: true, location: true },
    });

    if (!pi) throw new Error("Physical inventory not found");
    if (pi.status !== "CONFIRMED")
      throw new Error("Can only complete CONFIRMED inventories");

    // Process each line with variance
    for (const line of pi.lines) {
      if (line.variance !== null && line.variance !== 0) {
        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            productId: line.productId,
            type: line.variance > 0 ? "ADJUSTMENT" : "ADJUSTMENT", // Could differentiate
            quantity: Math.abs(line.variance),
            referenceId: piId,
            notes: `Physical count adjustment - ${line.variance > 0 ? "Excess" : "Shortage"} from ${pi.referenceNumber}`,
          },
        });

        // Update stock level
        await tx.stockLevel.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: pi.locationId,
            },
          },
          data: {
            quantity: {
              increment: line.variance,
            },
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stockQuantity: {
              increment: line.variance,
            },
          },
        });
      }
    }

    // Mark as done
    return await tx.physicalInventory.update({
      where: { id: piId },
      data: { status: "DONE" },
    });
  });
}

/**
 * Get variance report
 */
export async function getVarianceReport(piId: string): Promise<any> {
  const pi = await prisma.physicalInventory.findUnique({
    where: { id: piId },
    include: {
      lines: {
        include: { product: true },
        orderBy: { variance: { sort: "desc", nulls: "last" } },
      },
    },
  });

  if (!pi) throw new Error("Physical inventory not found");

  const highVarianceItems = pi.lines
    .filter((l) => l.variance && Math.abs(l.variance) > 0)
    .slice(0, 10);

  const missingItems = pi.lines.filter((l) => !l.physicalQuantity);
  const countedLines = pi.lines.filter((l) => l.physicalQuantity);

  return {
    referenceNumber: pi.referenceNumber,
    totalProductsCount: pi.lines.length,
    countedProductsCount: countedLines.length,
    uncountedProductsCount: missingItems.length,
    totalVariance: pi.totalVariance,
    accuracyPercentage: pi.variancePercentage,

    highVarianceItems,
    missingItems,

    completionStatus: `${countedLines.length}/${pi.lines.length} items counted`,
  };
}
```

---

## 5. API Route Examples

**File: `app/api/physical-inventory/route.ts`**

```typescript
import { authOptions } from "@/lib/auth";
import { createPhysicalInventorySchema } from "@/lib/validations/physical-inventory.schema";
import {
  createPhysicalInventory,
  listPhysicalInventories,
} from "@/services/physical-inventory.service"; // TBD
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      locationId: searchParams.get("locationId") || undefined,
      status: searchParams.get("status") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await listPhysicalInventories(filters);

    return NextResponse.json({
      success: true,
      data: result.inventories,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPhysicalInventorySchema.parse(body);

    const result = await createPhysicalInventory(validated, session.user.id);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
```

---

## 6. React Hook Component Example

**File: `components/inventory/physical-count/create-inventory-form.tsx`**

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createPhysicalInventorySchema, CreatePhysicalInventoryInput } from '@/lib/validations/physical-inventory.schema';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Location } from '@/types/physical-inventory.types';

interface CreateInventoryFormProps {
  locations: Location[];
}

export function CreateInventoryForm({ locations }: CreateInventoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreatePhysicalInventoryInput>({
    resolver: zodResolver(createPhysicalInventorySchema),
    defaultValues: {
      locationId: '',
      countDate: new Date(),
      countMethod: 'FULL_COUNT',
    },
  });

  async function onSubmit(data: CreatePhysicalInventoryInput) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/physical-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create physical inventory');

      const result = await res.json();
      router.push(`/dashboard/inventory/physical-count/${result.data.id}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Physical Inventory Count</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name} ({loc.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Count Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Count Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_COUNT">Full Count (All Products)</SelectItem>
                      <SelectItem value="PARTIAL_COUNT">Partial Count (Selected Products)</SelectItem>
                      <SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Physical Inventory'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 7. Quick Implementation Checklist

- [ ] **Step 1: Database**
  - [ ] Add Location model
  - [ ] Add StockLevel model
  - [ ] Add PhysicalInventory model
  - [ ] Add PhysicalInventoryLine model
  - [ ] Add enums (PhysicalInventoryStatus, CountMethod)
  - [ ] Run migration: `npm run prisma:migrate`
  - [ ] Seed default locations

- [ ] **Step 2: Types & Validation**
  - [ ] Create `types/physical-inventory.types.ts`
  - [ ] Create `lib/validations/physical-inventory.schema.ts`
  - [ ] Verify Zod schemas

- [ ] **Step 3: Services**
  - [ ] Create `services/physical-inventory.service.ts`
  - [ ] Implement: create, add count, confirm, complete, report

- [ ] **Step 4: API Routes**
  - [ ] Create `/api/physical-inventory/route.ts` (GET, POST)
  - [ ] Create `/api/physical-inventory/[id]/route.ts` (GET, PUT)
  - [ ] Create `/api/physical-inventory/[id]/confirm/route.ts` (POST)
  - [ ] Create `/api/physical-inventory/[id]/complete/route.ts` (POST)
  - [ ] Create `/api/physical-inventory/[id]/lines/route.ts` (GET, POST, PUT)
  - [ ] Test endpoints with Postman/REST Client

- [ ] **Step 5: UI Components**
  - [ ] Create physical-inventory list page
  - [ ] Create physical-inventory detail page
  - [ ] Create create form component
  - [ ] Create count interface component
  - [ ] Create count table component
  - [ ] Create variance report component

- [ ] **Step 6: Testing**
  - [ ] Test full workflow in browser
  - [ ] Test barcode scanning (future)
  - [ ] Test variance calculations
  - [ ] Performance test with large inventory

---

## 8. SQL Queries for Reporting

```sql
-- High Variance Items
SELECT
  pil.product_id,
  p.name,
  p.sku,
  pil.system_quantity,
  pil.physical_quantity,
  pil.variance,
  (pil.variance::decimal / NULLIF(pil.system_quantity, 0) * 100) as variance_percent
FROM physical_inventory_lines pil
JOIN products p ON pil.product_id = p.id
WHERE pil.physical_inventory_id = $1
  AND pil.variance IS NOT NULL
  AND pil.variance != 0
ORDER BY ABS(pil.variance) DESC
LIMIT 10;

-- Variance Summary
SELECT
  COUNT(*) as total_items,
  SUM(CASE WHEN pil.physical_quantity IS NOT NULL THEN 1 ELSE 0 END) as counted_items,
  SUM(CASE WHEN pil.physical_quantity IS NULL THEN 1 ELSE 0 END) as uncounted_items,
  SUM(COALESCE(pil.variance, 0)) as total_variance,
  ROUND((SUM(CASE WHEN pil.physical_quantity IS NOT NULL THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100), 2) as completion_percent
FROM physical_inventory_lines
WHERE physical_inventory_id = $1;
```

---

## 9. Common Patterns

### Pattern: Update with Compute

```typescript
// When updating variance-dependent field, compute variance
const variance = physicalQty - systemQty;
await update({
  physicalQuantity,
  variance,
});
```

### Pattern: Transaction-based Completion

```typescript
// Complete PI with auto-adjustment
await prisma.$transaction(async (tx) => {
  // 1. Create inventory transactions
  // 2. Update stock levels
  // 3. Update product quantities
  // 4. Mark PI as done
});
```

### Pattern: Status Guards

```typescript
// Guard against invalid status transitions
if (pi.status !== "DRAFT") throw new Error("...");
// Proceed with update
```

---

## 10. Testing Data Scripts

```typescript
// Seed test locations
const locations = await prisma.location.createMany({
  data: [
    { name: "Main Warehouse", code: "WH-001", type: "WAREHOUSE" },
    { name: "Secondary Store", code: "ST-001", type: "WAREHOUSE" },
    { name: "Receiving Area", code: "RCV-001", type: "SECTION" },
  ],
});

// Seed test stock levels
const products = await prisma.product.findMany({ take: 10 });
for (const product of products) {
  for (const location of locations) {
    await prisma.stockLevel.create({
      data: {
        productId: product.id,
        locationId: location.id,
        quantity: Math.floor(Math.random() * 100),
      },
    });
  }
}
```

---

## Quick Copy-Paste Commands

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create and run migration
npm run prisma:migrate -- --name "add-physical-inventory"

# View database in Prisma Studio
npm run prisma:studio

# Run seed script
npm run db:seed

# Build the project
npm run build

# Start dev server
npm run dev
```

---

This document provides everything needed to quickly start implementing the physical inventory feature. Start with the schema, then build services, then API routes, and finally UI components.
