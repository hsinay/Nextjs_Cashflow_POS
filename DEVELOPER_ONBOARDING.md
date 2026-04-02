# Developer Onboarding: Design System

Welcome to the project! This guide will help you understand and use the design system correctly.

**Read time:** 10 minutes  
**Difficulty:** Beginner-friendly  
**Prerequisites:** Basic React/TypeScript knowledge

---

## Quick Start (5 minutes)

### 1. Know the Three Key Files

```typescript
// 1. All design decisions live here
import { Colors, Typography } from "@/lib/design-tokens.ts";

// 2. All reusable components here
import { H1, H2, H3, Small, StatusBadge, KPICard } from "@/components/ui";

// 3. That's it! Only these two imports needed
```

### 2. Golden Rule

> **Use design tokens for everything. Never hardcode colors, sizes, or spacing.**

### 3. Most Common Patterns

**Pattern 1: Page Header**

```typescript
import { H1, Small } from "@/components/ui";
import { Colors } from "@/lib/design-tokens";

export function MyPage() {
  return (
    <div>
      <H1>Page Title</H1>
      <Small color={Colors.text.secondary}>Subtitle</Small>
    </div>
  );
}
```

**Pattern 2: Metric Cards**

```typescript
import { KPICard } from "@/components/ui";

export function Dashboard() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <KPICard title="Sales" value="$10k" subtext="This month" />
      <KPICard title="Orders" value="240" subtext="This month" />
      <KPICard title="Growth" value="+15%" subtext="vs last month" trend="up" />
    </div>
  );
}
```

**Pattern 3: Status Badges**

```typescript
import { StatusBadge } from "@/components/ui";

export function OrderList() {
  return (
    <div>
      <StatusBadge status="APPROVED" />
      <StatusBadge status="PENDING" />
      <StatusBadge status="REJECTED" />
    </div>
  );
}
```

---

## Learning Path

### Level 1: Basics (Read 5 min)

**What you need to know:**

- Use `Colors` for colors
- Use `Typography` for spacing
- Use components from `/components/ui` for common elements

**Example:**

```typescript
// ❌ Don't do this
<div className="bg-blue-50 p-4 text-sm text-gray-600">
  Message
</div>

// ✅ Do this
<div style={{
  backgroundColor: Colors.primary.light,
  padding: Typography.spacing.md
}}>
  <Small color={Colors.text.secondary}>Message</Small>
</div>
```

### Level 2: Component Catalog (Read 10 min)

**Available UI Components:**

| Component                | Use For                          | Example                                                     |
| ------------------------ | -------------------------------- | ----------------------------------------------------------- |
| `H1`, `H2`, `H3`         | Page titles, section headers     | `<H1>Sales Dashboard</H1>`                                  |
| `Small`, `Body`, `Label` | Secondary text, labels, captions | `<Small color={Colors.text.secondary}>`                     |
| `StatusBadge`            | Status indicators                | `<StatusBadge status="APPROVED" />`                         |
| `KPICard`                | Metrics, key numbers             | `<KPICard title="Sales" value="$10k" />`                    |
| `AlertBox`               | Alerts, notifications            | `<AlertBox variant="danger" message="Error" />`             |
| `EnhancedButton`         | Interactive buttons              | `<EnhancedButton variant="primary">Submit</EnhancedButton>` |
| `EnhancedInput`          | Form inputs with labels          | `<EnhancedInput label="Name" error={error} />`              |
| `EmptyState`             | Empty data states                | `<EmptyState title="No data" icon={<Icon />} />`            |
| `Icon`                   | Icon wrapper                     | `<Icon size="md" color={Colors.primary.main} />`            |

### Level 3: Design Tokens Reference (Read 15 min)

**Colors Available:**

```typescript
import { Colors } from "@/lib/design-tokens";

// Primary colors (blues)
Colors.primary.main; // #667eea (use for primary buttons, links)
Colors.primary.light; // #f0f4ff (use for light backgrounds)
Colors.primary.lighter; // #f9faff (use for very light backgrounds)

// Text colors (use these, not gray[900/600/500])
Colors.text.primary; // #1e293b (for main text)
Colors.text.secondary; // #64748b (for secondary text)
Colors.text.tertiary; // #94a3b8 (for disabled/hint text)

// Status colors (use for status-specific items)
Colors.status.paid.main; // #10b981 (green, success)
Colors.status.pending.main; // #f59e0b (orange, warning)
Colors.status.rejected.main; // #ef4444 (red, danger)

// Gray scale (for borders, dividers, backgrounds)
Colors.gray[50]; // #f9fafb (very light)
Colors.gray[100]; // #f3f4f6
Colors.gray[200]; // #e5e7eb (borders, dividers)
Colors.gray[300]; // #d1d5db

// Special
Colors.background; // #ffffff (main background)
```

**Typography Sizes:**

```typescript
import { Typography } from "@/lib/design-tokens";

// Sizes (but use components instead!)
Typography.sizes.h1; // 32px, bold
Typography.sizes.h2; // 24px, semibold
Typography.sizes.h3; // 18px, semibold
Typography.sizes.body; // 14px, regular
Typography.sizes.small; // 12px, regular
Typography.sizes.label; // 12px, semibold

// Spacing (in px)
Typography.spacing.xs; // 4px
Typography.spacing.sm; // 8px
Typography.spacing.md; // 12px
Typography.spacing.lg; // 16px
Typography.spacing.xl; // 24px
Typography.spacing["2xl"]; // 32px

// Border radius
Typography.borderRadius.sm; // 4px
Typography.borderRadius.md; // 8px
Typography.borderRadius.lg; // 12px

// Shadows
Typography.shadows.sm; // Small elevation
Typography.shadows.md; // Medium elevation
Typography.shadows.lg; // Large elevation
```

---

## Real-World Examples

### Example 1: Sales Dashboard Card

```typescript
import { H2, Small, KPICard } from "@/components/ui";
import { Colors, Typography } from "@/lib/design-tokens";

export function SalesDashboard() {
  return (
    <div style={{ padding: Typography.spacing.lg }}>
      <H2>Sales Summary</H2>
      <Small color={Colors.text.secondary} className="mb-4">
        January 2026
      </Small>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Sales"
          value="₹125,450"
          subtext="↑ 12% from last month"
          trend="up"
        />
        <KPICard
          title="Orders"
          value="342"
          subtext="↓ 5% from last month"
          trend="down"
        />
        <KPICard
          title="Avg Order Value"
          value="₹366"
          subtext="↑ 8% from last month"
          trend="up"
        />
      </div>
    </div>
  );
}
```

### Example 2: Order List with Status

```typescript
import { H3, Small, StatusBadge } from "@/components/ui";
import { Colors, Typography } from "@/lib/design-tokens";

export function OrderList() {
  return (
    <div style={{ padding: Typography.spacing.lg }}>
      <H3>Recent Orders</H3>

      <div style={{ marginTop: Typography.spacing.lg }}>
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: Typography.spacing.md,
              borderBottom: `1px solid ${Colors.gray[200]}`,
            }}
          >
            <div>
              <p style={{ color: Colors.text.primary, fontWeight: "bold" }}>
                Order {order.id}
              </p>
              <Small color={Colors.text.secondary}>
                {new Date(order.date).toLocaleDateString()}
              </Small>
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ color: Colors.text.primary }}>₹{order.amount}</p>
              <StatusBadge status={order.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Form with Validation

```typescript
import { H2, EnhancedButton, EnhancedInput } from "@/components/ui";
import { Typography } from "@/lib/design-tokens";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
});

export function ContactForm() {
  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: Typography.spacing.lg,
        maxWidth: "400px",
      }}
    >
      <H2>Contact Form</H2>

      <EnhancedInput
        label="Name"
        {...register("name")}
        error={errors.name?.message}
        helperText="Your full name"
      />

      <EnhancedInput
        label="Email"
        type="email"
        {...register("email")}
        error={errors.email?.message}
        helperText="We'll never share your email"
      />

      <EnhancedButton variant="primary">Submit</EnhancedButton>
    </form>
  );
}
```

### Example 4: Alert Patterns

```typescript
import { AlertBox } from "@/components/ui";

export function NotificationExamples() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Success alert */}
      <AlertBox
        variant="success"
        title="Success"
        message="Your changes have been saved"
        closable
      />

      {/* Warning alert */}
      <AlertBox
        variant="warning"
        title="Warning"
        message="This action cannot be undone"
      />

      {/* Error alert */}
      <AlertBox
        variant="danger"
        title="Error"
        message="Something went wrong. Please try again."
        closable
      />

      {/* Info alert */}
      <AlertBox
        variant="info"
        title="Info"
        message="Your session will expire in 5 minutes"
      />
    </div>
  );
}
```

---

## Common Mistakes & How to Fix Them

### Mistake 1: Using Tailwind Colors

```typescript
// ❌ WRONG
<div className="bg-blue-50 border border-blue-200 text-blue-600">

// ✅ CORRECT
import { Colors } from '@/lib/design-tokens';
<div style={{
  backgroundColor: Colors.primary.light,
  border: `1px solid ${Colors.primary.lighter}`,
  color: Colors.primary.main
}}>
```

**Why:** Design tokens ensure consistency. If we change the primary color, all components update automatically.

### Mistake 2: Using Arbitrary Text Sizes

```typescript
// ❌ WRONG
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-sm text-gray-600">Subtitle</p>

// ✅ CORRECT
import { H1, Small } from '@/components/ui';
<H1>Title</H1>
<Small color={Colors.text.secondary}>Subtitle</Small>
```

**Why:** Semantic components guarantee correct typography. H1 is always 32px bold, no exceptions.

### Mistake 3: Hardcoding Spacing

```typescript
// ❌ WRONG
<div className="p-4 m-2 gap-3">

// ✅ CORRECT
import { Typography } from '@/lib/design-tokens';
<div style={{
  padding: Typography.spacing.md,
  margin: Typography.spacing.sm,
  gap: Typography.spacing.md
}}>
```

**Why:** Using tokens creates consistent spacing throughout the app.

### Mistake 4: Custom Status Badges

```typescript
// ❌ WRONG
<span className={getStatusClass(status)}>{status}</span>;

// ✅ CORRECT
import { StatusBadge } from "@/components/ui";
<StatusBadge status={status} />;
```

**Why:** StatusBadge handles all status types consistently, prevents duplication.

### Mistake 5: Custom Metric Cards

```typescript
// ❌ WRONG
<div className="bg-gradient-to-br from-blue-50 p-4">
  <p className="text-xs">{title}</p>
  <p className="text-3xl font-bold">{value}</p>
</div>;

// ✅ CORRECT
import { KPICard } from "@/components/ui";
<KPICard title={title} value={value} />;
```

**Why:** KPICard is purpose-built for metrics, with built-in design token compliance.

---

## Troubleshooting

### "I need a color that doesn't exist in Colors"

**Solution:** Add it to `/lib/design-tokens.ts` first, then use it. Don't create one-off hardcoded colors.

### "The component looks different than in Figma"

**Solution:** Check the design tokens. They define the source of truth. If Figma is different, update tokens in consultation with design.

### "This component needs custom styling"

**Solution:** If no existing component fits, create a new one in `/components/ui/` using design tokens, then export it centrally.

### "I want to use a different shade of blue"

**Solution:** Use the semantic tokens instead:

- Light backgrounds: `Colors.primary.light`
- Main color: `Colors.primary.main`
- Borders: `Colors.primary.lighter`

Don't pick your own shade.

---

## Checklists Before Committing

### Code Review Self-Checklist

Before pushing your code, verify:

- [ ] No `className="bg-"` or `className="text-"` (except utilities like `text-center`)
- [ ] No `className="p-"` or `className="m-"` or `className="gap-"`
- [ ] All typography uses H1/H2/H3/Small/Body/Label components
- [ ] All colors use Colors tokens
- [ ] All spacing uses Typography.spacing tokens
- [ ] All status displays use StatusBadge
- [ ] All metrics use KPICard
- [ ] Imports from `/components/ui`, not from individual files

### Quick Check Commands

```bash
# Check for hardcoded colors
grep -r "bg-\|text-\|border-" src/app src/components --include="*.tsx" | grep -v "text-center\|bg-white"

# Check for hardcoded spacing
grep -r "p-\|m-\|gap-" src/app src/components --include="*.tsx" | grep "[0-9]"

# Check for arbitrary text sizes
grep -r "text-xs\|text-sm\|text-lg\|text-2xl\|text-3xl" src/app src/components --include="*.tsx"
```

If any results appear, fix them before committing.

---

## Getting Help

### Where to Find Information

| Question                          | Answer Found In                                      |
| --------------------------------- | ---------------------------------------------------- |
| "What colors can I use?"          | `/lib/design-tokens.ts` Colors section               |
| "How do I display status?"        | `StatusBadge` component in `/components/ui/index.ts` |
| "What components exist?"          | `/components/ui/index.ts` (central export)           |
| "How should I structure spacing?" | This file, "Design Tokens Reference" section         |
| "What's not allowed?"             | CODE_REVIEW_CHECKLIST.md "Anti-Patterns" section     |
| "Can I use Tailwind classes?"     | DESIGN_SYSTEM_GUIDELINES.md "Core Principles"        |

### Asking Questions

If you're stuck:

1. Check `/lib/design-tokens.ts` for available tokens
2. Check `/components/ui/index.ts` for available components
3. Review "Real-World Examples" section above
4. Ask the team on Slack (#design-system channel)

---

## Next Steps

1. **Bookmark these files:**

   - `/lib/design-tokens.ts` - Reference constantly
   - `/components/ui/index.ts` - Know what's available
   - `DESIGN_SYSTEM_GUIDELINES.md` - Rules & principles
   - `CODE_REVIEW_CHECKLIST.md` - What reviewers check

2. **Try implementing:**

   - A simple page with H1, Small, and KPICard
   - A form with EnhancedInput and EnhancedButton
   - A list with StatusBadge components

3. **Start new features with:**
   ```typescript
   import { Colors, Typography } from "@/lib/design-tokens";
   import { H1, H2, Small, StatusBadge, KPICard } from "@/components/ui";
   ```

---

## Quick Reference Card

Keep this handy:

```typescript
// COLORS
Colors.primary.main                    // Primary action color
Colors.status.paid.main                // Success/positive
Colors.status.pending.main             // Warning/neutral
Colors.status.rejected.main            // Error/negative
Colors.text.primary                    // Main text
Colors.text.secondary                  // Secondary text
Colors.gray[200]                       // Borders
Colors.gray[50]                        // Light backgrounds

// TYPOGRAPHY
<H1>, <H2>, <H3>                       // Headers
<Small>, <Body>, <Label>               // Text elements
Typography.spacing.md                  // 12px spacing
Typography.spacing.lg                  // 16px spacing
Typography.borderRadius.md             // 8px radius

// COMPONENTS
<KPICard />                            // Metrics
<StatusBadge />                        // Status
<AlertBox />                           // Alerts
<EnhancedButton />                     // Buttons
<EnhancedInput />                      // Forms
<EmptyState />                         // Empty states
```

---

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Created for:** New developers joining the project
