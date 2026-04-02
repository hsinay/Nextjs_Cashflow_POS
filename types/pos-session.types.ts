import { POSSessionStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface POSSession {
  id: string;
  cashierId: string;
  terminalId?: string | null;
  dayBookId?: string | null;
  status: POSSessionStatus;
  openingCashAmount: Decimal;
  closingCashAmount?: Decimal | null;
  totalSalesAmount: Decimal;
  totalCashReceived: Decimal;
  totalCardReceived: Decimal;
  totalDigitalReceived: Decimal;
  totalTransactions: number;
  cashVariance: Decimal;
  openedAt: Date;
  closedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface POSSessionWithRelations extends POSSession {
  cashier?: {
    id: string;
    username: string;
    email: string;
  };
  dayBook?: {
    id: string;
    date: Date;
    status: string;
  } | null;
}

export interface POSSessionSummary {
  sessionId: string;
  cashierId: string;
  terminalId?: string | null;
  dayBookId?: string | null;
  status: POSSessionStatus;
  openingCash: Decimal;
  closingCash?: Decimal | null;
  totalSales: Decimal;
  totalTransactions: number;
  paymentBreakdown: {
    cash: Decimal;
    card: Decimal;
    digital: Decimal;
    total: Decimal;
  };
  variance: Decimal;
  openedAt: Date;
  closedAt?: Date | null;
  dayBookStatus?: string | null;
}

export interface CreatePOSSessionInput {
  terminalId?: string;
  openingCashAmount: number;
  notes?: string;
}

export interface ClosePOSSessionInput {
  closingCashAmount: number;
  notes?: string;
}
