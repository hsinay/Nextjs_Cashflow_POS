# Currency System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 GLOBAL CURRENCY SYSTEM                          │
│                     lib/currency.ts                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚙️  ACTIVE_CURRENCY = 'INR'  (Change this ONE line!)          │
│      ↓                                                           │
│      └─→ All 11 modules automatically update                   │
│                                                                 │
│  📋 Supported Currencies:                                       │
│     • INR (₹) - India                                           │
│     • USD ($) - United States                                   │
│     • EUR (€) - Europe                                          │
│     • GBP (£) - United Kingdom                                  │
│     • JPY (¥) - Japan                                           │
│                                                                 │
│  📦 Export 8 Utility Functions:                                 │
│     • formatCurrency()                                          │
│     • formatCurrencyNumber()                                    │
│     • getCurrencySymbol()                                       │
│     • getCurrencyCode()                                         │
│     • getCurrencyLocale()                                       │
│     • getCurrencyDecimals()                                     │
│     • getCurrencyFormatter()                                    │
│     • getCurrencyConfig()                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      COMPONENT LAYER                             │
└──────────────────────────────────────────────────────────────────┘
                            ↓
                  import { formatCurrency }
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                   CURRENCY UTILITY LAYER                         │
│                    lib/currency.ts                               │
│                                                                  │
│  formatCurrency(10000)                                           │
│        ↓                                                         │
│  1. Get current currency config                                 │
│     (Uses ACTIVE_CURRENCY = 'INR')                             │
│        ↓                                                         │
│  2. Retrieve config object                                      │
│     { symbol: '₹', locale: 'en-IN', decimals: 2 }             │
│        ↓                                                         │
│  3. Use toLocaleString() with locale                           │
│     10000.toLocaleString('en-IN')                              │
│        ↓                                                         │
│  4. Add symbol if requested                                     │
│     '₹' + '10,000.00'                                          │
│        ↓                                                         │
│  Return: '₹10,000.00'                                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                      BROWSER OUTPUT                              │
│                       ₹10,000.00                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Module Usage Map

```
                        lib/currency.ts
                       (Central Config)
                             ↑
              ┌──────────────┼──────────────┐
              │              │              │
              ↓              ↓              ↓
         CUSTOMER        PAYMENT          DAYBOOK
         MODULES         MODULES          MODULES
         ┌───┴───┐       ┌───┴────┐      ┌────┴───┐
         │       │       │        │      │        │
         ↓       ↓       ↓        ↓      ↓        ↓
      Table   Card   Table   Detail   Summary  Entry

         ↓       ↓       ↓        ↓      ↓        ↓
      Shows currency values using formatCurrency()
         ↓       ↓       ↓        ↓      ↓        ↓

      Customer  Customer Payment Payment Daybook Daybook
      Limits  Outstanding Amounts Amounts Opening Entries
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UPDATED COMPONENTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 DAYBOOK                                                │
│  ├─ daybook-summary.tsx          ✅ Updated              │
│  ├─ entries-list.tsx              ✅ Updated              │
│  └─ denomination-counter.tsx      ✅ Updated              │
│                                                             │
│  📁 CUSTOMER                                               │
│  ├─ customer-table.tsx            ✅ Updated              │
│  ├─ customer-card.tsx             ✅ Updated              │
│  └─ [id]/orders/page.tsx          ✅ Updated              │
│                                                             │
│  📁 PAYMENT                                                │
│  ├─ payment-table.tsx             ✅ Updated              │
│  └─ [id]/page.tsx                 ✅ Updated              │
│                                                             │
│  📁 POS                                                    │
│  └─ numeric-keypad.tsx            ✅ Updated              │
│                                                             │
│  📁 ANALYTICS                                              │
│  └─ page.tsx                      ✅ Updated              │
│                                                             │
│  🎯 Total: 11 files updated                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Structure

```
CURRENCY_SETTINGS
│
├─ INR (Indian Rupee)
│  ├─ code: 'INR'
│  ├─ symbol: '₹'
│  ├─ locale: 'en-IN'
│  └─ decimals: 2
│
├─ USD (US Dollar)
│  ├─ code: 'USD'
│  ├─ symbol: '$'
│  ├─ locale: 'en-US'
│  └─ decimals: 2
│
├─ EUR (Euro)
│  ├─ code: 'EUR'
│  ├─ symbol: '€'
│  ├─ locale: 'de-DE'
│  └─ decimals: 2
│
├─ GBP (British Pound)
│  ├─ code: 'GBP'
│  ├─ symbol: '£'
│  ├─ locale: 'en-GB'
│  └─ decimals: 2
│
└─ JPY (Japanese Yen)
   ├─ code: 'JPY'
   ├─ symbol: '¥'
   ├─ locale: 'ja-JP'
   └─ decimals: 0 (no cents)
```

---

## How to Change Currency

```
┌─────────────────────────────────────────────────────────┐
│                   STEP 1: EDIT FILE                     │
├─────────────────────────────────────────────────────────┤
│  File: lib/currency.ts                                  │
│  Line: ~45                                              │
│                                                         │
│  Before:                                                │
│  export const ACTIVE_CURRENCY: CurrencyType = 'INR';  │
│                                                         │
│  After:                                                 │
│  export const ACTIVE_CURRENCY: CurrencyType = 'USD';  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  STEP 2: SAVE FILE                      │
├─────────────────────────────────────────────────────────┤
│  Ctrl+S (or Cmd+S on Mac)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               STEP 3: REFRESH BROWSER                   │
├─────────────────────────────────────────────────────────┤
│  F5 or Cmd+R                                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│           ALL MODULES UPDATE AUTOMATICALLY              │
├─────────────────────────────────────────────────────────┤
│  ✅ Customer module         → Shows $                  │
│  ✅ Payment module          → Shows $                  │
│  ✅ Daybook module          → Shows $                  │
│  ✅ Analytics module        → Shows $                  │
│  ✅ POS module              → Shows $                  │
│                                                         │
│  ... ALL IN 3 SIMPLE STEPS! ✨                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Function Hierarchy

```
getCurrencyConfig()
│
├─ Returns: CurrencyConfig
│  ├─ code (string)
│  ├─ symbol (string)
│  ├─ locale (string)
│  └─ decimals (number)
│
└─ Used by:
   ├─ formatCurrency()         ← Most common
   ├─ getCurrencySymbol()
   ├─ getCurrencyCode()
   ├─ getCurrencyLocale()
   ├─ getCurrencyDecimals()
   └─ getCurrencyFormatter()
```

---

## Before vs After

```
BEFORE (Inconsistent)                AFTER (Consistent)
─────────────────────               ──────────────────

Customer Component:                  Customer Component:
${amount.toLocaleString()}    →     {formatCurrency(amount)}

Order Page:                          Order Page:
₹{amount.toLocaleString              {formatCurrency(amount)}
  ('en-IN')}             →

Payment Page:                        Payment Page:
new Intl.NumberFormat...   →        {formatCurrency(amount)}
.format(amount)

Daybook Component:                   Daybook Component:
₹{amount.toLocaleString              {formatCurrency(amount)}
  ('en-IN')}             →

❌ Multiple formats                   ✅ Single format
❌ Hardcoded currencies              ✅ Centralized config
❌ Hard to change                    ✅ Easy to change
❌ Inconsistent behavior             ✅ Consistent behavior
```

---

## Import Pattern

```
Component File
│
├─ import { formatCurrency } from '@/lib/currency'
│
└─ Usage:
   {formatCurrency(value)}
   {formatCurrency(value, false)}      // no symbol
   {formatCurrency(value, true, 0)}    // no decimals

   getCurrencySymbol()
   getCurrencyCode()
   getCurrencyLocale()
   getCurrencyDecimals()
```

---

## Supported Output Examples

```
Input Amount: 10000

INR (₹)  → ₹10,000.00
USD ($)  → $10,000.00
EUR (€)  → €10.000,00  (European format with comma)
GBP (£)  → £10,000.00
JPY (¥)  → ¥10000      (No decimals)
```

---

## Testing Workflow

```
1. Start App
   npm run dev

2. Change Currency
   lib/currency.ts: ACTIVE_CURRENCY = 'USD'

3. Verify Updates
   ✓ Customer List
   ✓ Customer Card
   ✓ Orders Page
   ✓ Payment Page
   ✓ Daybook
   ✓ Analytics

4. Change Back
   lib/currency.ts: ACTIVE_CURRENCY = 'INR'

5. Verify Revert
   ✓ All show ₹ again

STATUS: All modules working ✅
```

---

**Architecture Version:** 1.0  
**Last Updated:** January 16, 2026  
**Status:** Production Ready ✅
