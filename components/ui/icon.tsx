'use client';

import { Colors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import React from 'react';

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  /**
   * Size of the icon in pixels
   * @default 20 (body-aligned)
   */
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Semantic color variant
   * @default 'default' (text-primary)
   */
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'primary';

  /**
   * Custom color override (takes precedence over variant)
   */
  color?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeMap: Record<string, number> = {
  xs: 16,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const colorMap: Record<string, string> = {
  default: Colors.text.primary,
  secondary: Colors.text.secondary,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  primary: Colors.primary.start,
};

/**
 * Icon Wrapper Component
 * 
 * Wraps icon components (from lucide-react, react-icons, etc.) to apply
 * consistent sizing and semantic coloring from the design system.
 * 
 * @example
 * import { CheckCircle2 } from 'lucide-react';
 * 
 * <Icon as={CheckCircle2} variant="success" size="lg" />
 * <Icon as={AlertCircle} variant="danger" size={24} />
 * <Icon as={Info} variant="primary" />
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      size = 'md',
      variant = 'default',
      color,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const sizeValue = typeof size === 'number' ? size : sizeMap[size];
    const colorValue = color || colorMap[variant];

    return (
      <svg
        ref={ref}
        width={sizeValue}
        height={sizeValue}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('inline-block flex-shrink-0', className)}
        style={{
          color: colorValue,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Icon.displayName = 'Icon';

/**
 * Utility hook to get icon size from design system
 * 
 * @example
 * const iconSize = useIconSize('md');  // Returns 20
 */
export function useIconSize(size: string | number): number {
  if (typeof size === 'number') return size;
  return sizeMap[size as string] || 20;
}

/**
 * Utility hook to get icon color from variant
 * 
 * @example
 * const color = useIconColor('success');  // Returns Colors.success
 */
export function useIconColor(variant: string): string {
  return colorMap[variant as string] || Colors.text.primary;
}
