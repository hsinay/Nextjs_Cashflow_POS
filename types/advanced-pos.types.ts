// Advanced POS Features - Multi-terminal, Receipts, Refunds

export type ReceiptFormat = 'THERMAL' | 'A4' | 'EMAIL' | 'SMS';
export type RefundReason = 
  | 'CUSTOMER_REQUEST'
  | 'DEFECTIVE_PRODUCT'
  | 'WRONG_ITEM'
  | 'DAMAGED'
  | 'OTHER';

export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'CANCELLED';

// Receipt
export interface Receipt {
  id: string;
  transactionId: string;
  receiptNumber: string;
  format: ReceiptFormat;
  generatedAt: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  storeInfo: StoreInfo;
  termsConditions?: string;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
}

export interface StoreInfo {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  gstNumber?: string;
  termsUrl?: string;
}

// Refund
export interface Refund {
  id: string;
  transactionId: string;
  originalAmount: number;
  refundAmount: number;
  reason: RefundReason;
  status: RefundStatus;
  requestedAt: Date;
  approvedAt?: Date;
  processedAt?: Date;
  approvedBy?: string;
  notes?: string;
  paymentMethod: string; // How to refund (CASH, CARD, etc)
}

export interface RefundRequest {
  transactionId: string;
  refundAmount: number;
  reason: RefundReason;
  notes?: string;
  items?: RefundItem[];
}

export interface RefundItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Multi-Terminal
export interface Terminal {
  id: string;
  terminalId: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OFFLINE';
  lastActivityAt: Date;
  ipAddress?: string;
  deviceModel?: string;
  serialNumber?: string;
}

export interface TerminalSession {
  terminalId: string;
  sessionId: string;
  openedAt: Date;
  closedAt?: Date;
  totalSales: number;
  transactionCount: number;
  status: 'ACTIVE' | 'CLOSED';
}

export interface TerminalDashboard {
  terminals: Terminal[];
  activeSessions: TerminalSession[];
  totalActiveSessions: number;
  totalTerminals: number;
  onlineTerminals: number;
  totalSalesAllTerminals: number;
  totalTransactionsAllTerminals: number;
}

// Shift Management
export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT' | 'FULL_DAY';

export interface Shift {
  id: string;
  terminalId: string;
  cashierId: string;
  type: ShiftType;
  startTime: Date;
  endTime?: Date;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  closingBalance?: number;
  totalSales: number;
  variance?: number;
  notes?: string;
}

// Performance Metrics
export interface TerminalPerformanceMetrics {
  terminalId: string;
  terminalName: string;
  period: string;
  transactionCount: number;
  totalSalesAmount: number;
  averageTransactionValue: number;
  paymentMethodBreakdown: Record<string, number>;
  topSellingProducts: TopProduct[];
  peakHours: PeakHour[];
  averageTransactionTime: number; // in seconds
  paymentSuccessRate: number; // percentage
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  percentOfTotal: number;
}

export interface PeakHour {
  hour: number;
  transactionCount: number;
  salesAmount: number;
}

// Terminal Configuration
export interface TerminalConfig {
  terminalId: string;
  receiptFormat: ReceiptFormat;
  printReceipt: boolean;
  emailReceipt: boolean;
  requireCustomerInfo: boolean;
  autoLogoutTimeout: number; // in minutes
  allowOfflineMode: boolean;
  currencySymbol: string;
  taxRate: number;
  serviceChargeRate: number;
}
