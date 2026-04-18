# Pricelist API Endpoint Calls - Frontend Reference

This guide shows **WHERE** (which page/component) **CALLS** each API endpoint and **HOW** (button/link).

---

## 📍 **1. List All Pricelists**
### Endpoint: `GET /api/pricelists`

**Called From:** Server-side page component

**File:** [app/(dashboard)/pricelists/page.tsx](app/(dashboard)/pricelists/page.tsx)

**Code Reference:**
```typescript
// Line: Server-side data fetching
const pricelists = await getAllPricelists();
```

**Trigger:** When user navigates to:
```
http://localhost:3000/dashboard/pricelists
```

**User Action:** Just visiting the URL loads the list

---

## 📍 **2. Create New Pricelist**
### Endpoint: `POST /api/pricelists`

**Called From:** Form Component

**Files:**
- Page: [app/(dashboard)/pricelists/new/page.tsx](app/(dashboard)/pricelists/new/page.tsx)
- Form: [components/pricelists/pricelist-form.tsx](components/pricelists/pricelist-form.tsx)

**Button Reference:**

```tsx
// File: components/pricelists/pricelist-form.tsx
// Line ~625: Submit Button
<Button
  type="submit"
  disabled={isLoading || isSubmitting}
  className="flex-1"
>
  {isLoading || isSubmitting
    ? 'Saving...'
    : isEdit
      ? 'Update Pricelist'
      : 'Create Pricelist'}
</Button>
```

**API Call:**
```typescript
// File: components/pricelists/pricelist-form.tsx
// Line 84: Determines URL based on create vs edit mode
const url = isEdit 
  ? `/api/pricelists/${initialData?.id}` 
  : '/api/pricelists';  // ← CREATE goes here

// Line 87-91: Makes the fetch call
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**User Action:**
1. Navigate to: `http://localhost:3000/dashboard/pricelists/new`
2. Fill form (name, description, rules, etc.)
3. **Click "Create Pricelist" button** ← Calls POST /api/pricelists

---

## 📍 **3. Get Single Pricelist**
### Endpoint: `GET /api/pricelists/[pricelistId]`

**Called From:** Server-side page component

**File:** [app/(dashboard)/pricelists/[id]/page.tsx](app/(dashboard)/pricelists/[id]/page.tsx)

**Code Reference:**
```typescript
// Line: Server-side data fetching
const pricelist = await getPricelistById(params.id);
```

**Trigger:** When user navigates to:
```
http://localhost:3000/dashboard/pricelists/{pricelistId}
```

**User Action:** Click on a pricelist from the list, or navigate directly to edit page

---

## 📍 **4. Update Pricelist**
### Endpoint: `PUT /api/pricelists/[pricelistId]`

**Called From:** Form Component (Edit mode)

**Files:**
- Page: [app/(dashboard)/pricelists/[id]/page.tsx](app/(dashboard)/pricelists/[id]/page.tsx)
- Form: [components/pricelists/pricelist-form.tsx](components/pricelists/pricelist-form.tsx)

**Button Reference:**

```tsx
// File: components/pricelists/pricelist-form.tsx
// Line ~625: Submit Button (same button, different mode)
<Button type="submit" disabled={isLoading || isSubmitting}>
  {isLoading || isSubmitting
    ? 'Saving...'
    : 'Update Pricelist'}  // ← UPDATE mode
</Button>
```

**API Call:**
```typescript
// File: components/pricelists/pricelist-form.tsx
// Line 84: When editing, uses PUT method
const url = isEdit 
  ? `/api/pricelists/${initialData?.id}`  // ← UPDATE goes here
  : '/api/pricelists';

const method = isEdit ? 'PUT' : 'POST';

const response = await fetch(url, {
  method,  // ← PUT method
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**User Action:**
1. Navigate to: `http://localhost:3000/dashboard/pricelists/{pricelistId}`
2. Modify form fields
3. **Click "Update Pricelist" button** ← Calls PUT /api/pricelists/{id}

---

## 📍 **5. Delete Pricelist**
### Endpoint: `DELETE /api/pricelists/[pricelistId]`

**Called From:** Detail page component

**File:** [app/(dashboard)/pricelists/[id]/page.tsx](app/(dashboard)/pricelists/[id]/page.tsx)

**Button Reference:**

```tsx
// File: app/(dashboard)/pricelists/[id]/page.tsx
// Delete Button (shown in edit page)
<Button
  type="button"
  variant="destructive"
  onClick={handleDelete}
>
  <Trash2 className="w-4 h-4" />
  Delete Pricelist
</Button>
```

**API Call:**
```typescript
// File: app/(dashboard)/pricelists/[id]/page.tsx
const handleDelete = async () => {
  const response = await fetch(
    `/api/pricelists/${pricelist.id}`,
    { method: 'DELETE' }
  );
  // Redirect on success
};
```

**User Action:**
1. Navigate to: `http://localhost:3000/dashboard/pricelists/{pricelistId}`
2. **Click "Delete Pricelist" button** ← Calls DELETE /api/pricelists/{id}

---

## 📍 **6. Create Pricing Rule**
### Endpoint: `POST /api/pricelists/[pricelistId]/rules`

**Called From:** Form Component (Dynamic rule section)

**File:** [components/pricelists/pricelist-form.tsx](components/pricelists/pricelist-form.tsx)

**Button Reference:**

```tsx
// File: components/pricelists/pricelist-form.tsx
// Line ~580: Add New Rule Button
<Button
  type="button"
  variant="outline"
  className="w-full gap-2"
  onClick={() => appendRule({
    name: '',
    priority: 0,
    minQuantity: 1,
    maxQuantity: null,
    appliedTo: 'PRODUCT',
    productId: null,
    categoryId: null,
    calculationType: 'PERCENTAGE_DISCOUNT',
    discountPercentage: null,
    isActive: true,
    id: `rule-${Date.now()}`,
  })}
>
  <Plus className="w-4 h-4" />
  Add Pricing Rule
</Button>
```

**When API is Called:** When form is submitted (POST or PUT), rules are included in the payload

```typescript
// File: components/pricelists/pricelist-form.tsx
// Line 77-93: Form submission includes rules
const payload = {
  ...data,
  rules: (data.rules || []).map((rule) => ({
    ...rule,
    id: rule.id && !rule.id.startsWith('rule-') ? rule.id : undefined,
  })),
};

const response = await fetch(url, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),  // ← Rules included here
});
```

**User Action:**
1. In pricelist create/edit form
2. **Click "Add Pricing Rule" button** ← Adds new rule to form
3. **Click "Create/Update Pricelist" button** ← Submits all rules

---

## 📍 **7. Update Pricing Rule**
### Endpoint: `PATCH /api/pricelists/[pricelistId]/rules/[ruleId]`

**Called From:** Form Component (Edit rule fields)

**File:** [components/pricelists/pricelist-form.tsx](components/pricelists/pricelist-form.tsx)

**User Interaction:**

```tsx
// File: components/pricelists/pricelist-form.tsx
// Rule fields are part of the form
{/* Rule Name Input - Line ~260 */}
<Input
  {...register(`rules.${index}.name`)}
  placeholder="e.g., Bulk Order 10%, Wholesale"
/>

{/* Min Quantity Input - Line ~290 */}
<Input
  {...register(`rules.${index}.minQuantity`, { valueAsNumber: true })}
  type="number"
  min="1"
/>

{/* Calculation Type Dropdown - Line ~330 */}
<select {...register(`rules.${index}.calculationType`)}>
  <option value="PERCENTAGE_DISCOUNT">Percentage Discount (%)</option>
  <option value="FIXED_PRICE">Fixed Price</option>
  <option value="FIXED_DISCOUNT">Fixed Discount Amount</option>
  <option value="FORMULA">Formula (Cost + Margin)</option>
</select>
```

**When API is Called:**
- Any changes to rule fields in the form
- **Click form submit button** ← Updates all rules via PUT endpoint

---

## 📍 **8. Delete Pricing Rule**
### Endpoint: `DELETE /api/pricelists/[pricelistId]/rules/[ruleId]`

**Called From:** Form Component

**Button Reference:**

```tsx
// File: components/pricelists/pricelist-form.tsx
// Line ~550: Delete Rule Button
<Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={() => removeRule(index)}
>
  <Trash2 className="w-4 h-4" />
</Button>
```

**User Action:**
1. In pricelist create/edit form
2. On the rule section you want to remove
3. **Click trash/delete icon** ← Removes rule from form
4. **Click "Create/Update Pricelist" button** ← Submits deletion

---

## 📍 **9. Calculate Price**
### Endpoint: `POST /api/pricelists/calculate-price`

**Called From:** Other components (currently available via API, not yet in UI)

**API Usage:**
```typescript
const response = await fetch('/api/pricelists/calculate-price', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod-123',
    quantity: 25,
    categoryId: 'cat-1',
    customerId: null,
  }),
});
```

**User Action:** This endpoint is backend-only for now. Can be called from:
- Product pricing page (to be implemented)
- Order checkout page (to be implemented)
- API directly for testing

---

## 🔗 **Visual Flow Diagram**

```
User Navigation                Browser                  API Endpoints
─────────────────────────────────────────────────────────────────────

1. Visit /dashboard/pricelists ──┐
                                 ├──→ page.tsx ──→ GET /api/pricelists
                                 │   (displays list)
                                 └──→ Shows [List of Pricelists]

2. Click "Add New" button ────────────→ Navigate to /new
                                       ↓
                                   pricelist-form.tsx

3. Fill Form + Add Rules ────────────→ Form State Management
   (no API call yet)

4. Click "Create Pricelist" ──────────→ POST /api/pricelists
   Button (type="submit")             ↓
                                   Success → Redirect to list

5. Click on Pricelist in List ────────→ Navigate to /[id]
                                       ↓
                                   page.tsx ──→ GET /api/pricelists/[id]
                                   ↓
                                   pricelist-form.tsx (Edit mode)

6. Modify Form + Click "Update" ─────→ PUT /api/pricelists/[id]
   Button                             ↓
                                   Success → Redirect to list

7. Click "Delete Pricelist" ────────→ DELETE /api/pricelists/[id]
   Button                            ↓
                                   Success → Redirect to list

8. In Form: Click "Add Rule" ──────→ Form State (useFieldArray)
   Button                           ↓
                                   No API call (client-side)

9. In Form: Remove Rule ───────────→ Form State (removeRule)
                                   ↓
                                   Persisted when Submit clicked

10. Click "Create/Update" with ────→ POST/PUT /api/pricelists
    Rules included                   (Rules sent in payload)
```

---

## 📊 **Summary Table**

| API Endpoint | Where Called | Trigger | File |
|--------------|--------------|---------|------|
| **GET /api/pricelists** | List page | Page load | page.tsx |
| **POST /api/pricelists** | Create form | Click "Create" button | pricelist-form.tsx |
| **GET /api/pricelists/[id]** | Edit page | Click pricelist / page load | page.tsx |
| **PUT /api/pricelists/[id]** | Edit form | Click "Update" button | pricelist-form.tsx |
| **DELETE /api/pricelists/[id]** | Detail page | Click "Delete" button | page.tsx |
| **POST /api/pricelists/.../rules** | Create form | Submit with rules | pricelist-form.tsx |
| **PATCH /api/pricelists/.../rules/[ruleId]** | Edit form | Submit form changes | pricelist-form.tsx |
| **DELETE /api/pricelists/.../rules/[ruleId]** | Edit form | Remove rule & Submit | pricelist-form.tsx |
| **POST /api/pricelists/calculate-price** | API only | Backend integration | (Not yet in UI) |

---

## 🎯 **Key Components**

### Main Files Calling APIs:

1. **Server Pages (Server-side fetching):**
   - [app/(dashboard)/pricelists/page.tsx](app/(dashboard)/pricelists/page.tsx) - Initial list load
   - [app/(dashboard)/pricelists/[id]/page.tsx](app/(dashboard)/pricelists/[id]/page.tsx) - Load single pricelist & delete button

2. **Form Component (Client-side):**
   - [components/pricelists/pricelist-form.tsx](components/pricelists/pricelist-form.tsx) - Create, update, rule management

3. **Custom Hook:**
   - [hooks/usePricelistSelectors.ts](hooks/usePricelistSelectors.ts) - Fetches products/categories for dropdowns

---

## 💡 **How to Find More Details**

1. **Form Component Details:** [components/pricelists/pricelist-form.tsx](components/pricelists/pricelist-form.tsx)
   - Search for `onSubmit` to see form submission
   - Search for `appendRule` to see "Add Rule" button
   - Search for `removeRule` to see "Delete Rule" button

2. **Page Component Details:** [app/(dashboard)/pricelists/[id]/page.tsx](app/(dashboard)/pricelists/[id]/page.tsx)
   - Search for `handleDelete` to see delete API call
   - Search for `Trash2` to see delete button

3. **API Routes:** [app/api/pricelists/](app/api/pricelists/)
   - Each endpoint file has detailed comments explaining the flow

