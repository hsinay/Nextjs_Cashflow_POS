# Design System Code Review Checklist

Use this checklist when reviewing PRs to ensure design system compliance.

---

## Pre-Review Quick Check

Run these commands on the changed files:

```bash
# Show any hardcoded color classes
git diff HEAD -- '*.tsx' '*.ts' | grep -E "^\+.*\b(bg|text|border)-[a-z]+-"

# Show any arbitrary Tailwind spacing
git diff HEAD -- '*.tsx' '*.ts' | grep -E "^\+.*(p|m|gap)-[0-9]"

# Show any hardcoded font sizes
git diff HEAD -- '*.tsx' '*.ts' | grep -E "text-(xs|sm|lg|xl|2xl|3xl)"
```

If any results appear, request changes.

---

## Typography Review

- [ ] **No arbitrary text sizes** - No `text-sm`, `text-lg`, `text-2xl`, etc.

  - Should use: `<H1>`, `<H2>`, `<H3>`, `<Body>`, `<Small>`, `<Label>`

- [ ] **Headers use semantic components** - All h1-h6 tags replaced with components

  - `<h1 className="text-3xl">` ❌ → `<H1>` ✅
  - `<h2 className="text-2xl">` ❌ → `<H2>` ✅
  - `<h3 className="text-lg">` ❌ → `<H3>` ✅

- [ ] **Secondary text uses Small component**

  - `<p className="text-xs text-gray-600">` ❌ → `<Small>` ✅
  - `<span className="text-sm text-gray-500">` ❌ → `<Small>` ✅

- [ ] **Text color passed via prop, not class**

  - `<span className="text-blue-600">` ❌ → `<Small color={Colors.primary.main}>` ✅

- [ ] **No font-weight classes** - Handled by components
  - `<p className="font-bold">` ❌ → `<H2>` ✅
  - `<p className="font-semibold">` ❌ → Use component ✅

---

## Color & Background Review

- [ ] **No Tailwind color classes** - All colors from design tokens

  - `className="bg-blue-50"` ❌ → `style={{ backgroundColor: Colors.primary.light }}` ✅
  - `className="text-red-600"` ❌ → `<Small color={Colors.status.rejected.main}>` ✅
  - `className="border-gray-200"` ❌ → `border: \`1px solid ${Colors.gray[200]}\`` ✅

- [ ] **Primary colors use Colors.primary\***

  - `bg-blue-50` → `Colors.primary.light`
  - `text-blue-600` → `Colors.primary.main`
  - `border-blue-200` → `Colors.primary.lighter`

- [ ] **Status colors use Colors.status.\***

  - Success/Paid → `Colors.status.paid.*`
  - Warning/Pending → `Colors.status.pending.*`
  - Error/Rejected → `Colors.status.rejected.*`
  - Info → `Colors.primary.*`

- [ ] **Text colors use Colors.text\***

  - `text-gray-900` → `Colors.text.primary`
  - `text-gray-600` → `Colors.text.secondary`
  - `text-gray-500` → `Colors.text.tertiary`

- [ ] **Gray backgrounds use Colors.gray[N]**

  - `bg-gray-50` → `Colors.gray[50]`
  - `bg-gray-100` → `Colors.gray[100]`
  - `border-gray-200` → `Colors.gray[200]`

- [ ] **No inline RGB/hex values**
  - `style={{ color: '#667eea' }}` ❌ → `style={{ color: Colors.primary.main }}` ✅
  - `style={{ color: 'rgb(102, 126, 234)' }}` ❌ → Use Colors token ✅

---

## Component Usage Review

### Status Badges

- [ ] **All status indicators use StatusBadge**

  - Custom span badges ❌ → `<StatusBadge status="APPROVED" />` ✅
  - Multiple status colors hardcoded ❌ → StatusBadge handles all ✅

- [ ] **StatusBadge supports all status values**
  - PAID, PENDING, OVERDUE, OPEN, IN_PROGRESS, CLOSED, APPROVED, REJECTED, PROCESSED

### Metric Cards

- [ ] **All KPI/metric displays use KPICard**

  - Custom metric cards ❌ → `<KPICard title="Sales" value="$10k" />` ✅
  - Multiple gradient cards ❌ → KPICard variant ✅

- [ ] **KPICard imported and used correctly**
  - Has title, value, optional subtext, trend, icon props

### Alerts & Notifications

- [ ] **All alerts use AlertBox**

  - Custom alert divs ❌ → `<AlertBox variant="danger" message="..." />` ✅
  - Multiple alert colors hardcoded ❌ → AlertBox handles variants ✅

- [ ] **AlertBox variants match content**
  - Success messages → `variant="success"`
  - Warnings → `variant="warning"`
  - Errors → `variant="danger"`
  - Info → `variant="info"`

### Forms

- [ ] **All form inputs use EnhancedInput**

  - Basic input elements ❌ → `<EnhancedInput label="Name" />` ✅
  - Custom error display ❌ → EnhancedInput error prop ✅

- [ ] **All buttons use EnhancedButton**

  - HTML button elements ❌ → `<EnhancedButton variant="primary" />` ✅
  - Custom button styling ❌ → EnhancedButton handles variants ✅

- [ ] **Button variants semantically correct**
  - Primary actions → `variant="primary"`
  - Secondary actions → `variant="secondary"`
  - Destructive → `variant="danger"`
  - Success → `variant="success"`

### Text Components

- [ ] **Headers use H1/H2/H3, not h tags**
- [ ] **Secondary text uses Small, not p tags**
- [ ] **Body text uses Body component when needed**
- [ ] **Labels use Label component for form labels**

---

## Spacing & Layout Review

- [ ] **No arbitrary spacing classes**

  - `className="p-4 m-2"` ❌ → `style={{ padding: Typography.spacing.md }}` ✅
  - `className="gap-3"` ❌ → `gap: Typography.spacing.md` ✅

- [ ] **Spacing uses Typography.spacing tokens**

  - `p-0` → `Typography.spacing.xs` (4px)
  - `p-2` → `Typography.spacing.sm` (8px)
  - `p-3` → `Typography.spacing.md` (12px)
  - `p-4` → `Typography.spacing.lg` (16px)
  - `p-6` → `Typography.spacing.xl` (24px)

- [ ] **Border radius uses Typography.borderRadius**

  - `rounded-sm` → `Typography.borderRadius.sm`
  - `rounded-md` → `Typography.borderRadius.md`
  - `rounded-lg` → `Typography.borderRadius.lg`

- [ ] **Shadows use Typography.shadows**

  - `shadow-sm` → `Typography.shadows.sm`
  - `shadow-md` → `Typography.shadows.md`
  - `shadow-lg` → `Typography.shadows.lg`

- [ ] **Consistent gaps in grids/flex**
  - All gaps use `Typography.spacing.*` tokens
  - No mixed spacing units in same component

---

## Imports Review

- [ ] **Design tokens imported at top**

  ```typescript
  import { Colors, Typography } from "@/lib/design-tokens";
  ```

- [ ] **UI components imported from central export**

  ```typescript
  import { H1, H2, H3, Small, StatusBadge, KPICard, ... } from '@/components/ui';
  ```

- [ ] **No direct imports from individual component files**

  - ❌ `import { StatusBadge } from '@/components/ui/status-badge'`
  - ✅ `import { StatusBadge } from '@/components/ui'`

- [ ] **No imports of old/deprecated components**
  - Badge (deprecated) ❌ → StatusBadge ✅
  - Custom MetricCard ❌ → KPICard ✅

---

## File Organization Review

- [ ] **No inline styles mixed with classes**

  - Some styles `style={{}}`, others `className=""` → Pick one consistent approach

- [ ] **Color imports before component imports**

  ```typescript
  // Colors first
  import { Colors } from "@/lib/design-tokens";

  // Then components
  import { H1 } from "@/components/ui";
  ```

- [ ] **Consistent style application in component**
  - All styled inline: ✅
  - All styled via Tailwind: ⚠️ (only if using design tokens)
  - Mixed approaches: ❌

---

## Accessibility Review

- [ ] **Color not only differentiator**

  - Icons/text labels accompany color-coded items
  - Status badges have text, not just color

- [ ] **Sufficient color contrast**

  - Text on light backgrounds meets WCAG AA
  - Design tokens ensure compliance

- [ ] **Semantic HTML preserved**
  - Headings use H1/H2/H3 components
  - Buttons use button elements, not divs
  - Form inputs use EnhancedInput component

---

## Testing Review

- [ ] **Visual consistency checked**

  - Spacing consistent across page
  - Colors match design tokens
  - Typography hierarchy clear

- [ ] **Responsive behavior verified**

  - Grid layouts stack on mobile
  - Spacing scales appropriately
  - Text remains readable

- [ ] **Dark mode (if supported)**
  - All Colors tokens used correctly
  - Text colors maintain contrast
  - Backgrounds are appropriate

---

## Common Issues Checklist

### Most Frequent Violations

- [ ] ❌ `className="bg-blue-50"` found → Request Colors.primary.light
- [ ] ❌ `<p className="text-lg">` found → Request H3 component
- [ ] ❌ `<span className="text-gray-600">` found → Request Small component
- [ ] ❌ `className="p-4 m-2"` found → Request Typography.spacing
- [ ] ❌ Custom alert div found → Request AlertBox component
- [ ] ❌ Custom metric card found → Request KPICard component

### Quick Fixes to Suggest

1. Color issue → Replace with Colors token
2. Typography issue → Use semantic component
3. Spacing issue → Use Typography.spacing
4. Status display → Use StatusBadge
5. Metrics → Use KPICard

---

## Approval Checklist

Before approving, verify:

- [ ] All typography uses semantic components
- [ ] All colors use design tokens
- [ ] All spacing uses Typography tokens
- [ ] No custom component duplicates
- [ ] No hardcoded values
- [ ] Proper imports from `/components/ui`
- [ ] Accessibility maintained
- [ ] Responsive behavior verified

---

## Comment Templates

### For Color Issues

```markdown
This uses hardcoded Tailwind colors. Please use design tokens instead:

❌ `className="bg-blue-50"`
✅ `style={{ backgroundColor: Colors.primary.light }}`

This ensures consistency with our design system.
```

### For Typography Issues

```markdown
This uses arbitrary Tailwind sizes. Please use semantic components:

❌ `<h3 className="text-lg font-semibold">`
✅ `<H3>`

This guarantees consistent typography across the app.
```

### For Component Issues

```markdown
This implements a custom status badge. Please use the standard component:

❌ `<span className="bg-green-100 text-green-800">{status}</span>`
✅ `<StatusBadge status={status} />`

This prevents style duplication and ensures consistency.
```

### For Spacing Issues

```markdown
This uses arbitrary spacing. Please use design tokens:

❌ `className="p-4 m-2 gap-3"`
✅ `style={{ padding: Typography.spacing.md, margin: Typography.spacing.sm, gap: Typography.spacing.md }}`

This maintains consistent spacing across the app.
```

---

## Review Time Estimate

- **Quick review** (no violations): 5 minutes
- **Normal review** (minor fixes): 15 minutes
- **Major refactoring**: 30+ minutes

If a PR has many violations, consider requesting a larger refactoring session in Phase 5 style.

---

**Last Updated:** January 8, 2026  
**Version:** 1.0  
**Related:** DESIGN_SYSTEM_GUIDELINES.md
