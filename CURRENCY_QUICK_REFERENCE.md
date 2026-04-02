# Currency Configuration - Quick Reference

## 🚀 Change Currency in 30 Seconds

### Step 1: Open File

```
lib/currency.ts
```

### Step 2: Find This Line (around line 45)

```typescript
export const ACTIVE_CURRENCY: CurrencyType = "INR";
```

### Step 3: Change to One Of:

```typescript
export const ACTIVE_CURRENCY: CurrencyType = "USD"; // $ US Dollar
export const ACTIVE_CURRENCY: CurrencyType = "EUR"; // € Euro
export const ACTIVE_CURRENCY: CurrencyType = "GBP"; // £ British Pound
export const ACTIVE_CURRENCY: CurrencyType = "JPY"; // ¥ Japanese Yen
export const ACTIVE_CURRENCY: CurrencyType = "INR"; // ₹ Indian Rupee (DEFAULT)
```

### Step 4: Save & Refresh

Done! Everything updates automatically.

---

## 📝 Usage in Components

### Import

```typescript
import { formatCurrency } from "@/lib/currency";
```

### Display Price

```typescript
<div>{formatCurrency(10000)}</div>
// Shows: ₹10,000.00 (if INR)
// Shows: $10,000.00 (if USD)
// Shows: €10.000,00 (if EUR)
// Shows: ¥10000 (if JPY)
```

### Without Symbol

```typescript
<div>{formatCurrency(10000, false)}</div>
// Shows: 10,000.00
```

### Custom Decimals

```typescript
<div>{formatCurrency(10000, true, 0)}</div>
// Shows: ₹10,000 (no decimals)
```

---

## 📊 Supported Currencies

| Code    | Symbol | Example    | Decimals |
| ------- | ------ | ---------- | -------- |
| **INR** | ₹      | ₹10,000.00 | 2        |
| **USD** | $      | $10,000.00 | 2        |
| **EUR** | €      | €10.000,00 | 2        |
| **GBP** | £      | £10,000.00 | 2        |
| **JPY** | ¥      | ¥10000     | 0        |

---

## ✨ What Updates Automatically

When you change `ACTIVE_CURRENCY`, these all update:

✅ Daybook opening/closing balances  
✅ Customer credit limits  
✅ Customer outstanding amounts  
✅ Order totals  
✅ Order balance due  
✅ Payment amounts  
✅ All prices and numeric displays

---

## 🔧 Advanced Usage

### Get Specific Info

```typescript
import { getCurrencySymbol, getCurrencyCode } from "@/lib/currency";

getCurrencySymbol(); // '₹'
getCurrencyCode(); // 'INR'
getCurrencyLocale(); // 'en-IN'
getCurrencyDecimals(); // 2
```

### Use Formatter Object

```typescript
import { getCurrencyFormatter } from "@/lib/currency";

const formatter = getCurrencyFormatter();
formatter.format(10000); // ₹10,000.00
```

---

## 💡 Examples

### Customer Credit Limit

**Before (Hardcoded):**

```typescript
${Number(customer.creditLimit).toLocaleString()}
```

**After (Global):**

```typescript
{
  formatCurrency(customer.creditLimit);
}
```

### Order Amount

**Before:**

```typescript
₹{order.totalAmount.toLocaleString('en-IN')}
```

**After:**

```typescript
{
  formatCurrency(order.totalAmount);
}
```

---

## 📂 Updated Files

- `lib/currency.ts` ⭐ (Main config file)
- `components/daybook/*` (3 files)
- `components/customers/*` (2 files)
- `components/payments/*` (1 file)
- `components/pos/numeric-keypad.tsx`
- `app/dashboard/customers/[id]/orders/page.tsx`
- `app/dashboard/payments/[id]/page.tsx`
- `app/dashboard/analytics/page.tsx`

---

## ✅ Testing

1. Change `ACTIVE_CURRENCY = 'USD'`
2. Refresh browser
3. Verify all amounts show `$` instead of `₹`
4. Change back to `'INR'`
5. Verify all amounts show `₹` again

---

## 🎯 Key Benefits

✨ **Single Configuration** - One place to control all currencies  
✨ **No Hardcoding** - Consistent across all modules  
✨ **Type-Safe** - TypeScript ensures correct usage  
✨ **Locale-Aware** - Proper formatting for each region  
✨ **Easy to Extend** - Add new currencies easily

---

**File Location:** `lib/currency.ts`  
**Change Line:** ~45 - `export const ACTIVE_CURRENCY: CurrencyType = 'INR';`  
**Status:** ✅ Implemented & Tested
