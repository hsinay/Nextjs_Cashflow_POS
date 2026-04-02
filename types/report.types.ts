// Report types and interfaces for analytics and reporting

export type ReportType = 
  | 'DAILY_CASHFLOW'
  | 'PAYMENT_BREAKDOWN'
  | 'VARIANCE_ANALYSIS'
  | 'TREND_ANALYSIS'
  | 'SESSION_SUMMARY'
  | 'SALES_REPORT';

export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export type ChartType = 'LINE' | 'BAR' | 'PIE' | 'AREA';

// Daily Cashflow Report
export interface DailyCashflowReport {
  date: string;
  openingBalance: number;
  salesAmount: number;
  expenses: number;
  deposits: number;
  withdrawals: number;
  closingBalance: number;
  variance: number;
  variancePercentage: number;
  paymentMethodBreakdown: PaymentMethodBreakdown;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  reconciliationNotes?: string;
}

export interface PaymentMethodBreakdown {
  cash: number;
  card: number;
  upi: number;
  digitalWallet: number;
  credit: number;
  other: number;
}

// Session Summary Report
export interface SessionSummaryReport {
  sessionId: string;
  cashierId: string;
  cashierName: string;
  terminalId?: string;
  openedAt: Date;
  closedAt?: Date;
  duration: number; // in minutes
  openingBalance: number;
  closingBalance?: number;
  totalSales: number;
  totalTransactions: number;
  variance?: number;
  variancePercentage?: number;
  paymentBreakdown: PaymentMethodBreakdown;
  topProducts?: TopProductItem[];
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED';
}

export interface TopProductItem {
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
}

// Variance Analysis
export interface VarianceAnalysis {
  period: string;
  totalExpectedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  variance_type: 'OVERAGE' | 'SHORTAGE';
  sessions: VarianceSession[];
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface VarianceSession {
  sessionId: string;
  date: string;
  variance: number;
  variancePercentage: number;
  status: 'RECONCILED' | 'UNRECONCILED' | 'PENDING_REVIEW';
}

// Trend Analysis
export interface TrendAnalysis {
  period: string;
  dataPoints: TrendDataPoint[];
  averageValue: number;
  minValue: number;
  maxValue: number;
  trend: 'UPWARD' | 'DOWNWARD' | 'STABLE';
  growthRate: number;
  forecastValue?: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

// Report Request Parameters
export interface ReportParams {
  type: ReportType;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  cashierId?: string;
  terminalId?: string;
  granularity?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  includeForecasts?: boolean;
}

// Report Response
export interface ReportResponse {
  id: string;
  type: ReportType;
  period: ReportPeriod;
  generatedAt: Date;
  data: DailyCashflowReport | VarianceAnalysis | TrendAnalysis | SessionSummaryReport;
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface ReportSummary {
  totalSessions: number;
  totalTransactions: number;
  totalAmount: number;
  averageSessionDuration: number;
  varianceRate: number;
  completionRate: number;
}

export interface ReportMetadata {
  generatedBy: string;
  generatedAt: Date;
  dataPoints: number;
  currency: string;
  timezone: string;
}

// Chart Data for Frontend
export interface ChartData {
  type: ChartType;
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartOptions;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: Record<string, unknown>;
  scales?: Record<string, unknown>;
}

// Export Format
export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

export interface ExportRequest {
  reportId: string;
  format: ExportFormat;
  includeCharts?: boolean;
}

// Dashboard Widget
export interface ReportWidget {
  id: string;
  title: string;
  type: 'METRIC' | 'CHART' | 'TABLE' | 'LIST';
  reportType: ReportType;
  data: DailyCashflowReport | VarianceAnalysis | TrendAnalysis | SessionSummaryReport | ReportWidget[];
  lastUpdated: Date;
  refreshInterval: number; // in seconds
}

export interface DashboardWidgetConfig {
  widgets: ReportWidget[];
  layout: 'GRID' | 'FLEX';
  refreshInterval: number;
  autoRefresh: boolean;
}
