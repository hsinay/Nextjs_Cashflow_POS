# DESIGN SYSTEM — FOUNDATION DOCUMENTATION

**Project:** CashFlow AI ERP System  
**Status:** PHASE 1 — DESIGN SYSTEM FOUNDATION COMPLETE  
**Date:** 2026-01-08

---

## 📋 Overview

This document defines the **single source of truth** for all design decisions in the CashFlow AI ERP System. All UI components, pages, and features must derive from the design tokens and rules defined here.

---

## 🎨 Design Tokens

### Colors

All colors are centralized in `lib/design-tokens.ts` under the `Colors` object.

#### Primary Brand (Gradient)

- **Start:** `#667eea` (Primary blue)
- **End:** `#764ba2` (Primary purple)
- **Usage:** Primary buttons, gradients, brand elements

#### Semantic Colors

| Token     | Value     | Usage                         |
| --------- | --------- | ----------------------------- |
| `success` | `#10b981` | Profit, Paid status, Approved |
| `warning` | `#f59e0b` | Pending status, Warnings      |
| `danger`  | `#ef4444` | Loss, Overdue, Errors, Delete |

#### Text Colors

| Token            | Value     | Usage                       |
| ---------------- | --------- | --------------------------- |
| `text.primary`   | `#1e293b` | Main text, headings         |
| `text.secondary` | `#64748b` | Helper text, secondary info |

#### Neutral Grays (For Layout)

| Token      | Value     | Usage                  |
| ---------- | --------- | ---------------------- |
| `gray.50`  | `#f8fafc` | Light backgrounds      |
| `gray.200` | `#e2e8f0` | Borders, dividers      |
| `gray.400` | `#9ca3af` | Darker elements        |
| `gray.900` | `#1e293b` | Same as `text.primary` |

#### Status Badge Colors (Pairs)

| Status      | Light     | Dark      | Usage                |
| ----------- | --------- | --------- | -------------------- |
| **Paid**    | `#dcfce7` | `#166534` | Success status       |
| **Pending** | `#fef3c7` | `#92400e` | Pending status       |
| **Overdue** | `#fee2e2` | `#991b1b` | Error/overdue status |

---

### Typography

#### Font Family

- **Default:** Inter (300–700 weights imported from Google Fonts)

#### Font Sizes

| Token   | Size | Usage                      | Example                     |
| ------- | ---- | -------------------------- | --------------------------- |
| `h1`    | 32px | Page titles                | "Dashboard"                 |
| `h2`    | 24px | Section headers            | "Recent Transactions"       |
| `h3`    | 18px | Subsections, table headers | Table column header         |
| `body`  | 14px | Body text, form inputs     | Form field value            |
| `small` | 12px | Meta text, labels          | "Last updated: 2 hours ago" |

#### Font Weights

| Token      | Weight | Usage                   |
| ---------- | ------ | ----------------------- |
| `normal`   | 400    | Regular text            |
| `medium`   | 500    | Medium emphasis         |
| `semibold` | 600    | Section headers, badges |
| `bold`     | 700    | Page titles             |

#### Usage Rules

```typescript
// ✅ Correct usage:
<h1 className="text-h1 font-bold text-dark">Page Title</h1>
<h2 className="text-h2 font-semibold text-dark">Section</h2>
<p className="text-body text-gray-text">Body text here</p>
<span className="text-small font-semibold">Label</span>

// ❌ Incorrect usage:
<h1 className="text-4xl font-black">Page Title</h1>  // Wrong size
<p className="text-base font-normal">Text</p>  // Wrong size
```

---

### Spacing Scale

Derived from 4px baseline (typography-aligned).

| Token | Size | Usage                         |
| ----- | ---- | ----------------------------- |
| `xs`  | 4px  | Minimal spacing               |
| `sm`  | 8px  | Small gaps, input padding     |
| `md`  | 12px | Form field gaps               |
| `lg`  | 16px | Card padding, section spacing |
| `xl`  | 24px | Component gaps                |
| `xxl` | 32px | Page sections                 |

#### Button Padding Patterns

- **Default:** 16px horizontal × 12px vertical
- **Small:** 12px horizontal × 8px vertical
- **Large:** 24px horizontal × 16px vertical

#### Card Padding

- **Default:** 24px
- **Compact:** 16px

---

### Border Radius

| Token    | Value  | Usage                |
| -------- | ------ | -------------------- |
| `button` | 8px    | Buttons              |
| `input`  | 8px    | Form inputs          |
| `card`   | 16px   | Cards, modals        |
| `badge`  | 9999px | Pills, fully rounded |
| `avatar` | 9999px | Avatar circles       |

---

### Shadows (Elevation System)

| Token | Value                            | Usage                  |
| ----- | -------------------------------- | ---------------------- |
| `xs`  | `0 2px 4px rgba(0,0,0,0.1)`      | Subtle shadows         |
| `sm`  | `0 2px 4px rgba(0,0,0,0.1)`      | Default card shadow    |
| `md`  | `0 4px 6px -1px rgba(0,0,0,0.1)` | Medium elevation       |
| `lg`  | `0 4px 12px rgba(0,0,0,0.15)`    | Modal/elevated content |

---

## 🧱 Component Design Specifications

### Buttons

#### Primary Button

- **Background:** Linear gradient (`#667eea` → `#764ba2`)
- **Color:** White
- **Padding:** 16px horizontal × 12px vertical
- **Border Radius:** 8px
- **Font:** 14px, semibold
- **Hover:** Translate up 2px, shadow increase

#### Secondary Button

- **Background:** White
- **Color:** Text primary (`#1e293b`)
- **Border:** 1px solid `#e2e8f0`
- **Padding:** 16px horizontal × 12px vertical
- **Border Radius:** 8px

#### Danger Button

- **Background:** `#ef4444`
- **Color:** White
- **Padding:** 16px horizontal × 12px vertical
- **Border Radius:** 8px

---

### Input & Form Controls

#### Text Input / Textarea

- **Font Size:** 14px (body)
- **Padding:** 16px horizontal × 12px vertical
- **Border:** 1px solid `#e2e8f0`
- **Border Radius:** 8px
- **Focus:** Border color → `#667eea`, ring → `rgba(102,126,234,0.1)`
- **Placeholder:** `#64748b` (text secondary)
- **Background:** White

#### Form Label

- **Font Size:** 12px
- **Font Weight:** Semibold (600)
- **Color:** Text primary (`#1e293b`)
- **Margin Bottom:** 8px

---

### Cards

#### Base Card

- **Background:** White
- **Padding:** 24px
- **Border Radius:** 16px
- **Shadow:** `0 2px 4px rgba(0,0,0,0.1)`
- **Border:** None

#### KPI Card (Business Metrics)

- **Background:** White
- **Padding:** 24px
- **Border Radius:** 16px
- **Border Top:** 4px gradient (`#667eea` → `#764ba2`)
- **Shadow:** `0 2px 4px rgba(0,0,0,0.1)`
- **Hover:** Border thickness increase, shadow increase

#### AI Insight Card

- **Background:** `rgba(102,126,234,0.05)`
- **Padding:** 24px
- **Border Radius:** 16px
- **Border:** 1px solid `rgba(102,126,234,0.2)`
- **Shadow:** `0 2px 4px rgba(0,0,0,0.1)`

---

### Status Badges

| Status      | Background | Text      | Usage                             |
| ----------- | ---------- | --------- | --------------------------------- |
| **Paid**    | `#dcfce7`  | `#166534` | Paid invoices, completed payments |
| **Pending** | `#fef3c7`  | `#92400e` | Pending approvals, pending orders |
| **Overdue** | `#fee2e2`  | `#991b1b` | Overdue invoices, late payments   |

**Style Rules:**

- Font Size: 12px
- Font Weight: Semibold (600)
- Padding: 8px horizontal × 4px vertical
- Border Radius: 9999px (fully rounded)
- Text Transform: Uppercase
- Letter Spacing: 0.02em

---

## 📐 Derived Design Specifications

For components **not explicitly designed** above, apply these derivation rules:

### Form Controls (Generalized)

- **Font Size:** Body (14px)
- **Text Color:** Text Primary (`#1e293b`)
- **Placeholder Color:** Text Secondary (`#64748b`)
- **Border Color:** Default → `#e2e8f0`, Focus → `#667eea`
- **Border Radius:** 8px
- **Padding:** 16px × 12px (standard), 12px × 8px (compact)

### Icons

- **Default Size:** 20px (body-aligned)
- **Small Size:** 16px
- **Large Size:** 24px
- **Colors:**
  - Default → Text Primary (`#1e293b`)
  - Secondary → Text Secondary (`#64748b`)
  - Success → `#10b981`
  - Warning → `#f59e0b`
  - Danger → `#ef4444`
  - Primary → `#667eea`

### Tables

- **Header Font Size:** 18px (h3)
- **Header Font Weight:** Semibold (600)
- **Header Color:** Text Primary (`#1e293b`)
- **Body Font Size:** 14px (body)
- **Body Color:** Text Primary (`#1e293b`)
- **Border Color:** `#e2e8f0`
- **Row Hover Background:** `#f8fafc`
- **Padding:** 12px (all cells)

### Charts (Recharts, etc.)

- **Color Palette:** `[#667eea, #10b981, #f59e0b, #ef4444, #764ba2]`
  - Primary Blue, Success, Warning, Danger, Primary Purple
- **Font Size:** 12px (small)
- **Text Color:** `#64748b` (text secondary)
- **Grid Color:** `#e2e8f0`

---

## 🔗 Tailwind Class Mappings

All design tokens map to Tailwind classes in the config. Use these:

### Colors

```css
.text-dark                  /* #1e293b (text-primary) */
/* #1e293b (text-primary) */
.text-gray-text            /* #64748b (text-secondary) */
.bg-primary                /* #667eea (primary brand) */
.bg-success                /* #10b981 */
.bg-warning                /* #f59e0b */
.bg-danger                 /* #ef4444 */
.border-gray-border; /* #e2e8f0 */
```

### Typography

```css
.text-h1                   /* 32px, bold */
/* 32px, bold */
.text-h2                   /* 24px, semibold */
.text-h3                   /* 18px, semibold */
.text-body                 /* 14px, normal */
.text-small                /* 12px, normal */
.font-semibold             /* 600 */
.font-bold; /* 700 */
```

### Spacing

```css
.px-6 .py-3                /* Button padding (16px × 12px) */
.px-4 .py-3                /* Input padding (12px × 12px) */
.p-6                       /* Card padding (24px) */
.gap-4 .gap-6; /* Grid gaps (16px, 24px) */
```

### Rounding

```css
.rounded-lg                /* Buttons, inputs (8px) */
/* Buttons, inputs (8px) */
.rounded-xl                /* Cards (16px) */
.rounded-full; /* Badges, avatars (9999px) */
```

### Shadows

```css
.shadow-custom-sm          /* Light shadow */
/* Light shadow */
.shadow-custom-md          /* Medium shadow */
.shadow-custom-lg; /* Heavy shadow */
```

---

## ⚠️ ENFORCEMENT RULES (Non-Negotiable)

### ❌ MUST NOT DO:

```tsx
// Hardcoded colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
style={{ color: '#667eea' }}
className="text-gray-900"     // gray-900 not in system

// Hardcoded font sizes
className="text-2xl"          // Use text-h2 instead
style={{ fontSize: '20px' }}

// Hardcoded padding
style={{ padding: '20px' }}   // Use spacing tokens

// Unstyled elements
<button>Click me</button>      // Apply variant styles
```

### ✅ MUST DO INSTEAD:

```tsx
// Use design tokens
import { Colors, Spacing, Typography } from '@/lib/design-tokens';

// In classNames
className="text-h2 font-semibold text-dark"
className="px-6 py-3 rounded-lg bg-primary text-white"

// In styles (if necessary)
style={{ color: Colors.primary.start, fontSize: Typography.fontSize.h2 }}

// For charts
const COLORS = [Colors.primary.start, Colors.success, Colors.warning, Colors.danger];

// Apply component specs
<button className="...primary-button-classes...">Save</button>
```

---

## 📂 Where Design Tokens Live

```
lib/
├── design-tokens.ts        ← SINGLE SOURCE OF TRUTH
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── BorderRadius
│   ├── Shadows
│   ├── ComponentSpecs
│   ├── DerivationRules
│   └── TailwindClasses
│
└── utils.ts                ← Utility functions

tailwind.config.ts          ← Tailwind configuration (derived from design-tokens)
app/globals.css            ← Global CSS (custom gradients, KPI cards, AI insights)
```

---

## 🚀 Next Steps (Phase 2)

Once this foundation is locked in, Phase 2 will:

1. ✅ Create reusable Typography components (`<H1>`, `<H2>`, `<Body>`, etc.)
2. ✅ Create specialized Card components (KPI, AI Insight)
3. ✅ Create Icon wrapper with semantic colors
4. ✅ Audit and refactor existing pages to use tokens
5. ✅ Enforce design system across codebase

---

## 📊 Quick Reference

| Concept             | Token                           | Value       | Tailwind         |
| ------------------- | ------------------------------- | ----------- | ---------------- |
| Primary Brand Start | `Colors.primary.start`          | `#667eea`   | `bg-primary`     |
| Primary Brand End   | `Colors.primary.end`            | `#764ba2`   | —                |
| Success             | `Colors.success`                | `#10b981`   | `bg-success`     |
| Text Primary        | `Colors.text.primary`           | `#1e293b`   | `text-dark`      |
| Text Secondary      | `Colors.text.secondary`         | `#64748b`   | `text-gray-text` |
| H1 Size             | `Typography.fontSize.h1`        | 32px        | `text-h1`        |
| H2 Size             | `Typography.fontSize.h2`        | 24px        | `text-h2`        |
| Body Size           | `Typography.fontSize.body`      | 14px        | `text-body`      |
| Button Padding      | `Spacing.buttonPadding.default` | 16px × 12px | `px-6 py-3`      |
| Card Padding        | `Spacing.cardPadding.default`   | 24px        | `p-6`            |
| Button Radius       | `BorderRadius.button`           | 8px         | `rounded-lg`     |
| Card Radius         | `BorderRadius.card`             | 16px        | `rounded-xl`     |

---

**Document Status:** ✅ APPROVED & LOCKED  
**Last Updated:** 2026-01-08  
**Next Review:** Before Phase 2 implementation
