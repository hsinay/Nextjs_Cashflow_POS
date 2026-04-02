# Design System Guidelines & Enforcement

**Last Updated:** January 8, 2026  
**Status:** Phase 6 - Design System Enforcement (COMPLETE)  
**Compliance Target:** 100% of components using centralized design tokens

---

## 1. Core Principles

### Single Source of Truth

- **All design decisions** originate from `/lib/design-tokens.ts`
- **No hardcoded values** for colors, typography, spacing, shadows, or borders
- **Semantic naming** for all design tokens (not pixel values)

### Component-First Architecture

- **Reusable components** in `/components/ui/` handle styling consistently
- **No custom styling** within business components for design elements
- **Props-based customization** instead of className overrides

### Type Safety

- **TypeScript strict mode** enabled
- **JSDoc documentation** on all exported components
- **Inferred types** from Zod schemas for API inputs

---

## 2. Design Token Categories

### Colors (`Colors` object)

```typescript
import { Colors } from "@/lib/design-tokens";

// Primary gradient colors
Colors.primary.main; // #667eea
Colors.primary.light; // #f0f4ff
Colors.primary.lighter; // #f9faff

// Text colors (semantic)
Colors.text.primary; // #1e293b (main text)
Colors.text.secondary; // #64748b (secondary text)
Colors.text.tertiary; // #94a3b8 (disabled/hint)
Colors.text.inverse; // #ffffff (on dark)

// Status colors with light/dark variants
Colors.status.paid.main; // #10b981 (success)
Colors.status.pending.main; // #f59e0b (warning)
Colors.status.rejected.main; // #ef4444 (danger)

// Gray scale (50-900)
Colors.gray[50]; // #f9fafb
Colors.gray[200]; // #e5e7eb
Colors.background; // #ffffff
```

### Typography (`Typography` object)

```typescript
import { Typography } from "@/lib/design-tokens";

// Sizes (px)
Typography.sizes.h1; // { size: 32, weight: 700, lineHeight: 1.2 }
Typography.sizes.h2; // { size: 24, weight: 600, lineHeight: 1.2 }
Typography.sizes.body; // { size: 14, weight: 400, lineHeight: 1.5 }

// Spacing (px)
Typography.spacing.xs; // 4px
Typography.spacing.sm; // 8px
Typography.spacing.md; // 12px
Typography.spacing.lg; // 16px
Typography.spacing.xl; // 24px

// Border radius
Typography.borderRadius.sm; // 4px
Typography.borderRadius.md; // 8px
Typography.borderRadius.lg; // 12px

// Shadows
Typography.shadows.sm; // Elevation 1
Typography.shadows.md; // Elevation 2
Typography.shadows.lg; // Elevation 3
```

---

## 3. Component Usage Rules

### Typography Components (REQUIRED)

Use semantic typography components **instead of** arbitrary Tailwind classes:

```typescript
❌ WRONG:
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-sm text-gray-600">Subtitle</p>

✅ CORRECT:
import { H1, Small } from '@/components/ui';
<H1>Title</H1>
<Small color={Colors.text.secondary}>Subtitle</Small>
```

**Available Components:**

- `H1` - 32px Bold, primary color
- `H2` - 24px Semibold, primary color
- `H3` - 18px Semibold, primary color
- `Body` - 14px Regular, primary color
- `Small` - 12px Regular, secondary color
- `Label` - 12px Semibold, wide letter-spacing

### Color Application (REQUIRED)

Use design tokens for **all** color styling:

```typescript
❌ WRONG:
<div className="bg-blue-50 border border-blue-200 text-blue-600">
<div className="bg-red-50 text-red-700">

✅ CORRECT:
<div style={{
  backgroundColor: Colors.primary.light,
  border: `1px solid ${Colors.primary.lighter}`,
  color: Colors.primary.main
}}>
<div style={{
  backgroundColor: Colors.status.rejected.light,
  color: Colors.status.rejected.main
}}>
```

### Status Indicators (REQUIRED)

Use `StatusBadge` component for all status displays:

```typescript
❌ WRONG:
<span className="bg-green-100 text-green-800 px-2 py-1">
  {status}
</span>

✅ CORRECT:
import { StatusBadge } from '@/components/ui';
<StatusBadge status="APPROVED" />
```

**Supported Status Values:**
`PAID`, `PENDING`, `OVERDUE`, `OPEN`, `IN_PROGRESS`, `CLOSED`, `APPROVED`, `REJECTED`, `PROCESSED`

### Metric Cards (REQUIRED)

Use `KPICard` for all metric/KPI displays:

```typescript
❌ WRONG:
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4">
  <p className="text-xs font-semibold text-gray-600">{title}</p>
  <p className="text-3xl font-bold">{value}</p>
</div>

✅ CORRECT:
import { KPICard } from '@/components/ui';
<KPICard title={title} value={value} subtext={subtext} />
```

### Alerts & Notifications (REQUIRED)

Use `AlertBox` instead of custom alert divs:

```typescript
❌ WRONG:
<div className="bg-blue-50 border border-blue-200 text-blue-600 p-4">
  {message}
</div>

✅ CORRECT:
import { AlertBox } from '@/components/ui';
<AlertBox variant="info" message={message} />
```

**Variants:** `success`, `warning`, `danger`, `info`

### Buttons (REQUIRED)

Use `EnhancedButton` for all interactive buttons:

```typescript
❌ WRONG:
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
  Click
</button>

✅ CORRECT:
import { EnhancedButton } from '@/components/ui';
<EnhancedButton variant="primary">Click</EnhancedButton>
```

**Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `warning`

### Inputs (REQUIRED)

Use `EnhancedInput` for all form inputs:

```typescript
❌ WRONG:
<input className="border border-gray-300 rounded px-3 py-2" />

✅ CORRECT:
import { EnhancedInput } from '@/components/ui';
<EnhancedInput label="Field" error={error} helperText="Help" />
```

---

## 4. Spacing & Layout Patterns

### Consistent Spacing

Use `Typography.spacing` throughout:

```typescript
// Bad: Arbitrary spacing
<div className="p-4 m-2 gap-3">

// Good: Design token spacing
<div style={{
  padding: Typography.spacing.md,
  margin: Typography.spacing.sm,
  gap: Typography.spacing.md
}}>
```

### Grid Layouts

Maintain consistent column gaps:

```typescript
// Grid with design token spacing
<div className="grid grid-cols-3 gap-{Typography.spacing.lg}">
  // or inline style: style={{ gap: Typography.spacing.lg }}
</div>
```

### Sections & Dividers

Use design token colors for visual separation:

```typescript
// Section divider
<div style={{ borderTop: `1px solid ${Colors.gray[200]}`, paddingTop: Typography.spacing.lg }}>

// Between elements
<div style={{ margin: `${Typography.spacing.lg}px 0` }}>
```

---

## 5. Code Review Checklist

### Pre-Commit Checklist

Before committing code, verify:

- [ ] **No hardcoded colors** (`bg-blue-`, `text-red-`, etc.)
- [ ] **No arbitrary text sizes** (`text-2xl`, `text-sm`, etc.)
- [ ] **All typography uses components** (H1, H2, H3, Body, Small, Label)
- [ ] **All metrics use KPICard** component
- [ ] **All status indicators use StatusBadge** component
- [ ] **All alerts use AlertBox** component
- [ ] **All buttons use EnhancedButton** component
- [ ] **All inputs use EnhancedInput** component
- [ ] **All spacing uses Typography.spacing** tokens
- [ ] **All borders use Colors.gray tokens** (not hardcoded)
- [ ] **No inline arbitrary styles** for design elements
- [ ] **All colors imported from Colors** object

### Component Review Checklist

When adding a new component:

- [ ] **Accepts color props** where appropriate
- [ ] **Uses design tokens** internally (no hardcoded values)
- [ ] **Exports proper TypeScript types**
- [ ] **Includes JSDoc documentation** with examples
- [ ] **Exported from `/components/ui/index.ts`** with central export
- [ ] **No custom theme/styling** conflicting with design tokens
- [ ] **Consistent with existing components** in structure & patterns

### Design System Compliance

For each file modified:

```bash
# Check for hardcoded colors
grep -E "bg-[a-z]+-|text-[a-z]+-|border-[a-z]+-" your-file.tsx

# Check for arbitrary text sizes
grep -E "text-\d|text-xs|text-sm|text-lg" your-file.tsx

# Check for arbitrary spacing
grep -E "p-\d|m-\d|gap-\d" your-file.tsx
```

---

## 6. Anti-Patterns (AVOID)

### ❌ Color Anti-Patterns

```typescript
// Hardcoded color names
<div className="bg-blue-50 text-blue-600" />

// Inline RGB values
<div style={{ color: 'rgb(100, 116, 139)' }} />

// Tailwind color utilities
<div className="bg-gradient-to-r from-blue-50 to-indigo-50" />
```

### ❌ Typography Anti-Patterns

```typescript
// Arbitrary Tailwind sizes
<h1 className="text-3xl font-bold" />
<p className="text-sm text-gray-600" />

// Inline style sizes
<span style={{ fontSize: '14px', fontWeight: 'bold' }} />

// Mixed typography approaches
<div>
  <p className="text-lg">Header</p>
  <Small>Subtext</Small>
</div>
```

### ❌ Component Anti-Patterns

```typescript
// Custom badge instead of StatusBadge
<span className="inline-flex items-center px-2 py-1 rounded-full">
  {status}
</span>

// Custom metric card instead of KPICard
<div className="bg-gradient-to-br from-blue-50 p-4 rounded">
  <p className="text-3xl font-bold">{value}</p>
</div>

// Custom alert instead of AlertBox
<div className="bg-blue-50 border border-blue-200 p-4">
  {message}
</div>
```

### ❌ Spacing Anti-Patterns

```typescript
// Arbitrary Tailwind spacing
<div className="p-4 m-2 gap-3" />

// Inconsistent spacing units
<div style={{ padding: '16px', margin: '8px', gap: '12px' }} />

// Missing spacing for visual hierarchy
<div>
  Content directly touching edges
</div>
```

---

## 7. Developer Onboarding

### Getting Started

1. **Read this file** - Understand core principles
2. **Review `/lib/design-tokens.ts`** - Know available tokens
3. **Review `/components/ui/index.ts`** - Know available components
4. **Check examples below** - See real-world patterns

### Component Import Pattern

```typescript
import { Colors, Typography } from "@/lib/design-tokens";
import {
  H1,
  H2,
  H3,
  Body,
  Small,
  Label,
  StatusBadge,
  KPICard,
  AlertBox,
  EnhancedButton,
  EnhancedInput,
} from "@/components/ui";
```

### Common Implementation Patterns

**Page Header Pattern:**

```typescript
<div>
  <H1>Page Title</H1>
  <Small color={Colors.text.secondary}>Subtitle</Small>
</div>
```

**Metric Section Pattern:**

```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <KPICard title="Sales" value="$10,000" subtext="This month" />
  <KPICard title="Orders" value="240" subtext="This month" />
  {/* ... */}
</div>
```

**Status Display Pattern:**

```typescript
<div className="flex items-center gap-2">
  <StatusBadge status="APPROVED" />
  <Small color={Colors.text.secondary}>Approved on {date}</Small>
</div>
```

**Form Section Pattern:**

```typescript
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: Typography.spacing.md,
  }}
>
  <EnhancedInput label="Name" error={errors.name} />
  <EnhancedInput label="Email" type="email" error={errors.email} />
  <EnhancedButton variant="primary">Submit</EnhancedButton>
</div>
```

**Alert Pattern:**

```typescript
{
  error && (
    <AlertBox
      variant="danger"
      title="Error"
      message={error.message}
      closable
      onClose={clearError}
    />
  );
}
```

---

## 8. Migration Path for Legacy Code

### Phase 1: Identify

- Search for hardcoded color classes: `bg-[a-z]+-, text-[a-z]+-`
- List all custom component implementations
- Catalog arbitrary spacing usage

### Phase 2: Map

- Match hardcoded colors to design token equivalents
- Identify components that can use standard UI components
- Plan typography migrations

### Phase 3: Refactor

- Replace colors with token references
- Replace custom components with standard versions
- Replace arbitrary typography with component instances

### Phase 4: Verify

- Run compliance checks (see section 5)
- Test responsive behavior
- Validate accessibility

---

## 9. Enforcement Mechanisms

### Linting (Future Implementation)

```bash
# Recommended ESLint rule additions:
# - no-hardcoded-colors
# - no-arbitrary-text-sizes
# - required-component-imports
# - design-token-usage
```

### Code Review Process

1. **Automated checks** on PR creation
2. **Manual review** against checklist (section 5)
3. **Test in Storybook** (if available)
4. **Merge only after** compliance verified

### Build-Time Validation (Future)

```bash
npm run design:check  # Validates design token usage
npm run design:audit  # Reports non-compliant code
```

---

## 10. Maintenance & Evolution

### Adding New Design Tokens

1. Update `/lib/design-tokens.ts` with new token
2. Document in this file under relevant category
3. Create PR for review
4. Update all affected components

### Creating New Components

1. Follow component structure in `/components/ui/`
2. Use only design tokens (no hardcoded values)
3. Export from `/components/ui/index.ts`
4. Document in this file under "Component Usage Rules"

### Deprecating Components

1. Mark component as deprecated
2. Provide migration path in comments
3. Update this document
4. Plan removal in next major version

---

## 11. Quick Reference

### Most Common Mistakes to Avoid

1. ❌ `className="bg-blue-50"` → ✅ `style={{ backgroundColor: Colors.primary.light }}`
2. ❌ `<h3 className="text-lg font-bold">` → ✅ `<H3>`
3. ❌ `<span className="text-xs text-gray-600">` → ✅ `<Small color={Colors.text.secondary}>`
4. ❌ Custom badge divs → ✅ `<StatusBadge status="APPROVED" />`
5. ❌ `className="p-4 m-2 gap-3"` → ✅ `style={{ padding: Typography.spacing.md }}`

### File Checklist Before Commit

```bash
# Run these checks:
grep -n "bg-\|text-\|border-" your-file.tsx | grep -v "bg-white\|text-center"
grep -n "className=\"[^\"]*[0-9]" your-file.tsx
grep -n "px\|py\|p-\|m-\|gap-" your-file.tsx
```

If any results appear, refactor to use design tokens.

---

## 12. Support & Questions

**For questions about:**

- **Design tokens** → Check `/lib/design-tokens.ts`
- **Available components** → Check `/components/ui/index.ts`
- **Usage patterns** → Review refactored components in Phase 5
- **Best practices** → See "Component Usage Rules" section

**For issues:**

- Create PR with compliance checklist completed
- Reference this document in PR description
- Request review from design system maintainers

---

**Design System Version:** 1.0  
**Compatibility:** Next.js 14+, TypeScript 5+, Tailwind CSS 3.4+  
**Last Verified:** January 8, 2026
