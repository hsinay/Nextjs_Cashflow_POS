import { z } from 'zod';

// Report request validation
export const reportParamsSchema = z.object({
  type: z.enum([
    'DAILY_CASHFLOW',
    'PAYMENT_BREAKDOWN',
    'VARIANCE_ANALYSIS',
    'TREND_ANALYSIS',
    'SESSION_SUMMARY',
    'SALES_REPORT',
  ]),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  cashierId: z.string().uuid().optional(),
  terminalId: z.string().optional(),
  granularity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  includeForecasts: z.boolean().optional().default(false),
});

export type ReportParams = z.infer<typeof reportParamsSchema>;

// Export request validation
export const exportRequestSchema = z.object({
  reportId: z.string().uuid(),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']),
  includeCharts: z.boolean().optional().default(true),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;

// Dashboard widget config validation
export const dashboardWidgetConfigSchema = z.object({
  widgets: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    type: z.enum(['METRIC', 'CHART', 'TABLE', 'LIST']),
    reportType: z.enum([
      'DAILY_CASHFLOW',
      'PAYMENT_BREAKDOWN',
      'VARIANCE_ANALYSIS',
      'TREND_ANALYSIS',
      'SESSION_SUMMARY',
      'SALES_REPORT',
    ]),
  })),
  layout: z.enum(['GRID', 'FLEX']).optional().default('GRID'),
  refreshInterval: z.number().positive().optional().default(300),
  autoRefresh: z.boolean().optional().default(true),
});

export type DashboardWidgetConfig = z.infer<typeof dashboardWidgetConfigSchema>;
