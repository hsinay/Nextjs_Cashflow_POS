# PHASE 2 — DERIVED DESIGN SPEC (REQUIRED UI CONTROLS)

**Status:** ✅ IN PROGRESS  
**Date:** 2026-01-08  
**Foundation:** Phase 1 (Design Tokens Complete)

---

## 📋 OBJECTIVE

Define design behavior for UI components **NOT explicitly designed** in Phase 1, using **derivation rules only**.

All specifications must derive from:

- Core Colors
- Typography Scale
- Spacing System
- Border Radius Standards
- Component Specs (Button, Card, Badge)

**NO NEW COLORS, SIZES, OR SPACING ALLOWED.**

---

## 🎯 DERIVED COMPONENTS

### 1. FORM CONTROLS (Input, Textarea, Select)

#### 1.1 Text Input Field

**Derivation:**

- Font: Body (14px, Regular)
- Text: Text Primary (#1e293b)
- Placeholder: Text Secondary (#64748b)
- Border: Gray 200 (neutral, default state)
- Border Focus: Primary Gradient Start (#667eea)
- Error State: Danger Red (#ef4444)
- Padding: Input Padding Standard (16px x-axis, 12px y-axis)
- Border Radius: Input (8px)
- Box Shadow: Focus ring uses primary.light
- Transition: Normal (300ms ease-in-out)

**Specification:**

```typescript
TextInput {
  default: {
    fontSize: 14px,
    color: #1e293b,
    placeholder: #64748b,
    border: 1px solid #e2e8f0,
    borderRadius: 8px,
    padding: 12px 16px,
    background: #ffffff,
    transition: 300ms ease-in-out,
    cursor: text,
  },

  focus: {
    borderColor: #667eea,
    outline: none,
    boxShadow: 0 0 0 3px rgba(102, 126, 234, 0.1),
  },

  error: {
    borderColor: #ef4444,
    boxShadow: 0 0 0 3px rgba(239, 68, 68, 0.1),
  },

  disabled: {
    background: #f8fafc,
    color: #9ca3af,
    cursor: not-allowed,
    opacity: 0.6,
  },
}
```

#### 1.2 Textarea Field

**Derivation:**

- Same as Text Input (inherits all properties)
- Font: Body (14px, Regular)
- Additional: Line Height Normal (1.5)
- Resize: Vertical only
- Min Height: 100px (typography-based: 4 lines of body text)

**Specification:**

```typescript
Textarea {
  fontSize: 14px,
  color: #1e293b,
  placeholder: #64748b,
  border: 1px solid #e2e8f0,
  borderRadius: 8px,
  padding: 12px 16px,
  background: #ffffff,
  lineHeight: 1.5,
  minHeight: 100px,
  resize: vertical,
  fontFamily: Inter, sans-serif,

  focus: {
    borderColor: #667eea,
    boxShadow: 0 0 0 3px rgba(102, 126, 234, 0.1),
  },

  error: {
    borderColor: #ef4444,
    boxShadow: 0 0 0 3px rgba(239, 68, 68, 0.1),
  },
}
```

#### 1.3 Select Dropdown

**Derivation:**

- Font: Body (14px, Regular)
- Text: Text Primary (#1e293b)
- Background: White (#ffffff)
- Border: Gray 200 (neutral)
- Border Focus: Primary Start (#667eea)
- Border Radius: Input (8px)
- Padding: Input Padding Standard (16px x, 12px y)
- Dropdown Menu: Card styling (16px border-radius, shadow-lg)
- Hover Item: Background Gray 50 (#f8fafc)
- Selected Item: Primary gradient text

**Specification:**

```typescript
Select {
  trigger: {
    fontSize: 14px,
    color: #1e293b,
    placeholder: #64748b,
    border: 1px solid #e2e8f0,
    borderRadius: 8px,
    padding: 12px 16px,
    background: #ffffff,
    display: flex,
    justifyContent: space-between,
    alignItems: center,
  },

  menu: {
    borderRadius: 16px,
    background: #ffffff,
    boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15),
    padding: 8px 0,
    zIndex: 100,
  },

  menuItem: {
    default: {
      fontSize: 14px,
      color: #1e293b,
      padding: 12px 16px,
      cursor: pointer,
      transition: 150ms ease-in-out,
    },

    hover: {
      background: #f8fafc,
    },

    selected: {
      color: #667eea,
      background: #f8fafc,
    },
  },
}
```

#### 1.4 Form Label

**Derivation:**

- Font: Small (12px, Semibold)
- Color: Text Primary (#1e293b)
- Margin Bottom: Small (8px)
- Letter Spacing: Wide (0.02em)

**Specification:**

```typescript
Label {
  fontSize: 12px,
  fontWeight: 600,
  color: #1e293b,
  marginBottom: 8px,
  letterSpacing: 0.02em,
  display: block,
  cursor: pointer,
}
```

#### 1.5 Form Error Message

**Derivation:**

- Font: Small (12px, Regular)
- Color: Danger Red (#ef4444)
- Margin Top: Xs (4px)
- Display: Block

**Specification:**

```typescript
ErrorMessage {
  fontSize: 12px,
  fontWeight: 400,
  color: #ef4444,
  marginTop: 4px,
  display: block,
}
```

#### 1.6 Form Helper Text

**Derivation:**

- Font: Small (12px, Regular)
- Color: Text Secondary (#64748b)
- Margin Top: Xs (4px)
- Display: Block

**Specification:**

```typescript
HelperText {
  fontSize: 12px,
  fontWeight: 400,
  color: #64748b,
  marginTop: 4px,
  display: block,
}
```

---

### 2. ICONS

#### 2.1 Default Icon Sizing

**Derivation from Typography:**

- Default (Body-aligned): 20px
- Small (Compact, labels): 16px
- Large (Prominent, headers): 24px
- Hero (Page-level): 32px

**Specification:**

```typescript
Icon {
  sizeDefault: 20px,      // Body text paired
  sizeSmall: 16px,        // Compact, labels
  sizeLarge: 24px,        // Section headers, prominent
  sizeHero: 32px,         // Page-level, illustrations

  // Color Mapping (Semantic)
  colorDefault: #1e293b,     // Text Primary
  colorSecondary: #64748b,   // Text Secondary
  colorSuccess: #10b981,     // Success semantic
  colorWarning: #f59e0b,     // Warning semantic
  colorDanger: #ef4444,      // Danger semantic
  colorPrimary: #667eea,     // Brand primary
  colorInverted: #ffffff,    // On dark backgrounds
}
```

#### 2.2 Icon in Button

**Derivation:**

- Size: Default (20px)
- Margin Right: Xs (4px)
- Color: Inherit from button text color (white in primary, primary in secondary)
- Vertical Align: Middle

**Specification:**

```typescript
IconInButton {
  size: 20px,
  marginRight: 4px,
  color: inherit,
  verticalAlign: middle,
  display: inline-block,
}
```

#### 2.3 Icon in Form Control

**Derivation:**

- Size: Small (16px)
- Position: Right side of input (absolute, 12px right, centered)
- Color: Text Secondary (#64748b)
- Pointer Events: None (so it doesn't intercept input focus)

**Specification:**

```typescript
IconInInput {
  size: 16px,
  position: absolute,
  right: 12px,
  top: 50%,
  transform: translateY(-50%),
  color: #64748b,
  pointerEvents: none,
  opacity: 0.7,
}
```

#### 2.4 Icon in Table Header

**Derivation:**

- Size: Default (20px)
- Color: Text Primary (#1e293b)
- Margin Left: Xs (4px)
- Display: Inline-block

**Specification:**

```typescript
IconInTable {
  size: 20px,
  marginLeft: 4px,
  color: #1e293b,
  display: inline-block,
  verticalAlign: middle,
}
```

---

### 3. TABLES

#### 3.1 Table Header

**Derivation:**

- Font: H3 (18px, Semibold)
- Color: Text Primary (#1e293b)
- Background: Gray 50 (#f8fafc)
- Border Bottom: 1px Gray 200
- Padding: Medium (12px)
- Text Transform: Capitalize
- Vertical Align: Middle

**Specification:**

```typescript
TableHeader {
  fontSize: 18px,
  fontWeight: 600,
  color: #1e293b,
  background: #f8fafc,
  borderBottom: 1px solid #e2e8f0,
  padding: 12px,
  textAlign: left,
  verticalAlign: middle,
  fontFamily: Inter, sans-serif,
}
```

#### 3.2 Table Body Cell

**Derivation:**

- Font: Body (14px, Regular)
- Color: Text Primary (#1e293b)
- Padding: Medium (12px)
- Border Bottom: 1px Gray 200

**Specification:**

```typescript
TableBodyCell {
  fontSize: 14px,
  fontWeight: 400,
  color: #1e293b,
  padding: 12px,
  borderBottom: 1px solid #e2e8f0,
  textAlign: left,
  verticalAlign: middle,
}
```

#### 3.3 Table Row

**Derivation:**

- Hover Background: Gray 50 (#f8fafc)
- Transition: Fast (150ms ease-in-out)
- Stripe Pattern: Alternate gray rows optional (use Gray 50 every other row)

**Specification:**

```typescript
TableRow {
  default: {
    background: #ffffff,
    transition: 150ms ease-in-out,
  },

  hover: {
    background: #f8fafc,
    cursor: pointer,
  },

  striped: {
    // Alternate rows
    evenRow: #ffffff,
    oddRow: #f8fafc,
  },

  selected: {
    background: rgba(102, 126, 234, 0.1),
    borderLeft: 4px solid #667eea,
  },
}
```

#### 3.4 Table Container

**Derivation:**

- Border: 1px Gray 200
- Border Radius: Card (16px)
- Shadow: Xs (0 2px 4px)
- Overflow: Auto (for responsive scrolling)

**Specification:**

```typescript
TableContainer {
  border: 1px solid #e2e8f0,
  borderRadius: 16px,
  boxShadow: 0 2px 4px rgba(0, 0, 0, 0.1),
  overflow: auto,
  background: #ffffff,
}
```

---

### 4. MODALS & DIALOGS

#### 4.1 Modal Container

**Derivation:**

- Border Radius: Modal (16px)
- Background: Card white (#ffffff)
- Box Shadow: Large (0 20px 25px)
- Padding: Large (16px)
- Max Width: 500px (standard), 800px (wide)

**Specification:**

```typescript
Modal {
  container: {
    borderRadius: 16px,
    background: #ffffff,
    boxShadow: 0 20px 25px rgba(0, 0, 0, 0.1),
    padding: 16px,
    maxWidth: 500px,
    width: 90vw,
    maxHeight: 90vh,
    overflow: auto,
  },

  overlay: {
    background: rgba(0, 0, 0, 0.5),
    backdropFilter: blur(4px),
    zIndex: 300,
  },
}
```

#### 4.2 Modal Header

**Derivation:**

- Title: H2 (24px, Semibold)
- Color: Text Primary (#1e293b)
- Padding Bottom: Large (16px)
- Border Bottom: 1px Gray 200
- Display: Flex (justify-between for close button)

**Specification:**

```typescript
ModalHeader {
  display: flex,
  justifyContent: space-between,
  alignItems: center,
  paddingBottom: 16px,
  borderBottom: 1px solid #e2e8f0,

  title: {
    fontSize: 24px,
    fontWeight: 600,
    color: #1e293b,
  },

  closeButton: {
    background: transparent,
    border: none,
    fontSize: 24px,
    color: #64748b,
    cursor: pointer,
    padding: 0,
  },
}
```

#### 4.3 Modal Content

**Derivation:**

- Font: Body (14px, Regular)
- Color: Text Primary (#1e293b)
- Padding: Large (16px) top and bottom
- Line Height: Normal (1.5)

**Specification:**

```typescript
ModalContent {
  fontSize: 14px,
  fontWeight: 400,
  color: #1e293b,
  padding: 16px 0,
  lineHeight: 1.5,
}
```

#### 4.4 Modal Footer (Actions)

**Derivation:**

- Buttons ONLY (Primary, Secondary, Danger as needed)
- Display: Flex with gap (8px)
- Padding Top: Large (16px)
- Border Top: 1px Gray 200
- Justify: Flex-end

**Specification:**

```typescript
ModalFooter {
  display: flex,
  gap: 8px,
  paddingTop: 16px,
  borderTop: 1px solid #e2e8f0,
  justifyContent: flex-end,

  // Button spacing rules
  primaryButton: {
    marginLeft: auto,  // Rightmost
  },

  secondaryButton: {
    marginRight: 8px,  // Before primary
  },

  dangerButton: {
    marginRight: auto,  // Leftmost
  },
}
```

---

### 5. NAVIGATION & MENUS

#### 5.1 Main Navigation / Header

**Derivation:**

- Background: White (#ffffff)
- Border Bottom: 1px Gray 200
- Height: Large (56px recommended)
- Padding: Medium (12px horizontal)
- Display: Flex, justify-between, align-center

**Specification:**

```typescript
Header {
  background: #ffffff,
  borderBottom: 1px solid #e2e8f0,
  height: 56px,
  padding: 0 12px,
  display: flex,
  justifyContent: space-between,
  alignItems: center,
  boxShadow: 0 2px 4px rgba(0, 0, 0, 0.1),
}
```

#### 5.2 Navigation Link

**Derivation:**

- Font: Body (14px, Regular)
- Color: Text Primary (#1e293b)
- Hover: Primary Gradient Text
- Active: Primary Gradient + bottom border accent

**Specification:**

```typescript
NavLink {
  default: {
    fontSize: 14px,
    fontWeight: 400,
    color: #1e293b,
    textDecoration: none,
    padding: 8px 16px,
    borderRadius: 8px,
    transition: 300ms ease-in-out,
  },

  hover: {
    color: #667eea,
    background: rgba(102, 126, 234, 0.05),
  },

  active: {
    color: #667eea,
    borderBottom: 3px solid #667eea,
    background: rgba(102, 126, 234, 0.05),
  },
}
```

#### 5.3 Dropdown Menu

**Derivation:** (see Select Dropdown in Form Controls)

- Uses same styling as Select Menu
- Border Radius: Card (16px)
- Shadow: Large
- Z-Index: Dropdown (100)

---

### 6. BREADCRUMBS

**Derivation:**

- Font: Small (12px, Regular)
- Color: Text Secondary (#64748b)
- Separator: "/" in Text Secondary
- Active Link: Text Primary (#1e293b)
- Display: Flex, gap (4px)

**Specification:**

```typescript
Breadcrumb {
  container: {
    display: flex,
    alignItems: center,
    gap: 4px,
    fontSize: 12px,
  },

  link: {
    default: {
      color: #64748b,
      textDecoration: none,
      transition: 150ms ease-in-out,
    },

    hover: {
      color: #667eea,
      textDecoration: underline,
    },
  },

  active: {
    color: #1e293b,
    fontWeight: 600,
  },

  separator: {
    color: #9ca3af,
    margin: 0 4px,
  },
}
```

---

### 7. PAGINATION

**Derivation:**

- Font: Body (14px, Regular)
- Color: Text Primary (#1e293b)
- Button Height: Medium (36px)
- Button Width: Medium (36px)
- Border Radius: Input (8px)
- Gap: Xs (4px)

**Specification:**

```typescript
Pagination {
  container: {
    display: flex,
    gap: 4px,
    alignItems: center,
    justifyContent: center,
  },

  button: {
    default: {
      width: 36px,
      height: 36px,
      borderRadius: 8px,
      border: 1px solid #e2e8f0,
      background: #ffffff,
      color: #1e293b,
      fontSize: 14px,
      cursor: pointer,
      transition: 150ms ease-in-out,
    },

    hover: {
      borderColor: #667eea,
      color: #667eea,
      background: rgba(102, 126, 234, 0.05),
    },

    active: {
      background: #667eea,
      color: #ffffff,
      borderColor: #667eea,
    },

    disabled: {
      opacity: 0.5,
      cursor: not-allowed,
    },
  },

  ellipsis: {
    color: #64748b,
    fontSize: 12px,
  },
}
```

---

### 8. ALERTS & NOTIFICATIONS

#### 8.1 Alert Container

**Derivation:**

- Border Radius: Card (16px)
- Padding: Medium (12px)
- Border Left: 4px colored stripe
- Background: Light semantic color

**Specification:**

```typescript
Alert {
  container: {
    borderRadius: 16px,
    padding: 12px,
    borderLeft: 4px solid,
    display: flex,
    gap: 12px,
    alignItems: flex-start,
  },

  success: {
    background: #dcfce7,
    borderLeftColor: #10b981,
  },

  warning: {
    background: #fef3c7,
    borderLeftColor: #f59e0b,
  },

  danger: {
    background: #fee2e2,
    borderLeftColor: #ef4444,
  },

  info: {
    background: rgba(102, 126, 234, 0.05),
    borderLeftColor: #667eea,
  },
}
```

#### 8.2 Alert Title

**Derivation:**

- Font: H3 (18px, Semibold)
- Color: Dark semantic (paired with alert type)

**Specification:**

```typescript
AlertTitle {
  fontSize: 18px,
  fontWeight: 600,

  success: {
    color: #166534,  // Dark green
  },

  warning: {
    color: #92400e,  // Dark yellow
  },

  danger: {
    color: #991b1b,  // Dark red
  },

  info: {
    color: #667eea,  // Brand primary
  },
}
```

#### 8.3 Alert Description

**Derivation:**

- Font: Body (14px, Regular)
- Color: Dark semantic

**Specification:**

```typescript
AlertDescription {
  fontSize: 14px,
  fontWeight: 400,

  success: {
    color: #166534,
  },

  warning: {
    color: #92400e,
  },

  danger: {
    color: #991b1b,
  },

  info: {
    color: #667eea,
  },
}
```

---

### 9. TOAST NOTIFICATIONS

**Derivation:**

- Container: Card styling (border-radius 16px, shadow-lg)
- Padding: Medium (12px)
- Position: Fixed, bottom-right
- Z-Index: Toast (400)
- Animation: Slide in from bottom (150ms ease-out), fade out (300ms ease-in)

**Specification:**

```typescript
Toast {
  container: {
    borderRadius: 16px,
    padding: 12px,
    boxShadow: 0 20px 25px rgba(0, 0, 0, 0.1),
    position: fixed,
    bottom: 16px,
    right: 16px,
    zIndex: 400,
    maxWidth: 400px,
    minWidth: 300px,
  },

  animation: {
    slideIn: 150ms ease-out,
    fadeOut: 300ms ease-in,
  },

  success: {
    background: #dcfce7,
    borderLeft: 4px solid #10b981,
  },

  error: {
    background: #fee2e2,
    borderLeft: 4px solid #ef4444,
  },

  warning: {
    background: #fef3c7,
    borderLeft: 4px solid #f59e0b,
  },

  info: {
    background: rgba(102, 126, 234, 0.05),
    borderLeft: 4px solid #667eea,
  },
}
```

---

### 10. TABS

**Derivation:**

- Font: Body (14px, Regular)
- Color: Text Secondary (inactive), Text Primary (active)
- Border Bottom: 1px Gray 200 (container)
- Active Tab Underline: 3px Primary Gradient

**Specification:**

```typescript
Tabs {
  container: {
    display: flex,
    borderBottom: 1px solid #e2e8f0,
    gap: 0,
  },

  tab: {
    default: {
      fontSize: 14px,
      fontWeight: 400,
      color: #64748b,
      padding: 12px 16px,
      borderBottom: 3px solid transparent,
      background: transparent,
      cursor: pointer,
      transition: 300ms ease-in-out,
    },

    active: {
      color: #1e293b,
      borderBottomColor: #667eea,
      fontWeight: 600,
    },

    hover: {
      color: #1e293b,
    },
  },

  content: {
    padding: 16px 0,
  },
}
```

---

### 11. SEARCH INPUT

**Derivation:**

- Same as Text Input (standard form control)
- Width: Full (100%) or 300px max
- Icon: Search icon (16px) on left side
- Placeholder: "Search..."

**Specification:**

```typescript
SearchInput {
  container: {
    position: relative,
    display: flex,
    alignItems: center,
  },

  input: {
    // Inherits from TextInput
    fontSize: 14px,
    color: #1e293b,
    placeholder: #64748b,
    border: 1px solid #e2e8f0,
    borderRadius: 8px,
    padding: 12px 16px 12px 40px,  // Extra left padding for icon
    width: 100%,
    maxWidth: 300px,
  },

  icon: {
    position: absolute,
    left: 12px,
    size: 16px,
    color: #64748b,
    pointerEvents: none,
  },
}
```

---

### 12. CHIPS / TAGS

**Derivation:**

- Font: Small (12px, Semibold)
- Background: Gray 100 (#fafbfc)
- Border: 1px Gray 200
- Border Radius: Badge (9999px, fully rounded)
- Padding: Xs (4px) x-axis, 4px y-axis
- Color: Text Primary (#1e293b)

**Specification:**

```typescript
Chip {
  container: {
    display: inline-flex,
    alignItems: center,
    gap: 4px,
    fontSize: 12px,
    fontWeight: 600,
    color: #1e293b,
    background: #fafbfc,
    border: 1px solid #e2e8f0,
    borderRadius: 9999px,
    padding: 4px 8px,
  },

  removeButton: {
    background: transparent,
    border: none,
    color: #64748b,
    cursor: pointer,
    fontSize: 14px,
    padding: 0,
    marginLeft: 4px,
  },

  active: {
    background: rgba(102, 126, 234, 0.1),
    borderColor: #667eea,
    color: #667eea,
  },
}
```

---

### 13. EMPTY STATE

**Derivation:**

- Container: Card (16px border-radius)
- Padding: Xl (24px)
- Text Align: Center
- Icon: Large (32px)
- Title: H2 (24px, Semibold)
- Description: Body (14px, Regular, Text Secondary)

**Specification:**

```typescript
EmptyState {
  container: {
    borderRadius: 16px,
    padding: 24px,
    textAlign: center,
    background: #ffffff,
    border: 1px solid #e2e8f0,
    minHeight: 200px,
    display: flex,
    flexDirection: column,
    justifyContent: center,
    alignItems: center,
  },

  icon: {
    size: 32px,
    color: #64748b,
    marginBottom: 16px,
  },

  title: {
    fontSize: 24px,
    fontWeight: 600,
    color: #1e293b,
    marginBottom: 8px,
  },

  description: {
    fontSize: 14px,
    fontWeight: 400,
    color: #64748b,
    marginBottom: 16px,
  },

  action: {
    // Primary button
  },
}
```

---

### 14. LOADING STATE / SKELETON

**Derivation:**

- Color: Gray 200 (#e2e8f0)
- Animation: Pulse (500ms ease-in-out)
- Border Radius: Card (16px)

**Specification:**

```typescript
Skeleton {
  background: #e2e8f0,
  borderRadius: 16px,
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite,

  // Common shapes
  text: {
    height: 14px,
    width: 100%,
  },

  heading: {
    height: 24px,
    width: 40%,
  },

  avatar: {
    borderRadius: 9999px,
    width: 40px,
    height: 40px,
  },

  card: {
    borderRadius: 16px,
    height: 200px,
    width: 100%,
  },
}
```

---

## 📊 DERIVATION MAPPING TABLE

| Component      | Derives From                    | Key Token                                  | Notes                         |
| -------------- | ------------------------------- | ------------------------------------------ | ----------------------------- |
| Text Input     | Body Typography + Input Specs   | Font 14px, Border Gray 200, Focus Primary  | Focus ring = primary.light    |
| Textarea       | Text Input                      | Font 14px, Min Height 100px                | Resize vertical only          |
| Select         | Text Input + Dropdown           | Font 14px, Menu Card style                 | Z-Index: 100                  |
| Label          | Small Typography                | Font 12px, Semibold, Text Primary          | Margin bottom 8px             |
| Error Text     | Small Typography                | Font 12px, Danger color                    | Auto margin top 4px           |
| Helper Text    | Small Typography                | Font 12px, Text Secondary                  | Auto margin top 4px           |
| Icon (Default) | Typography Body align           | Size 20px, Color semantic                  | Default = Text Primary        |
| Table Header   | H3 Typography                   | Font 18px Semibold, Gray 50 bg             | Medium padding 12px           |
| Table Cell     | Body Typography                 | Font 14px, Gray border bottom              | Medium padding 12px           |
| Table Row      | Card + Body                     | White bg, Gray 50 hover, Primary selected  | Zebra stripe optional         |
| Modal          | Card styling                    | Border radius 16px, Shadow lg, Padding lg  | Z-Index: 300 (overlay)        |
| Modal Title    | H2 Typography                   | Font 24px Semibold, Border bottom          | Full width                    |
| Nav Link       | Body Typography                 | Font 14px, Primary hover, Primary active   | Active = bottom border accent |
| Breadcrumb     | Small Typography                | Font 12px, Text Secondary text             | "/" separator                 |
| Pagination     | Body Typography                 | Font 14px, 36x36px buttons, Input radius   | Semantic colors map           |
| Alert          | Semantic + Card                 | Light bg, left stripe (4px), Card radius   | Success/Warning/Danger/Info   |
| Toast          | Card + Semantic                 | Border radius 16px, Shadow lg, Z-Index 400 | Slide in animation            |
| Tabs           | Body Typography                 | Font 14px, Active = bottom accent          | Border bottom container       |
| Search Input   | Text Input                      | Font 14px, Search icon left (16px)         | Max width 300px or full       |
| Chip           | Small Typography + Badge radius | Font 12px Semibold, Badge radius, Gray bg  | Inline-flex, gap 4px          |
| Empty State    | Card + H2 + Body                | Card radius 16px, Centered, Icon 32px      | Min height 200px              |
| Skeleton       | Neutral                         | Gray 200, Pulse animation, Card radius     | Common shapes predefined      |

---

## 🔍 VALIDATION CHECKLIST

**Before moving to Phase 3, verify:**

- [ ] All form controls (Input, Textarea, Select) derive correctly from Body typography
- [ ] Focus states use Primary gradient start (#667eea) with light ring
- [ ] Error states use Danger color (#ef4444)
- [ ] Table headers use H3 (18px Semibold) on Gray 50 background
- [ ] Table body uses Body (14px) with Gray 200 borders
- [ ] Icons have semantic color mapping (Success/Warning/Danger/Primary)
- [ ] Modal uses Card styling with H2 title and Large shadow
- [ ] All buttons in modals follow Button specs (Primary/Secondary/Danger only)
- [ ] Navigation links have active state (bottom border or primary color)
- [ ] Breadcrumbs use Small typography with "/" separators
- [ ] Pagination buttons are 36x36px with Input border radius
- [ ] Alerts have left 4px stripe + light semantic background
- [ ] Toast uses Shadow lg and Z-Index 400
- [ ] Tabs have bottom border accent (3px Primary) when active
- [ ] Search input extends Text Input with icon on left
- [ ] Chips use Badge border radius (fully rounded)
- [ ] Empty state is Card-like with Large icon
- [ ] Skeletons use Gray 200 with pulse animation
- [ ] All components use only Design System tokens
- [ ] No new colors, sizes, or spacing introduced

---

## 📝 NEXT STEPS

✅ **Phase 2 Complete:** Derived Design Spec documented  
🔄 **Phase 3:** Codebase UI Audit (identify hardcoded styles, inconsistencies)  
🔧 **Phase 4:** Create Reusable UI Components  
🎨 **Phase 5:** Incremental Page Refactor  
🛡️ **Phase 6:** Design System Enforcement

---

**Status:** ✅ READY FOR PHASE 3  
**Date:** 2026-01-08
