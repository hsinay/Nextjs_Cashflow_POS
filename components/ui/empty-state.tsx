'use client';

import { Colors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import React from 'react';

export interface EmptyStateProps {
  /**
   * Icon element to display
   */
  icon?: React.ReactNode;

  /**
   * Title text
   */
  title: string;

  /**
   * Description/subtitle text
   */
  description?: string;

  /**
   * Action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Children override
   */
  children?: React.ReactNode;
}

/**
 * EmptyState Component
 * 
 * Displays a centered empty state with optional icon, title, description,
 * and action button. Used when no data is available.
 * 
 * @example
 * <EmptyState
 *   icon={<PlusIcon />}
 *   title="No products found"
 *   description="Get started by creating your first product"
 *   action={{ label: 'Add Product', onClick: () => navigate('/products/new') }}
 * />
 */
export const EmptyState = React.forwardRef<
  HTMLDivElement,
  EmptyStateProps
>(
  (
    {
      icon,
      title,
      description,
      action,
      className,
      children,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4',
          className
        )}
      >
        {icon && (
          <div
            className="mb-4 flex-shrink-0"
            style={{ color: Colors.gray[400] }}
          >
            {icon}
          </div>
        )}

        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: Colors.text.primary }}
        >
          {title}
        </h3>

        {description && (
          <p
            className="text-sm mb-6 max-w-sm text-center"
            style={{ color: Colors.text.secondary }}
          >
            {description}
          </p>
        )}

        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 rounded-md font-medium transition-all duration-200 hover:shadow-md"
            style={{
              background: `linear-gradient(135deg, ${Colors.primary.start} 0%, ${Colors.primary.end} 100%)`,
              color: 'white',
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
