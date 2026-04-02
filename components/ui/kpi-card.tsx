'use client';

import { Colors, Typography } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import React from 'react';

export interface KPICardProps {
  title: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  trend?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

/**
 * KPICard Component
 * 
 * A reusable card for displaying key performance indicators (KPIs).
 * Uses the design system's Card spec with a top-border gradient accent.
 * 
 * @example
 * <KPICard
 *   title="Total Revenue"
 *   value="$24,580"
 *   trend="positive"
 *   subtext="↗ +12.5% from last month"
 * />
 */
export function KPICard({
  title,
  value,
  subtext,
  trend,
  icon,
  className,
}: KPICardProps) {
  const trendColor = {
    positive: Colors.success,
    negative: Colors.danger,
    neutral: Colors.text.secondary,
  }[trend || 'neutral'];

  return (
    <div
      className={cn(
        'rounded-lg bg-white p-6 shadow-sm border-t-4 transition-all hover:shadow-md',
        className
      )}
      style={{
        borderTopColor: Colors.primary.start,
        borderImage: `linear-gradient(135deg, ${Colors.primary.start} 0%, ${Colors.primary.end} 100%) 0 0 0 1`,
      }}
    >
      {/* Header with title and icon */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p
            style={{
              fontSize: Typography.fontSize.small,
              fontWeight: Typography.fontWeight.semibold,
              color: Colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: Typography.letterSpacing.wide,
            }}
          >
            {title}
          </p>
        </div>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p
          style={{
            fontSize: '28px',
            fontWeight: Typography.fontWeight.bold,
            color: Colors.text.primary,
          }}
        >
          {value}
        </p>
      </div>

      {/* Subtext with trend color */}
      {subtext && (
        <p
          style={{
            fontSize: Typography.fontSize.small,
            color: trendColor,
            marginTop: '8px',
          }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}

KPICard.displayName = 'KPICard';
