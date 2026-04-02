# Day Book Implementation - Complete Setup Guide

This document provides the complete setup for implementing the Day Book and Cash Reconciliation feature.

## IMPLEMENTATION CHECKLIST

### Step 1: Update Prisma Schema

Add the following models to the END of `prisma/schema.prisma` (after all existing models):

```prisma
// Expense Category model for categorizing daily expenses
model ExpenseCategory {
  id          String   @id @default(uuid())
  name        String
  description String?
  code        String?  @unique
  parentCategoryId String? // For hierarchy
  parentCategory ExpenseCategory? @relation("ExpenseCategoryHierarchy", fields: [parentCategoryId], references: [id], onDelete: SetNull)
  childCategories ExpenseCategory[] @relation("ExpenseCategoryHierarchy")

  accountHead String?  // Link to accounting head
  status      ExpenseCategoryStatus @default(ACTIVE)
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  dayBookEntries DayBookEntry[]

  @@index([parentCategoryId])
  @@index([code])
  @@map("expense_categories")
}

// Main Day Book model
model DayBook {
  id                    String          @id @default(uuid())
  date                  DateTime        @unique // One day book per date

  // Opening balances
  openingCashBalance    Decimal         @default(0) // Decimal(19,2)
  openingBankBalance    Decimal         @default(0)

  // Closing balances
  closingCashBalance    Decimal?        // Set when closed
  closingBankBalance    Decimal?

  // Cash reconciliation
  expectedCashBalance   Decimal?        // Calculated during reconciliation
  actualCashBalance     Decimal?        // From denomination count
  cashVariance          Decimal?        // Expected - Actual
  varianceReason        String?         // If variance exceeds tolerance

  // Status tracking
  status                DayBookStatus   @default(OPEN)
  isReconciled          Boolean         @default(false)
  notes                 String?

  // User tracking
  openedById            String          // User who opened
  openedBy              User            @relation("DayBookOpenedBy", fields: [openedById], references: [id])

  closedById            String?         // User who closed
  closedBy              User?           @relation("DayBookClosedBy", fields: [closedById], references: [id])
  closedAt              DateTime?

  approvedById          String?         // User who approved
  approvedBy            User?           @relation("DayBookApprovedBy", fields: [approvedById], references: [id])
  approvedAt            DateTime?

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  // Relations
  entries               DayBookEntry[]
  denominations         CashDenomination[]

  @@index([date])
  @@index([status])
  @@index([openedById])
  @@map("day_books")
}

// Individual entries in the day book
model DayBookEntry {
  id                    String          @id @default(uuid())
  dayBookId             String
  dayBook               DayBook         @relation(fields: [dayBookId], references: [id], onDelete: Cascade)

  // Entry details
  entryType             DayBookEntryType
  entryDate             DateTime
  description           String

  // Financial details
  amount                Decimal         // Amount of transaction
  paymentMethod         PaymentMethod?

  // Related records
  referenceType         String?         // 'SALES_ORDER', 'PURCHASE_ORDER', 'POS_TRANSACTION', 'PAYMENT'
  referenceId           String?         // ID of the related transaction

  // Party information
  partyType             String?         // 'CUSTOMER', 'SUPPLIER', 'EMPLOYEE'
  partyId               String?
  partyName             String?

  // Accounting
  debitAccount          String?         // Account to be debited
  creditAccount         String?         // Account to be credited

  // Additional info
  expenseCategoryId     String?
  expenseCategory       ExpenseCategory? @relation(fields: [expenseCategoryId], references: [id], onDelete: SetNull)

  notes                 String?
  attachmentUrl         String?         // For receipts, invoices

  // Tracking
  createdById           String
  createdBy             User            @relation(fields: [createdById], references: [id])

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@index([dayBookId])
  @@index([entryType])
  @@index([referenceId])
  @@index([createdById])
  @@map("day_book_entries")
}

// Cash denomination tracking
model CashDenomination {
  id                    String          @id @default(uuid())
  dayBookId             String
  dayBook               DayBook         @relation(fields: [dayBookId], references: [id], onDelete: Cascade)

  // Denomination details
  denomination          Int             // 2000, 500, 100, 50, 20, 10, 5, 2, 1
  quantity              Int             // Count of notes/coins
  totalAmount           Decimal         // quantity * denomination

  notes                 String?         // Any notes about the counting

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@unique([dayBookId, denomination])
  @@index([dayBookId])
  @@map("cash_denominations")
}
```

### Step 2: Add Relations to User Model

Update the User model in prisma/schema.prisma - add these relations after existing relations:

```prisma
daybooksOpened         DayBook[] @relation("DayBookOpenedBy")
daybooksClosed         DayBook[] @relation("DayBookClosedBy")
daybooksApproved       DayBook[] @relation("DayBookApprovedBy")
dayBookEntries         DayBookEntry[]
```

### Step 3: Create Prisma Migration

```bash
npx prisma migrate dev --name add_daybook_models
```

### Step 4: Regenerate Prisma Client

```bash
npx prisma generate
```

## FILES TO CREATE

### 1. Validation Schemas

- `lib/validations/daybook.schema.ts` - Zod schemas for day book operations

### 2. Service Layer

- `services/daybook.service.ts` - Business logic for day book
- `services/daybook-entry.service.ts` - Day book entries management
- `services/expense-category.service.ts` - Expense categories management

### 3. API Routes

- `app/api/daybook/route.ts` - GET/POST for day books
- `app/api/daybook/[id]/route.ts` - PUT/GET for specific day book
- `app/api/daybook/[id]/close/route.ts` - Close a day book
- `app/api/daybook/entries/route.ts` - GET/POST entries
- `app/api/daybook/entries/[id]/route.ts` - PUT/GET specific entry
- `app/api/daybook/[id]/reconcile/route.ts` - Reconciliation endpoint
- `app/api/expense-categories/route.ts` - GET/POST expense categories

### 4. Components

- `components/daybook/daybook-dashboard.tsx` - Main dashboard
- `components/daybook/entry-form.tsx` - Entry creation form
- `components/daybook/reconciliation-interface.tsx` - Cash reconciliation UI
- `components/daybook/denomination-counter.tsx` - Denomination counting
- `components/daybook/entries-list.tsx` - List entries
- `components/daybook/daybook-summary.tsx` - Summary card

### 5. Pages

- `app/(dashboard)/accounting/daybook/page.tsx` - Main dashboard
- `app/(dashboard)/accounting/daybook/entries/page.tsx` - List entries
- `app/(dashboard)/accounting/daybook/entries/[id]/edit/page.tsx` - Edit entry
- `app/(dashboard)/accounting/daybook/reconciliation/page.tsx` - Reconciliation page
- `app/(dashboard)/accounting/daybook/reports/page.tsx` - Reports page

## NEXT STEPS

1. Add schema models to Prisma schema file
2. Create and run migration
3. Create validation schemas
4. Implement service layer
5. Build API routes
6. Create React components
7. Add UI pages
8. Implement integration hooks in existing modules

This feature is ready for step-by-step implementation following existing codebase patterns.
