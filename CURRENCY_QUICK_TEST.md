# Quick Test - Currency Consistency Verification

## 🎯 Test the Fix in 2 Minutes

### What You'll Do

Test that both customer pages now show the **same currency** and that you can **change it globally**.

---

## ✅ Test 1: Verify Both Pages Match (Current Currency)

### Page 1: Customer Detail

1. Open: `http://localhost:3000/dashboard/customers/e70cd89e-e564-4c2c-baaa-a4440369e77e`
2. Look for: **"Credit Limit"** field
3. Note the currency symbol and amount
   - **Expected (if INR):** ₹50,000.00
   - **Expected (if USD):** $50,000.00

### Page 2: Customer Orders

1. Open: `http://localhost:3000/dashboard/customers/e70cd89e-e564-4c2c-baaa-a4440369e77e/orders`
2. Look for: Any **order amount** in the table
3. Note the currency symbol
   - **Expected (if INR):** ₹10,000.00
   - **Expected (if USD):** $10,000.00

### Check If They Match ✓

- Do both pages show the **same currency symbol**?
- Do both show the **same format**?
- **YES?** → Fix is working! Continue to Test 2.
- **NO?** → Check if dev server restarted properly, refresh browser.

---

## 🔄 Test 2: Change Currency Globally

### Step 1: Edit the Configuration File

1. Open: `lib/currency.ts`
2. Find line ~45 (search for "ACTIVE_CURRENCY")
3. You'll see:
   ```typescript
   export const ACTIVE_CURRENCY: CurrencyType = "INR";
   ```

### Step 2: Change Currency to USD

Replace the line with:

```typescript
export const ACTIVE_CURRENCY: CurrencyType = "USD";
```

Save the file (Ctrl+S or Cmd+S)

### Step 3: Refresh Browser Pages

- Refresh Page 1 (Customer Detail)
- Refresh Page 2 (Customer Orders)

### Step 4: Verify Both Changed

Look for amounts on both pages:

**Customer Detail Page (Page 1):**

- Should now show: **$50,000.00** (dollar sign)

**Customer Orders Page (Page 2):**

- Should now show: **$10,000.00** (dollar sign)

### Check If Both Updated ✓

- Do both pages show **$** instead of **₹**?
- **YES?** → Currency configuration is working globally! ✅
- **NO?** → Clear browser cache and refresh.

---

## 🔙 Test 3: Change Back to INR

### Step 1: Edit Configuration Again

1. Open: `lib/currency.ts`
2. Change line 45 back to:
   ```typescript
   export const ACTIVE_CURRENCY: CurrencyType = "INR";
   ```

Save the file.

### Step 2: Refresh Both Pages

- Refresh Customer Detail page
- Refresh Customer Orders page

### Step 3: Verify Both Reverted

Both pages should show **₹** again:

- Customer Detail: **₹50,000.00**
- Customer Orders: **₹10,000.00**

### Result ✓

If both pages match and change together, the fix is working perfectly!

---

## 🎯 Summary

| Test   | Checks                          | Result |
| ------ | ------------------------------- | ------ |
| Test 1 | Both pages show same currency   | ✅     |
| Test 2 | Change to USD affects both      | ✅     |
| Test 3 | Change back to INR affects both | ✅     |

**If all tests pass:** Currency implementation is working correctly! ✨

---

## 🔧 Configuration Options

When changing `ACTIVE_CURRENCY` in `lib/currency.ts`, you can use:

```typescript
"INR"; // Indian Rupee (₹)
"USD"; // US Dollar ($)
"EUR"; // Euro (€)
"GBP"; // British Pound (£)
"JPY"; // Japanese Yen (¥)
```

---

## 📝 What Was Fixed

**Before:**

- ❌ Customer Detail page: USD ($)
- ❌ Customer Orders page: INR (₹)
- ❌ Inconsistent

**After:**

- ✅ Customer Detail page: Uses global setting
- ✅ Customer Orders page: Uses global setting
- ✅ Consistent and synchronized

---

## 💡 How It Works Now

```
lib/currency.ts (ACTIVE_CURRENCY = 'INR')
           ↓
    ┌──────┴──────┐
    ↓             ↓
Customer      Customer
Detail        Orders
Page          Page
    ↓             ↓
  ₹             ₹
(Same!)     (Same!)
```

Change the configuration once → All pages update! 🚀

---

**Test Duration:** ~2 minutes  
**Difficulty:** Very easy  
**Status:** Ready to test
