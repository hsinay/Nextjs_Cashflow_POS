# DESIGN SYSTEM IMPLEMENTATION ROADMAP

**Project:** CashFlow AI ERP System  
**Start Date:** 2026-01-08  
**Current Phase:** 1 / 6

---

## ✅ PHASE 1 — DESIGN SYSTEM FOUNDATION [COMPLETE]

### What Was Delivered

1. **Centralized Design Tokens** (`lib/design-tokens.ts`)

   - 📦 Single source of truth for all visual decisions
   - 🎨 Colors (primary, semantic, text, grays, status badges)
   - ✍️ Typography scale (sizes, weights, line heights)
   - 📐 Spacing system (derived from typography)
   - 🔲 Border radius definitions
   - 🌥️ Shadow/elevation system
   - ⚡ Transition definitions
   - 🧩 Component specifications (buttons, inputs, cards, badges)
   - 📋 Derivation rules for components not explicitly designed

2. **Comprehensive Documentation** (`DESIGN_SYSTEM_FOUNDATION.md`)

   - 🎯 Design token overview
   - 📊 Quick reference tables
   - ⚠️ Enforcement rules (what to do/not do)
   - 🚀 Usage examples
   - 📂 File location guide

3. **Zero Breaking Changes**
   - ✅ Existing build still passes
   - ✅ All 70+ pages still compile
   - ✅ No refactoring performed yet

---

## 📋 PHASE 2 — REUSABLE UI COMPONENTS [NEXT]

### Planned Work

Create new component files that use design tokens exclusively:

**Typography Components** (new)

- `<H1>` — Page titles (32px, bold)
- `<H2>` — Section headers (24px, semibold)
- `<H3>` — Subsections (18px, semibold)
- `<Body>` — Body text (14px, regular)
- `<Small>` — Meta text (12px, regular)

**Card Variants** (extend existing `card.tsx`)

- `<KPICard>` — Business metrics with top gradient border
- `<AIInsightCard>` — AI insights with gradient background

**Icon Wrapper** (new)

- `<SemanticIcon>` — Icon with semantic color support
  - `variant="primary" | "success" | "warning" | "danger" | "secondary"`
  - Auto-sizing based on context

**Form Components** (audit existing)

- Ensure `<Input>`, `<Textarea>`, `<Select>` use design tokens
- Add missing focus states
- Consistent error styling

**Status Badge** (already exists)

- Verify `<Badge>` variants match spec
- Add new `status` prop for semantic colors

---

## 📊 PHASE 3 — CODEBASE UI AUDIT [AFTER PHASE 2]

### Planned Work

Scan entire codebase for:

1. **Hardcoded Colors**

   - Chart colors in reports (Recharts)
   - Inline `style={{ color: '#...' }}`
   - Tailwind colors not in design system (e.g., `text-gray-900`)

2. **Hardcoded Typography**

   - `text-2xl`, `text-4xl` (should use `text-h1`, `text-h2`, etc.)
   - `font-black`, `font-light` (should use defined weights)
   - Inconsistent font sizes

3. **Hardcoded Spacing**

   - `p-8`, `gap-10` (arbitrary, should use spacing scale)
   - Inline `style={{ padding: '20px' }}`

4. **Component Duplication**
   - Repeated button logic (should use Button component)
   - Repeated card styling (should use Card/KPICard)
   - Repeated badge logic (should use Badge component)

### Output

- **Refactor Priority List** (by impact and frequency)
- **Mapping:** Existing UI → Design System equivalent

---

## 🔧 PHASE 4 — PAGE REFACTORING [AFTER PHASE 3]

### Planned Work

Refactor pages in priority order:

**Priority 1 (High Impact)**

- `/dashboard/reports/*` (uses charts, 5 pages)
- `/dashboard/pos/dashboard` (KPI cards, metrics)
- `/dashboard/*` overview pages

**Priority 2 (Medium)**

- `/dashboard/products/*` (lists, forms)
- `/dashboard/customers/*` (lists, cards)
- `/dashboard/transactions/*` (tables)

**Priority 3 (Low)**

- Settings pages
- Admin pages
- Utility pages

### Refactoring Pattern

For each page:

1. Replace hardcoded colors → Design tokens
2. Replace hardcoded typography → Typography components
3. Replace hardcoded spacing → Spacing scale
4. Extract duplicate components
5. Test in dev environment
6. Commit changes

---

## 🛡️ PHASE 5 — DESIGN SYSTEM ENFORCEMENT

### Planned Work

1. **ESLint Rules** (optional)

   - Flag hardcoded colors in className strings
   - Flag unsupported Tailwind utilities
   - Suggest alternatives from design system

2. **Component Library** (optional)

   - Export all design tokens from `@/lib/design-tokens`
   - Create component story guide (Storybook)
   - Document all component variants

3. **Developer Guidelines**

   - "Before you code" checklist
   - Design system decision tree
   - Common patterns & examples

4. **Code Review Checklist**
   - Is color from `Colors` token?
   - Is font size from `Typography` token?
   - Is spacing from `Spacing` token?
   - Are components reused or duplicated?

---

## 📈 PHASE 6 — DESIGN SYSTEM EVOLUTION

### Ongoing

- **Quarterly Reviews:** Audit for new hardcoded styles
- **New Components:** Follow token-based approach
- **Design Changes:** Update tokens first, cascade to all components
- **Performance:** Monitor bundle size impact

---

## 📂 Files Created/Modified

### New Files

```
lib/design-tokens.ts                    ← Design System foundation
DESIGN_SYSTEM_FOUNDATION.md             ← Documentation
DESIGN_SYSTEM_IMPLEMENTATION_ROADMAP.md ← This file
```

### Modified Files

- None (Phase 1 is additive only)

### Existing Critical Files (Reference)

```
tailwind.config.ts       ← Extends with typography, colors, shadows
app/globals.css          ← Gradient classes, KPI card, AI insight styles
components/ui/*          ← Base components using design tokens
```

---

## 🎯 Success Criteria for Phase 1

- ✅ Design tokens file created and validated
- ✅ Documentation complete and comprehensive
- ✅ Build passes without errors
- ✅ No breaking changes to existing functionality
- ✅ Clear path forward for subsequent phases
- ✅ All enforcement rules documented
- ✅ Quick reference available

**Status:** ✅ **ACHIEVED**

---

## 🚀 How to Use Design Tokens (Developer Guide)

### For Colors

```typescript
import { Colors } from "@/lib/design-tokens";

// In JSX
<div style={{ backgroundColor: Colors.primary.start }}>
  <p style={{ color: Colors.text.primary }}>Text</p>
</div>;

// In Tailwind
className = "bg-primary text-dark";
```

### For Typography

```typescript
import { Typography } from "@/lib/design-tokens";

// In JSX
<h1
  style={{
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
  }}
>
  Title
</h1>;

// In Tailwind
className = "text-h1 font-bold";
```

### For Spacing

```typescript
import { Spacing } from "@/lib/design-tokens";

// In JSX
<button
  style={{
    padding: `${Spacing.buttonPadding.default.y} ${Spacing.buttonPadding.default.x}`,
  }}
>
  Click me
</button>;

// In Tailwind
className = "px-6 py-3";
```

### For Components

```typescript
import { ComponentSpecs } from '@/lib/design-tokens';

// Example: Creating a KPI card
<div style={ComponentSpecs.card.kpi}>
  <h3 className="text-h3 font-semibold">Revenue</h3>
  <p className="text-2xl font-bold text-success">$10,000</p>
</div>

// Better: Use reusable component (coming in Phase 2)
<KPICard title="Revenue" value="$10,000" />
```

---

## ❓ FAQ

**Q: Can I use colors not in the design system?**  
A: No. All colors must come from `Colors` token or Tailwind mappings. If you need a new color, update the design system first.

**Q: What if I can't find a token for what I need?**  
A: Check `DerivationRules` section. If still not covered, document it and flag for Phase 2/3.

**Q: Can I use arbitrary Tailwind values like `text-[20px]`?**  
A: No. Use defined typography sizes. If a size is missing, add it to design tokens.

**Q: Do I need to memorize all token values?**  
A: No. Use IDE autocomplete: `import { Colors } from '@/lib/design-tokens'; Colors.` ← autocomplete shows all options.

**Q: What about responsive design?**  
A: Design tokens are static. For responsive behavior, use Tailwind's `md:`, `lg:` prefixes with tokens.

---

## 📞 Questions / Feedback?

If you have questions about design tokens or need clarification:

1. Check `DESIGN_SYSTEM_FOUNDATION.md`
2. Review `lib/design-tokens.ts` comments
3. Check usage examples in this roadmap

---

**Next Action:** Await approval to proceed to **PHASE 2 — REUSABLE UI COMPONENTS**
