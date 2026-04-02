'use client';

import { Colors, Typography } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import React from 'react';

/* ============================================================================
 * Typography Components
 * ============================================================================
 * 
 * All typography components use the design system spec:
 * - H1: 32px, Bold, Text Primary
 * - H2: 24px, Semibold, Text Primary
 * - H3: 18px, Semibold, Text Primary
 * - Body: 14px, Regular, Text Primary
 * - Small: 12px, Regular, Text Secondary
 * 
 * Usage:
 * <H1>Page Title</H1>
 * <H2>Section Header</H2>
 * <H3>Subsection</H3>
 * <Body>Body text content</Body>
 * <Small>Meta text or helper text</Small>
 */

// ============================================================================
// H1 — Page Titles
// ============================================================================

export interface H1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  color?: string;
}

export const H1 = React.forwardRef<HTMLHeadingElement, H1Props>(
  ({ className, color = Colors.text.primary, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn('font-bold', className)}
      style={{
        fontSize: Typography.fontSize.h1,
        fontWeight: Typography.fontWeight.bold,
        color,
        lineHeight: Typography.lineHeight.tight,
        letterSpacing: Typography.letterSpacing.tight,
      }}
      {...props}
    />
  )
);
H1.displayName = 'H1';

// ============================================================================
// H2 — Section Headers
// ============================================================================

export interface H2Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  color?: string;
}

export const H2 = React.forwardRef<HTMLHeadingElement, H2Props>(
  ({ className, color = Colors.text.primary, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('font-semibold', className)}
      style={{
        fontSize: Typography.fontSize.h2,
        fontWeight: Typography.fontWeight.semibold,
        color,
        lineHeight: Typography.lineHeight.tight,
        letterSpacing: Typography.letterSpacing.tight,
      }}
      {...props}
    />
  )
);
H2.displayName = 'H2';

// ============================================================================
// H3 — Subsections / Table Headers
// ============================================================================

export interface H3Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  color?: string;
}

export const H3 = React.forwardRef<HTMLHeadingElement, H3Props>(
  ({ className, color = Colors.text.primary, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold', className)}
      style={{
        fontSize: Typography.fontSize.h3,
        fontWeight: Typography.fontWeight.semibold,
        color,
        lineHeight: Typography.lineHeight.tight,
        letterSpacing: Typography.letterSpacing.tight,
      }}
      {...props}
    />
  )
);
H3.displayName = 'H3';

// ============================================================================
// Body — Standard Body Text
// ============================================================================

export interface BodyProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  color?: string;
}

export const Body = React.forwardRef<HTMLParagraphElement, BodyProps>(
  ({ className, color = Colors.text.primary, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('font-normal', className)}
      style={{
        fontSize: Typography.fontSize.body,
        fontWeight: Typography.fontWeight.normal,
        color,
        lineHeight: Typography.lineHeight.normal,
        letterSpacing: Typography.letterSpacing.normal,
      }}
      {...props}
    />
  )
);
Body.displayName = 'Body';

// ============================================================================
// Small — Meta Text / Helper Text
// ============================================================================

export interface SmallProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: string;
}

export const Small = React.forwardRef<HTMLSpanElement, SmallProps>(
  ({ className, color = Colors.text.secondary, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('font-normal', className)}
      style={{
        fontSize: Typography.fontSize.small,
        fontWeight: Typography.fontWeight.normal,
        color,
        lineHeight: Typography.lineHeight.normal,
        letterSpacing: Typography.letterSpacing.normal,
      }}
      {...props}
    />
  )
);
Small.displayName = 'Small';

// ============================================================================
// Label — Form Labels
// ============================================================================

export interface LabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  color?: string;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, color = Colors.text.primary, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('font-semibold block', className)}
      style={{
        fontSize: Typography.fontSize.small,
        fontWeight: Typography.fontWeight.semibold,
        color,
        marginBottom: '8px',
        letterSpacing: Typography.letterSpacing.wide,
      }}
      {...props}
    />
  )
);
Label.displayName = 'Label';
