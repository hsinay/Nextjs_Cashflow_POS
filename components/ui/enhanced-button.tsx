'use client';

import { Colors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'text-white hover:shadow-md active:scale-95',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-95',
        outline: 'border-2 text-gray-900 hover:bg-gray-50 active:scale-95',
        ghost: 'text-gray-900 hover:bg-gray-100 active:scale-95',
        danger: 'text-white hover:shadow-md active:scale-95',
        success: 'text-white hover:shadow-md active:scale-95',
        warning: 'text-white hover:shadow-md active:scale-95',
      },
      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-base',
      },
      isLoading: {
        true: 'cursor-not-allowed opacity-60',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      isLoading: false,
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  /**
   * Icon element (optional)
   */
  icon?: React.ReactNode;

  /**
   * Icon position
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';

  /**
   * Loading state with spinner
   * @default false
   */
  isLoading?: boolean;

  /**
   * Loading spinner element
   */
  loadingSpinner?: React.ReactNode;

  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Custom style override
   */
  customStyle?: React.CSSProperties;
}

/**
 * EnhancedButton Component
 * 
 * Provides buttons with design system variants (primary, secondary, outline, ghost, danger, etc.),
 * multiple sizes, and built-in support for icons, loading states, and styling variants.
 * 
 * @example
 * <EnhancedButton>Save Changes</EnhancedButton>
 * <EnhancedButton variant="danger" onClick={() => deleteItem()}>Delete</EnhancedButton>
 * <EnhancedButton icon={<PlusIcon />} size="sm">Add Item</EnhancedButton>
 * <EnhancedButton isLoading>Saving...</EnhancedButton>
 */
export const EnhancedButton = React.forwardRef<
  HTMLButtonElement,
  EnhancedButtonProps
>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconPosition = 'left',
      loadingSpinner,
      fullWidth = false,
      customStyle,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantColors = {
      primary: `linear-gradient(135deg, ${Colors.primary.start} 0%, ${Colors.primary.end} 100%)`,
      secondary: 'transparent',
      outline: 'transparent',
      ghost: 'transparent',
      danger: Colors.danger,
      success: Colors.success,
      warning: Colors.warning,
    };

    const variantBorders = {
      primary: 'none',
      secondary: 'none',
      outline: `2px solid ${Colors.gray[300]}`,
      ghost: 'none',
      danger: 'none',
      success: 'none',
      warning: 'none',
    };

    const baseStyle: React.CSSProperties = {
      background: variantColors[variant || 'primary'],
      border: variantBorders[variant || 'primary'],
      color: variant === 'outline' ? Colors.text.primary : undefined,
      ...customStyle,
    };

    const buttonClass = cn(
      buttonVariants({ variant, size, isLoading }),
      fullWidth && 'w-full',
      className
    );

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={buttonClass}
        style={baseStyle}
        {...props}
      >
        {isLoading ? (
          <>
            {loadingSpinner || (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {children}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="mr-2 flex-shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="ml-2 flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);
EnhancedButton.displayName = 'EnhancedButton';
