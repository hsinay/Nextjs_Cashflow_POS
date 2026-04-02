/**
 * DESIGN SYSTEM — SINGLE SOURCE OF TRUTH
 * 
 * This file centralizes all design tokens for the CashFlow AI ERP System.
 * All UI components, pages, and features must derive from these tokens.
 * 
 * ⚠️ RULE: No hardcoded colors, sizes, or spacing allowed.
 *          All visual decisions must reference tokens defined here.
 * 
 * Last Updated: 2026-01-08
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const Colors = {
  // PRIMARY BRAND — Gradient
  primary: {
    start: '#667eea',      // Gradient start
    end: '#764ba2',        // Gradient end
    light: 'rgba(102, 126, 234, 0.1)',
    lighter: 'rgba(102, 126, 234, 0.05)',
    dark: 'rgba(118, 75, 162, 0.2)',
  },

  // SEMANTIC COLORS
  success: '#10b981',      // Profit, Paid, Approved
  warning: '#f59e0b',      // Pending, At Risk
  danger: '#ef4444',       // Loss, Overdue, Error

  // TEXT COLORS (Primary Brand)
  text: {
    primary: '#1e293b',    // Main text
    secondary: '#64748b',  // Secondary text, helper text
  },

  // NEUTRAL GRAYS (Derived, for layout/borders)
  gray: {
    50: '#f8fafc',         // Lightest (backgrounds)
    100: '#fafbfc',        // Very light
    200: '#e2e8f0',        // Light borders
    300: '#cbd5e1',        // Medium
    400: '#9ca3af',        // Darker
    900: '#1e293b',        // Darkest (same as text.primary)
  },

  // STATUS BADGE COLORS (Light + Dark pairs)
  status: {
    paid: {
      light: '#dcfce7',     // Light green background
      dark: '#166534',      // Dark green text
    },
    pending: {
      light: '#fef3c7',     // Light yellow background
      dark: '#92400e',      // Dark yellow text
    },
    overdue: {
      light: '#fee2e2',     // Light red background
      dark: '#991b1b',      // Dark red text
    },
  },

  // WHITES & BLACKS
  white: '#ffffff',
  black: '#000000',

  // TRANSPARENT (for overlays)
  transparent: 'transparent',
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const Typography = {
  // Font Family
  fontFamily: {
    sans: "['Inter', sans-serif]",
  },

  // Sizes (in pixels)
  fontSize: {
    h1: '32px',      // Page titles
    h2: '24px',      // Section headers
    h3: '18px',      // Subsections, table headers
    body: '14px',    // Body text
    small: '12px',   // Meta text, labels
  },

  // Font Weights
  fontWeight: {
    normal: 400,     // Regular text
    medium: 500,     // Medium emphasis
    semibold: 600,   // Section headers
    bold: 700,       // Page titles
  },

  // Line Heights (derived from size)
  lineHeight: {
    tight: 1.2,      // Headers (H1–H3)
    normal: 1.5,     // Body text
    relaxed: 1.75,   // Long-form content
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.02em',    // Headers
    normal: '0em',       // Default
    wide: '0.02em',      // Labels, badges
  },

  // Usage Rules
  usage: {
    h1: { size: '32px', weight: 700, lineHeight: 1.2 },        // Page Titles
    h2: { size: '24px', weight: 600, lineHeight: 1.2 },        // Section Headers
    h3: { size: '18px', weight: 600, lineHeight: 1.2 },        // Subsections
    body: { size: '14px', weight: 400, lineHeight: 1.5 },      // Body Text
    small: { size: '12px', weight: 400, lineHeight: 1.5 },     // Meta Text
    label: { size: '12px', weight: 600, lineHeight: 1.5 },     // Form Labels
    badge: { size: '12px', weight: 600, lineHeight: 1.2 },     // Status Badges
  },
} as const;

// ============================================================================
// SPACING SCALE (Derived from Typography)
// ============================================================================
// Based on typography scale: 4px baseline, derived from 16px body size
// 4px = 1 unit, 8px = 2 units, 12px = 3 units, 16px = 4 units, etc.

export const Spacing = {
  xs: '4px',       // Minimal spacing
  sm: '8px',       // Small spacing (input padding, small gaps)
  md: '12px',      // Medium spacing (form field gaps)
  lg: '16px',      // Large spacing (section padding, card padding)
  xl: '24px',      // Extra large (component gaps)
  xxl: '32px',     // 2XL (page sections)
  xxxl: '48px',    // 3XL (major sections)
  
  // Common patterns
  buttonPadding: {
    default: { x: '16px', y: '12px' },  // Typical button
    small: { x: '12px', y: '8px' },     // Compact button
    large: { x: '24px', y: '16px' },    // Large button
  },
  
  inputPadding: {
    default: { x: '16px', y: '12px' },  // Standard input
    compact: { x: '12px', y: '8px' },   // Compact input
  },

  cardPadding: {
    default: '24px',   // Standard card
    compact: '16px',   // Compact card
  },

  // Gaps between grid items
  gridGap: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
} as const;

// ============================================================================
// BORDER RADIUS (Derived from Button/Card Design)
// ============================================================================

export const BorderRadius = {
  xs: '4px',       // Minimal rounding (small elements)
  sm: '8px',       // Small rounding (inputs, small components)
  md: '12px',      // Medium rounding (cards, buttons)
  lg: '16px',      // Large rounding (large cards, modals)
  xl: '20px',      // Extra large
  full: '9999px',  // Fully rounded (pills, circles)

  // Component-specific
  button: '8px',       // Buttons
  input: '8px',        // Form inputs
  card: '16px',        // Cards
  modal: '16px',       // Modals/Dialogs
  badge: '9999px',     // Pills/Badges
  avatar: '9999px',    // Circles
} as const;

// ============================================================================
// SHADOWS (Elevation System)
// ============================================================================

export const Shadows = {
  none: 'none',
  xs: '0 2px 4px rgba(0, 0, 0, 0.1)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',

  // Interactive states
  focus: `0 0 0 3px ${Colors.primary.light}`,
} as const;

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const Transitions = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out',

  // Easing functions
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ============================================================================
// Z-INDEX SCALE (Stacking Context)
// ============================================================================

export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

// ============================================================================
// COMPONENT DESIGN SPECIFICATIONS
// ============================================================================

export const ComponentSpecs = {
  // BUTTONS
  button: {
    base: {
      borderRadius: BorderRadius.button,
      fontSize: Typography.fontSize.body,
      fontWeight: Typography.fontWeight.semibold,
      transition: Transitions.normal,
      cursor: 'pointer',
    },
    primary: {
      background: `linear-gradient(135deg, ${Colors.primary.start} 0%, ${Colors.primary.end} 100%)`,
      color: Colors.white,
      padding: Spacing.buttonPadding.default,
      borderRadius: BorderRadius.button,
      border: 'none',
    },
    secondary: {
      background: Colors.white,
      color: Colors.text.primary,
      border: `1px solid ${Colors.gray[200]}`,
      padding: Spacing.buttonPadding.default,
      borderRadius: BorderRadius.button,
    },
    danger: {
      background: Colors.danger,
      color: Colors.white,
      padding: Spacing.buttonPadding.default,
      borderRadius: BorderRadius.button,
      border: 'none',
    },
  },

  // INPUTS & FORM CONTROLS
  input: {
    fontSize: Typography.fontSize.body,
    padding: Spacing.inputPadding.default,
    borderRadius: BorderRadius.input,
    border: `1px solid ${Colors.gray[200]}`,
    background: Colors.white,
    color: Colors.text.primary,
    placeholder: Colors.text.secondary,
    focusBorder: Colors.primary.start,
    focusRing: Colors.primary.light,
  },

  // CARDS
  card: {
    base: {
      background: Colors.white,
      borderRadius: BorderRadius.card,
      padding: Spacing.cardPadding.default,
      boxShadow: Shadows.xs,
      border: 'none',
    },
    kpi: {
      background: Colors.white,
      borderRadius: BorderRadius.card,
      padding: Spacing.cardPadding.default,
      boxShadow: Shadows.xs,
      borderTop: `4px solid transparent`,
      borderImage: `linear-gradient(135deg, ${Colors.primary.start} 0%, ${Colors.primary.end} 100%)`,
    },
    aiInsight: {
      background: Colors.primary.lighter,
      borderRadius: BorderRadius.card,
      padding: Spacing.cardPadding.default,
      border: `1px solid ${Colors.primary.light}`,
      boxShadow: Shadows.xs,
    },
  },

  // STATUS BADGES
  badge: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    borderRadius: BorderRadius.badge,
    padding: `${Spacing.sm} ${Spacing.md}`,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },

  // MODALS & DIALOGS
  modal: {
    borderRadius: BorderRadius.modal,
    boxShadow: Shadows.lg,
    padding: Spacing.lg,
    background: Colors.white,
  },
};

// ============================================================================
// DERIVATION RULES (For Components Not Explicitly Designed)
// ============================================================================

export const DerivationRules = {
  // TEXT INPUTS, TEXTAREA, SELECT
  formControl: {
    fontSize: Typography.fontSize.body,
    textColor: Colors.text.primary,
    placeholderColor: Colors.text.secondary,
    borderColor: Colors.gray[200],
    borderColorFocus: Colors.primary.start,
    ringColor: Colors.primary.light,
    padding: Spacing.inputPadding.default,
    borderRadius: BorderRadius.input,
  },

  // FORM LABELS
  label: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },

  // ICONS (in buttons, forms, etc.)
  icon: {
    sizeDefault: '20px',    // Body-aligned
    sizeSmall: '16px',      // Compact
    sizeLarge: '24px',      // Prominent
    colorDefault: Colors.text.primary,
    colorSecondary: Colors.text.secondary,
    colorSuccess: Colors.success,
    colorWarning: Colors.warning,
    colorDanger: Colors.danger,
    colorPrimary: Colors.primary.start,
  },

  // TABLES
  table: {
    headerFontSize: Typography.fontSize.h3,
    headerFontWeight: Typography.fontWeight.semibold,
    headerColor: Colors.text.primary,
    bodFontSize: Typography.fontSize.body,
    bodyColor: Colors.text.primary,
    borderColor: Colors.gray[200],
    padding: Spacing.md,
    rowHoverBackground: Colors.gray[50],
  },

  // CHARTS (Recharts, etc.)
  chart: {
    colors: [
      Colors.primary.start,
      Colors.success,
      Colors.warning,
      Colors.danger,
      Colors.primary.end,
    ],
    fontSize: Typography.fontSize.small,
    fontColor: Colors.text.secondary,
    gridColor: Colors.gray[200],
  },
};

// ============================================================================
// TAILWIND CLASS MAPPINGS
// ============================================================================
// These are the Tailwind classes that map to the above tokens.
// Use these in your Tailwind utilities and component classNames.

export const TailwindClasses = {
  colors: {
    primary: 'bg-primary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    danger: 'bg-danger text-white',
    textPrimary: 'text-dark',
    textSecondary: 'text-gray-text',
    borderDefault: 'border-gray-border',
  },

  typography: {
    h1: 'text-h1 font-bold',
    h2: 'text-h2 font-semibold',
    h3: 'text-h3 font-semibold',
    body: 'text-body font-normal',
    small: 'text-small font-normal',
    label: 'text-small font-semibold',
  },

  spacing: {
    buttonPadding: 'px-6 py-3',
    inputPadding: 'px-4 py-3',
    cardPadding: 'p-6',
    sectionGap: 'gap-6',
  },

  roundness: {
    button: 'rounded-lg',
    input: 'rounded-lg',
    card: 'rounded-xl',
    badge: 'rounded-full',
  },

  shadows: {
    sm: 'shadow-custom-sm',
    md: 'shadow-custom-md',
    lg: 'shadow-custom-lg',
  },
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Creating a styled button programmatically
 * 
 * const buttonStyles = {
 *   backgroundColor: Colors.primary.start,
 *   color: Colors.white,
 *   padding: `${Spacing.buttonPadding.default.y} ${Spacing.buttonPadding.default.x}`,
 *   borderRadius: BorderRadius.button,
 *   fontSize: Typography.fontSize.body,
 *   fontWeight: Typography.fontWeight.semibold,
 * };
 */

/**
 * EXAMPLE 2: Using in Tailwind className
 * 
 * className="bg-primary text-white px-6 py-3 rounded-lg text-body font-semibold"
 * 
 * Maps to:
 * - bg-primary → Colors.primary.start (#667eea)
 * - text-white → Colors.white
 * - px-6 py-3 → Spacing.buttonPadding.default
 * - rounded-lg → BorderRadius.button
 * - text-body → Typography.fontSize.body (14px)
 * - font-semibold → Typography.fontWeight.semibold (600)
 */

/**
 * EXAMPLE 3: Chart colors (from Recharts)
 * 
 * const COLORS = [
 *   Colors.primary.start,
 *   Colors.success,
 *   Colors.warning,
 *   Colors.danger,
 *   Colors.primary.end,
 * ];
 */

// ============================================================================
// ENFORCEMENT RULES
// ============================================================================

/**
 * ⚠️ MUST NOT DO:
 * 
 * ❌ const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
 * ❌ className="text-2xl font-bold text-gray-900"
 * ❌ style={{ color: '#667eea', fontSize: '20px' }}
 * ❌ className="border border-gray-300"
 * 
 * ✅ MUST DO INSTEAD:
 * 
 * ✅ const COLORS = DerivationRules.chart.colors;
 * ✅ className="text-h2 font-bold text-dark"
 * ✅ style={{ color: Colors.primary.start, fontSize: Typography.fontSize.h2 }}
 * ✅ className="border border-gray-border"
 */

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

export const DesignSystem = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Transitions,
  ZIndex,
  ComponentSpecs,
  DerivationRules,
  TailwindClasses,
} as const;

export default DesignSystem;
