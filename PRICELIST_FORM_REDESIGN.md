# Pricelist Form Redesign - Multi-Product Support

## Overview

The pricelist form has been redesigned to support **multiple products** per pricelist with individual quantity-tier configurations. This addresses the limitation of the previous single-product design while improving usability and data organization.

---

## Key Changes

### 1. **Multi-Product Support** ✅

**Before:** Single product dropdown (`rules.0.productId`)
**After:** Tab-based product selector allowing multiple products per pricelist

**Benefits:**

- Create comprehensive pricelists for related products
- Different pricing tiers per product
- Easy product management with add/remove functionality

### 2. **Tab-Based Navigation** ✅

**New UI Component:** Product tabs for switching between products

```
┌──────────────────────────────────────┐
│  Add Products to Pricelist           │ ← Search & Add Section
├──────────────────────────────────────┤
│   [Product A ✕] [Product B ✕] ┌─────┤ ← Tab Navigation
│   ─────────────────────────────      │
│                                      │
│  💰 Product A Details                │
│  ┌────────────────────────────────┐  │
│  │ Qty Min │ Qty Max │ Type │ Val │  │ ← Pricing Tiers Table
│  │   1-10  │   -∞    │  %   │ 10%│  │
│  │  11-50  │   -∞    │  ₨   │  50│  │
│  └────────────────────────────────┘  │
│                                      │
│  [+ Add Quantity Tier]               │
└──────────────────────────────────────┘
```

### 3. **Product Management**

- **Add Products:** Search by product name or SKU
- **Remove Products:** Click (X) on product tab to remove (removes all tiers)
- **Active Product:** Highlight current product tab
- **Smart Filtering:** Already-added products excluded from dropdown

### 4. **Fixed Form Submission Issue** ✅

**Problem:** Form rejected empty rules array
**Solution:** Filter out invalid rules before submission

```typescript
// Only include rules with valid product IDs
const validRules = (data.rules || []).filter((rule) => rule.productId);

const payload = {
  ...data,
  rules: validRules.map((rule) => ({
    ...rule,
    id: rule.id && !rule.id.startsWith("rule-") ? rule.id : undefined,
  })),
};
```

### 5. **Improved State Management**

New state variables for better UX:

- `activeProductTab` - Tracks selected product
- `productsInRules` - Computed list of unique products
- `getRulesForProduct()` - Helper function for product-specific tiers

---

## Design Compliance

### Color & Spacing (Design Tokens)

✅ Uses `Colors.primary`, `Colors.gray[50]`, `Colors.danger`
✅ Uses `Spacing.md`, `Spacing.lg`, `Spacing.xs`
✅ Uses `BorderRadius.md` for consistency
✅ Font styling with design tokens

### Layout Structure

✅ **Card-based sections:** Pricelist Info + Product Pricing Tiers
✅ **Responsive design:** Flex layout with proper spacing
✅ **Hover effects:** Smooth transitions on tabs and buttons
✅ **Visual hierarchy:** Section titles, subtitles, labels

### Form Accessibility

✅ Clear labels for all inputs
✅ Placeholder text for guidance
✅ Error messages with proper styling
✅ Disabled states on submit
✅ Focus states on form elements

---

## Usage Flow

### Creating a Pricelist with Multiple Products

```
1. Fill "Pricelist Information"
   ├─ Name (required)
   ├─ Description (optional)
   ├─ Priority
   └─ Active checkbox

2. Add Products
   ├─ Search for Product 1
   │  └─ Auto-opens in tab
   │     └─ Default Tier 1 created
   ├─ Search for Product 2
   │  └─ Auto-opens in new tab
   │     └─ Default Tier 1 created
   └─ Search for Product 3...

3. Configure Tiers per Product
   ├─ Click product tab to switch
   ├─ Click "Add Quantity Tier" to add tiers
   ├─ Edit each tier:
   │  ├─ Qty Min/Max
   │  ├─ Type (Discount %, Fixed Price, etc.)
   │  └─ Value
   └─ Delete tiers with trash icon

4. Submit Form
   └─ Creates pricelist with all products & tiers
```

---

## Technical Details

### Component State

```typescript
const [activeProductTab, setActiveProductTab] = useState<string | null>(null);
const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);

// Computed values
const productsInRules = useMemo(() => {
  const uniqueProducts = Array.from(
    new Set(ruleFields.map((r) => r.productId).filter(Boolean)),
  );
  return uniqueProducts;
}, [ruleFields]);

const rulesForSelectedProduct = activeProductTab
  ? getRulesForProduct(activeProductTab)
  : [];
```

### Key Functions

- `handleAddProduct()` - Adds product with initial tier
- `handleAddProductTier()` - Adds tier to active product
- `handleRemoveProduct()` - Removes product & all its tiers
- `handleDeleteTier()` - Removes single tier
- `getRulesForProduct()` - Filters tiers for a product

### Validation

- **Form Schema:** `pricelistFormSchema` with array of rules
- **Rule Schema:** Validates product ID, quantities, calculation type, values
- **Submission:** Filters invalid rules before API call

---

## Error Handling

### Display Issues

✅ Loading states for product selector
✅ Error messages for missing products
✅ Validation errors with field highlighting

### Submission

✅ Try-catch with user-friendly error messages
✅ Toast notifications for success/failure
✅ Automatic redirect on success

---

## Future Enhancements

1. **Bulk Actions**
   - Copy tiers from one product to another
   - Delete multiple products at once

2. **Advanced Filtering**
   - Search tiers by quantity range
   - Filter by tier type

3. **Import/Export**
   - Excel import for bulk product/tier creation
   - CSV export of pricelist config

4. **Tier Templates**
   - Save tier configuration as template
   - Apply template to new products

---

## File Changes

**Modified:** `components/pricelists/pricelist-form.tsx`

- Complete redesign with tab-based multi-product UI
- New state management for active product tracking
- Improved form submission with rule filtering
- Enhanced UX with auto-open tiers and smart product filtering

**No changes needed:**

- ✅ Validation schema (`lib/validations/pricelist.schema.ts`)
- ✅ API routes (`app/api/pricelists/*`)
- ✅ Backend logic (`services/pricelist.service.ts`)

---

## Testing Checklist

- [ ] Add multiple products to single pricelist
- [ ] Switch between product tabs
- [ ] Add/edit/delete tiers for each product
- [ ] Remove products (verify all tiers removed)
- [ ] Create pricelist (verify API succeeds)
- [ ] Edit existing pricelist (verify data loads correctly)
- [ ] Test with empty rules (should create empty pricelist)
- [ ] Test product filtering (already-added excluded)
- [ ] Verify dropdown closes after selection
- [ ] Test edit mode auto-open for new tiers

---

## Design System Alignment

### Colors

✅ Primary button: `Colors.primary` (#667eea)
✅ Danger/Delete: `Colors.danger` (#ef4444)
✅ Text: `Colors.text.primary` (#1e293b)
✅ Background: `Colors.gray[50]` (#f9fafb)
✅ Borders: `Colors.gray[200]` (#e5e7eb)

### Typography

✅ Section titles: 18px, 600 weight
✅ Labels: 14px body, 500 weight
✅ Button text: Inherit from button component

### Spacing

✅ Card padding: `Spacing.lg` (24px)
✅ Section gaps: `Spacing.lg`, `Spacing.md`
✅ Element gaps: `Spacing.md`, `Spacing.sm`

### Interaction

✅ Smooth transitions: `transition: 'all 0.2s ease'`
✅ Button hover: Transform and background change
✅ Tab selection: Active highlight with primary color
✅ Form focus: Inherited from Input component

---

## Migration Notes

If upgrading from old single-product design:

1. **Existing pricelists:** Will continue to work
2. **Data structure:** Unchanged at database level
3. **Rules:** Automatically organized by productId
4. **API:** No changes to endpoints, same requests work

---

## Support & Questions

For issues or suggestions:

1. Check validation schema for rule requirements
2. Verify product IDs exist in database
3. Check browser console for form error details
4. Review API response in Network tab
