# Global Currency Configuration Guide

## Overview

The application now uses a **centralized currency configuration system** that allows you to change the currency globally and have it reflected across all modules, components, and pages automatically.

## 🎯 Quick Start

### Change Currency in 1 Step

Edit this file: **`lib/currency.ts`**

Find this line (around line 45):

```typescript
export const ACTIVE_CURRENCY: CurrencyType = "INR";
```

Change `'INR'` to any of these options:

- `'INR'` - Indian Rupee (₹) - **Current**
- `'USD'` - US Dollar ($)
- `'EUR'` - Euro (€)
- `'GBP'` - British Pound (£)
- `'JPY'` - Japanese Yen (¥)

**That's it!** All displays will update automatically.

---

## 📋 Supported Currencies

| Code | Symbol | Locale | Decimals | Example    |
| ---- | ------ | ------ | -------- | ---------- |
| INR  | ₹      | en-IN  | 2        | ₹10,000.00 |
| USD  | $      | en-US  | 2        | $10,000.00 |
| EUR  | €      | de-DE  | 2        | €10.000,00 |
| GBP  | £      | en-GB  | 2        | £10,000.00 |
| JPY  | ¥      | ja-JP  | 0        | ¥10000     |

---

## 📁 Files Using Currency Configuration

### Core Configuration

- **`lib/currency.ts`** - Central currency utility and configuration

### Updated Components

- **Daybook Module:**

  - `components/daybook/daybook-summary.tsx`
  - `components/daybook/entries-list.tsx`
  - `components/daybook/denomination-counter.tsx`

- **Customer Module:**

  - `components/customers/customer-table.tsx`
  - `components/customers/customer-card.tsx`
  - `app/dashboard/customers/[id]/orders/page.tsx`

- **Payment Module:**

  - `components/payments/payment-table.tsx`
  - `app/dashboard/payments/[id]/page.tsx`

- **POS Module:**

  - `components/pos/numeric-keypad.tsx`

- **Analytics Module:**
  - `app/dashboard/analytics/page.tsx`

---

## 💻 Usage Examples

### In Components

```typescript
import { formatCurrency } from '@/lib/currency';

// Basic usage
<p>{formatCurrency(10000)}</p>
// Output (if INR): ₹10,000.00

// Without symbol
<p>{formatCurrency(10000, false)}</p>
// Output: 10,000.00

// Custom decimals
<p>{formatCurrency(10000, true, 0)}</p>
// Output (if INR): ₹10,000

// Custom decimals without symbol
<p>{formatCurrency(10000, false, 1)}</p>
// Output: 10,000.0
```

### Import and Use

```typescript
// Import the formatting function
import { formatCurrency } from "@/lib/currency";

// In your component
export function MyComponent() {
  const amount = 5000;

  return (
    <div>
      <p>Price: {formatCurrency(amount)}</p>
      {/* Output: ₹5,000.00 (for INR) */}
    </div>
  );
}
```

### Get Currency Information

```typescript
import {
  getCurrencySymbol,
  getCurrencyCode,
  getCurrencyLocale,
  getCurrencyDecimals,
} from "@/lib/currency";

// Get symbol
const symbol = getCurrencySymbol(); // '₹'

// Get code
const code = getCurrencyCode(); // 'INR'

// Get locale for formatting
const locale = getCurrencyLocale(); // 'en-IN'

// Get decimal places
const decimals = getCurrencyDecimals(); // 2
```

### Advanced: Intl.NumberFormat

```typescript
import { getCurrencyFormatter } from "@/lib/currency";

const formatter = getCurrencyFormatter();
console.log(formatter.format(10000)); // ₹10,000.00
```

---

## 🔄 How It Works

### Currency Configuration Structure

```typescript
const CURRENCY_SETTINGS = {
  INR: {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
    decimals: 2,
  },
  USD: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
    decimals: 2,
  },
  // ... more currencies
};
```

### The `formatCurrency()` Function

```typescript
export function formatCurrency(
  amount: number | string,
  showSymbol: boolean = true,
  customDecimals?: number
): string {
  // 1. Get current currency config
  const config = getCurrencyConfig();

  // 2. Parse amount to number
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  // 3. Use Intl.toLocaleString for proper formatting
  const formatted = num.toLocaleString(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // 4. Add symbol if requested
  return showSymbol ? `${config.symbol}${formatted}` : formatted;
}
```

---

## 🚀 Migration Steps (Already Done)

If you're adding currency formatting to a new component:

### Step 1: Import the utility

```typescript
import { formatCurrency } from "@/lib/currency";
```

### Step 2: Replace hardcoded currency formatting

**Before:**

```typescript
₹{amount.toLocaleString('en-IN')}
```

**After:**

```typescript
{
  formatCurrency(amount);
}
```

### Step 3: Test

Change `ACTIVE_CURRENCY` in `lib/currency.ts` and verify the display updates.

---

## ✅ Modules Already Updated

The following modules have been updated to use the centralized currency:

1. **Daybook Module** ✅

   - Opening/closing balances
   - Expected/actual cash
   - Variance display
   - Denomination counter

2. **Customer Module** ✅

   - Customer list (credit limit, outstanding)
   - Customer card (credit limit, outstanding)
   - Orders page (total amount, balance due, item prices)

3. **Payment Module** ✅

   - Payment table (all amounts)
   - Payment detail page (all amounts)

4. **POS Module** ✅

   - Numeric keypad (decimal formatting with locale)

5. **Analytics Module** ✅
   - Revenue tables

---

## 🔧 Configuration Details

### Why Each Currency is Configured

**INR (Indian Rupee)**

- Uses en-IN locale for proper Indian number formatting
- Shows 2 decimal places
- Symbol: ₹ (placed before number)

**USD (US Dollar)**

- Uses en-US locale
- Shows 2 decimal places
- Symbol: $

**EUR (Euro)**

- Uses de-DE locale (European format)
- Shows 2 decimal places
- Symbol: € (placed after number in European format)

**GBP (British Pound)**

- Uses en-GB locale
- Shows 2 decimal places
- Symbol: £

**JPY (Japanese Yen)**

- Uses ja-JP locale
- Shows 0 decimal places (no cents in JPY)
- Symbol: ¥

---

## 📊 Examples by Currency

Same amount: 10,000

| Currency | Format     |
| -------- | ---------- |
| INR      | ₹10,000.00 |
| USD      | $10,000.00 |
| EUR      | €10.000,00 |
| GBP      | £10,000.00 |
| JPY      | ¥10000     |

---

## 🔍 Verification Checklist

After changing the currency, verify these locations update:

- [ ] Daybook opening cash display
- [ ] Daybook closing cash display
- [ ] Customer credit limit in table
- [ ] Customer outstanding in table
- [ ] Order total amount
- [ ] Order balance due (red text)
- [ ] Order item prices in expandable rows
- [ ] Payment amounts in table
- [ ] Payment detail page amounts
- [ ] POS session amounts
- [ ] Numeric keypad displays

---

## 🛠️ Troubleshooting

### Currency not updating

1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Check `ACTIVE_CURRENCY` value in `lib/currency.ts`
4. Verify import: `import { formatCurrency } from '@/lib/currency';`

### Wrong locale/formatting

1. Check the currency is spelled correctly (case-sensitive)
2. Verify the currency exists in `CURRENCY_SETTINGS`
3. Check component is importing from correct path

### Adding new currency

1. Edit `lib/currency.ts`
2. Add to `CURRENCY_SETTINGS`:
   ```typescript
   CAD: {
     code: 'CAD',
     symbol: 'C$',
     locale: 'en-CA',
     decimals: 2,
   }
   ```
3. Add to `CurrencyType`:
   ```typescript
   export type CurrencyType = "INR" | "USD" | "EUR" | "GBP" | "JPY" | "CAD";
   ```

---

## 📝 Notes

- All amounts are formatted **consistently** across the app
- **No hardcoded currency symbols** in components
- **Single source of truth** for currency settings
- **Locale-aware** formatting (respects regional number formatting)
- **Type-safe** with TypeScript support

---

## 🎓 Best Practices

1. **Always use `formatCurrency()`** for displaying monetary values
2. **Never hardcode** currency symbols or locale strings
3. **Use `formatCurrencyNumber()`** when you need just the formatted number
4. **Import from** `@/lib/currency` consistently
5. **Test with different currencies** after implementation

---

## 📞 Support

If you need to:

- Add a new currency: Edit `CURRENCY_SETTINGS` in `lib/currency.ts`
- Add formatting to a new component: Import and use `formatCurrency()`
- Change the active currency: Update `ACTIVE_CURRENCY` in `lib/currency.ts`

**Configuration File:** `lib/currency.ts`  
**Last Updated:** January 16, 2026
