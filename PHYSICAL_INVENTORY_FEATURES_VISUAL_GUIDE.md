# Physical Inventory - Features Quick Guide

## 🎬 Visual Tour (Text Format)

### Homepage Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHYSICAL INVENTORY                             │
│   View and manage stock quantities                               │
└─────────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Total    │  Total   │  Stock   │   Low    │   Out    │
│Products: │  Stock:  │  Value:  │ Stock:   │   of:    │
│   245    │ 12,456   │₹4.5M    │   18     │    3     │
└──────────┴──────────┴──────────┴──────────┴──────────┘

┌──────────────────────────────────────────────────────────┐
│ 🔍 Search... | 📁Category ▼ | 📊Status ▼ | ↑↓ Sort By │ 📥CSV │
├──────────────────────────────────────────────────────────┤
│ ☐ Bulk Edit | Selected: 0 | Qty: ___ | ✓ Update All    │
└──────────────────────────────────────────────────────────┘

┌─ ELECTRONICS (5 products) ▼────────────────────────────┐
│ ☐ │ Product      │ SKU    │ Stock │ Reorder │ Value  │ Status │
├───┼──────────────┼────────┼───────┼─────────┼────────┼────────┤
│ ☐ │ Laptop Pro   │ LP-001 │ 15    │ 10      │ ₹15K   │ ✓ OK   │
│ ☐ │ Monitor 27"  │ MN-027 │ 3     │ 5       │ ₹2.1K  │ ⚠ Low  │
│ ☐ │ Keyboard     │ KB-001 │ 0     │ 20      │ ₹0     │ ⊘ Empty│
│ ☐ │ Mouse Pad    │ MP-001 │ 45    │ 30      │ ₹4.5K  │ ✓ OK   │
│ ☐ │ USB Hub      │ HB-001 │ 12    │ 15      │ ₹2.4K  │ ⚠ Low  │
└─ FURNITURE (3 products) ▼────────────────────────────────┘
│ ☐ │ Desk Oak     │ DK-001 │ 5     │ 8       │ ₹30K   │ ⚠ Low  │
├───┼──────────────┼────────┼───────┼─────────┼────────┼────────┤
│ ☐ │ Chair Black  │ CH-001 │ 12    │ 10      │ ₹36K   │ ✓ OK   │
└───┴──────────────┴────────┴───────┴─────────┴────────┴────────┘
```

---

## 🎯 Feature Walkthrough

### 1️⃣ Statistics At A Glance

```
┌─────────────────────────────────────────────────────┐
│ Blue Card  │ Green Card │ Purple Card │ Yellow │ Red │
│ 245 Total  │ 12,456     │ ₹4,567,890  │   18   │  3  │
│ Products   │ Stock Qty  │ Total Value │ Low    │Out  │
└─────────────────────────────────────────────────────┘
Updates instantly as you edit products!
```

### 2️⃣ Smart Search

```
Type "laptop" → Filters to:
  • Laptop Pro (LP-001)
  • Laptop Stand (LS-001)

Type "LP-001" → Filters to:
  • Laptop Pro (LP-001)
```

### 3️⃣ Category Filter

```
┌─────────────────────┐
│ All Categories  ▼   │
│ Electronics         │
│ Furniture           │
│ Stationery      (new)
│ Tools               │
└─────────────────────┘

Select → Shows only that category's products
```

### 4️⃣ Stock Status Filter

```
📋 All Stock Levels (default)
├─ In Stock     → qty > 0 AND qty > reorder level
├─ Low Stock    → qty ≤ reorder level (⚠️ warning)
├─ Out of Stock → qty = 0 (⊘ empty)
```

### 5️⃣ Sort Options

```
Current: Sort by Name ↑ Ascending

Click sorting field:
├─ Name          (A→Z or Z→A)
├─ Stock         (low→high or high→low)
├─ Reorder Level (ascending/descending)
├─ Stock Value   (₹ low→high or high→low)
└─ Category      (A→Z or Z→A)

Toggle direction: ↑ ↓
```

### 6️⃣ Single Product Edit

```
Before:
  Product │ Stock │ Reorder │ Status
  ────────┼───────┼─────────┼────────
  Laptop  │ [15]  │ 10      │ ✓ OK   (clickable)

Click "15":
  Product │ Stock │ Reorder │ Status
  ────────┼───────┼─────────┼────────
  Laptop  │ [__20_] [✓] [✗]  │ ✓ OK

After save → Stock changes to 20
            → Audit log created
            → Toast confirms "Stock updated successfully"
```

### 7️⃣ Bulk Edit Mode

```
BEFORE: [__ Bulk Edit] button

AFTER: [__ Cancel Bulk] button (highlighted)

┌─────────────────────────────────────────────────────┐
│ ☐ Select All │ Selected: 0 / 5                      │
├─────────────────────────────────────────────────────┤
│ Qty: [____] | ✓ Update All                         │
└─────────────────────────────────────────────────────┘

FLOW:
  1. Check products (or Select All)
  2. Enter quantity (e.g., "100")
  3. Click "Update All"
  4. All 5 products → 100 units
  5. Toast: "Updated 5 products"
  6. Each gets audit trail entry
```

### 8️⃣ CSV Export

```
Click [📥 Export CSV]
   ↓
Downloads: inventory-2026-04-02.csv
   ↓
Opens in Excel/Sheets with columns:
  Product Name | SKU | Category | Current Stock
  Reorder Level | Unit Cost | Stock Value | Price
  Status | Last Updated (today's date)
   ↓
Analyze, pivot, share with team!
```

---

## 📊 Status Badge Guide

| Badge   | Meaning          | Trigger             | Color         |
| ------- | ---------------- | ------------------- | ------------- |
| ✓ OK    | Stock sufficient | qty > reorder level | 🟢 Green      |
| ⚠️ Low  | Below reorder    | qty ≤ reorder level | 🟡 Yellow row |
| ⊘ Empty | No stock         | qty = 0             | ⚪ Gray       |

---

## 🔐 Permissions

✅ **Who can access:**

- ADMIN role
- INVENTORY_MANAGER role

❌ **Who cannot:**

- Viewers
- Sales staff
- Any other role

→ Redirects to `/dashboard` if no permission

---

## ⏱️ Response Times

| Action          | Time            |
| --------------- | --------------- |
| Page load       | 500ms           |
| Search/filter   | <50ms (instant) |
| Single save     | 1-2s            |
| Bulk update (5) | 2-3s            |
| CSV export      | <100ms          |

---

## 🆘 Validation Messages

```javascript
// If user tries:
"-50"           → ❌ "Stock quantity cannot be negative"
"12.5"          → ❌ "Stock quantity must be a whole number"
"1000000"       → ❌ "Stock quantity cannot exceed 999,999"
"Old qty: 10 → new qty: 60010" → ❌ "Quantity change exceeds max (50,000)"
(inactive product) → ❌ "Cannot update stock for inactive product"
```

---

## 🎮 Keyboard Shortcuts

| Key                  | Action                           |
| -------------------- | -------------------------------- |
| **Enter**            | Save edited stock or bulk update |
| **Escape**           | Cancel editing                   |
| **Tab**              | Navigate between fields          |
| **Ctrl+A** (in bulk) | Select all checkbox              |

---

## 💾 Auto-saved & Logged

Every change creates:

- ✅ Database update (Product.stockQuantity)
- ✅ Audit record (InventoryTransaction)
- ✅ Timestamp (when change happened)
- ✅ Change amount (old qty → new qty)

**View audit trail:**
→ Go to `/dashboard/inventory/transactions`

---

## 🎨 Design System

**Colors:**

- 🔵 Blue: Primary actions, info
- 🟢 Green: Success, in stock
- 🟡 Yellow: Warning, low stock
- 🔴 Red: Error, critical, out of stock
- ⚪ Gray: Neutral, disabled

**Spacing:**

- Cards: 1rem (16px) padding
- Tables: 1rem vertical, 1.5rem horizontal
- Gaps: 0.75rem (12px) between elements

**Typography:**

- Headers: Bold, slate-900
- Labels: Semibold, slate-700
- Values: Regular, slate-600

---

## 📱 Mobile View

Works on:

- ✅ iPhone/Android (360px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

Responsive behavior:

- Stack filters vertically
- Collapse bulk edit info
- Adjust column widths
- Touch-friendly buttons (44px+ height)

---

## 🆕 What's New vs Old

| Feature       | Before           | After                           |
| ------------- | ---------------- | ------------------------------- |
| View products | ✅ Basic         | ✅✅ Enhanced with stats        |
| Edit stock    | ✅ One at a time | ✅✅ Bulk + single              |
| Filter        | ✅ Category only | ✅✅ Category + status + search |
| Sort          | ❌ None          | ✅✅ 5 options + direction      |
| Export        | ❌ None          | ✅✅ CSV one-click              |
| Stats         | ❌ None          | ✅✅ 5 KPI cards                |
| Validation    | Basic            | ✅✅ 6 comprehensive rules      |
| UI Design     | Simple           | ✅✅ Modern with gradients      |

---

## 📞 Need Help?

```
Issue: "Changes aren't saving"
→ Check network tab (F12)
→ Verify API response is 200
→ Try refresh (F5)

Issue: "Bulk update says failed"
→ Check selected items are valid
→ Verify quantity is whole number
→ Try smaller batch

Issue: "CSV won't download"
→ Check browser pop-up settings
→ Try different browser
→ Clear cache and retry
```

**Status:** Ready to use! 🚀
