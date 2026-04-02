'use client';

import { Colors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import React from 'react';

export interface AlertBoxProps {
  /**
   * Alert type variant
   * @default 'info'
   */
  variant?: 'success' | 'warning' | 'danger' | 'info';

  /**
   * Alert title (optional)
   */
  title?: string;

  /**
   * Alert message or content
   */
  message?: React.ReactNode;

  /**
   * Icon element (optional)
   */
  icon?: React.ReactNode;

  /**
   * Whether to show close button
   * @default false
   */
  closable?: boolean;

  /**
   * Callback when close button is clicked
   */
  onClose?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Children override (if provided, ignores message prop)
   */
  children?: React.ReactNode;
}

/**
 * AlertBox Component
 * 
 * Displays inline notifications with semantic coloring from design system.
 * Supports four variants: success, warning, danger, info.
 * 
 * @example
 * <AlertBox variant="danger" title="Error" message="Something went wrong" />
 * <AlertBox variant="success" message="Changes saved!" />
 * <AlertBox variant="warning" closable onClose={() => setDismissed(true)}>
 *   This is important
 * </AlertBox>
 */
export const AlertBox = React.forwardRef<
  HTMLDivElement,
  AlertBoxProps
>(
  (
    {
      variant = 'info',
      title,
      message,
      icon,
      closable = false,
      onClose,
      className,
      children,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    if (!isVisible) return null;

    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    const variantConfig = {
      success: {
        bgColor: Colors.success,
        textColor: Colors.text.primary,
        borderColor: Colors.success,
        lightBg: 'rgba(16, 185, 129, 0.1)',
      },
      warning: {
        bgColor: Colors.warning,
        textColor: Colors.text.primary,
        borderColor: Colors.warning,
        lightBg: 'rgba(245, 158, 11, 0.1)',
      },
      danger: {
        bgColor: Colors.danger,
        textColor: Colors.text.primary,
        borderColor: Colors.danger,
        lightBg: 'rgba(239, 68, 68, 0.1)',
      },
      info: {
        bgColor: Colors.primary.start,
        textColor: Colors.text.primary,
        borderColor: Colors.primary.start,
        lightBg: 'rgba(102, 126, 234, 0.1)',
      },
    };

    const config = variantConfig[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md border-l-4 p-4 flex gap-3',
          className
        )}
        style={{
          backgroundColor: config.lightBg,
          borderLeftColor: config.bgColor,
        }}
        role="alert"
      >
        {icon && (
          <div
            className="flex-shrink-0 flex items-center mt-0.5"
            style={{ color: config.bgColor }}
          >
            {icon}
          </div>
        )}

        <div className="flex-1">
          {title && (
            <div
              className="font-semibold text-sm mb-1"
              style={{ color: config.bgColor }}
            >
              {title}
            </div>
          )}
          <div
            className="text-sm"
            style={{ color: config.textColor }}
          >
            {children || message}
          </div>
        </div>

        {closable && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close alert"
            style={{ color: config.textColor, opacity: 0.5 }}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
AlertBox.displayName = 'AlertBox';
