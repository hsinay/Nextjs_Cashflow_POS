'use client';

import { Colors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import React from 'react';

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label text (optional)
   */
  label?: string;

  /**
   * Helper/hint text (optional)
   */
  helperText?: string;

  /**
   * Error message (optional, shows error state)
   */
  error?: string;

  /**
   * Whether field is required (shows asterisk)
   * @default false
   */
  required?: boolean;

  /**
   * Icon element to display before input
   */
  icon?: React.ReactNode;

  /**
   * Whether to display the validation state
   * @default true
   */
  showValidation?: boolean;

  /**
   * Wrapper className for additional styling
   */
  wrapperClassName?: string;

  /**
   * Label className for additional styling
   */
  labelClassName?: string;
}

/**
 * EnhancedInput Component
 * 
 * Wraps native input with design system styling, labels, helper text,
 * and error states. Ensures consistent form field appearance across the app.
 * 
 * @example
 * <EnhancedInput
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   required
 *   helperText="We'll never share your email"
 * />
 * 
 * <EnhancedInput
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 */
export const EnhancedInput = React.forwardRef<
  HTMLInputElement,
  EnhancedInputProps
>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      icon,
      showValidation = true,
      wrapperClassName,
      labelClassName,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const isError = error && error.length > 0;

    const getBorderColor = () => {
      if (isError) return Colors.danger;
      if (disabled) return Colors.gray[300];
      return Colors.gray[300];
    };

    const getFocusBorderColor = () => {
      if (isError) return Colors.danger;
      return Colors.primary.start;
    };

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label
            className={cn(
              'block text-sm font-semibold mb-2'
            )}
            style={{ color: Colors.text.primary }}
            htmlFor={props.id}
          >
            {label}
            {required && (
              <span style={{ color: Colors.danger }} className="ml-1">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pointer-events-none"
              style={{ color: Colors.text.secondary }}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full px-3 py-2 rounded-md border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              icon && 'pl-10',
              isError && 'border-red-500 focus:ring-red-200',
              disabled && 'bg-gray-100 cursor-not-allowed',
              className
            )}
            style={{
              borderColor: getBorderColor(),
              backgroundColor: disabled ? Colors.gray[100] : 'white',
              color: disabled ? Colors.text.secondary : Colors.text.primary,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = getFocusBorderColor();
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = getBorderColor();
              props.onBlur?.(e);
            }}
            {...props}
          />

          {showValidation && isError && (
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              style={{ color: Colors.danger }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
        </div>

        {(helperText || error) && (
          <p
            className="text-xs mt-1"
            style={{
              color: isError ? Colors.danger : Colors.text.secondary,
            }}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
EnhancedInput.displayName = 'EnhancedInput';
