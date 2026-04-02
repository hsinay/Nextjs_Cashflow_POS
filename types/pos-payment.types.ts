/**
 * POS Payment Component Types
 * UI/UX types for the Odoo-style payment panel
 */

import { Customer } from './customer.types';
import { ConcretePaymentMethod } from './payment.types';

/**
 * Payment Panel State
 */
export interface POSPaymentState {
  // Amount Input
  paidAmount: number;          // Amount entered via keypad
  changeAmount: number;        // Auto-calculated for cash
  
  // Customer Selection
  selectedCustomerId: string | null;
  paymentAsCredit: boolean;    // For credit method
  
  // Payment Method
  paymentMethod: ConcretePaymentMethod;
  
  // Submission State
  isConfirming: boolean;
  validationError: string | null;
  
  // Order Summary (read-only from parent)
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
}

/**
 * Numeric Keypad State
 */
export interface NumericKeypadState {
  input: string;              // Current input value (e.g., "50.00")
  hasDecimal: boolean;        // Track if decimal already entered
}

/**
 * Payment Detail for API submission
 * This is what gets passed to the existing payment API
 */
export interface PaymentDetailInput {
  paymentMethod: ConcretePaymentMethod;
  amount: number;             // Amount paid (not including change)
  customerId?: string;        // Optional, required for CREDIT
}

/**
 * Props for POSPaymentPanel component
 */
export interface POSPaymentPanelProps {
  // Order Data (read-only)
  orderTotal: number;
  orderSubtotal: number;
  orderTax: number;
  orderDiscount?: number;
  
  // Session & Transaction Context
  sessionId: string;
  cashierId: string;
  cartItems: any[];           // CartItem[] from pos-client
  
  // Customer Data
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  
  // Callbacks
  onConfirmPayment: (paymentData: PaymentDetailInput) => Promise<void>;
  onCancel: () => void;
  
  // UI State
  isProcessing?: boolean;
  isOpen?: boolean;
}

/**
 * Props for NumericKeypad component
 */
export interface NumericKeypadProps {
  value: string;
  onValueChange: (value: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

/**
 * Props for OrderSummary component
 */
export interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  isReadOnly?: boolean;
}

/**
 * Props for PaymentMethodSelector component
 */
export interface PaymentMethodSelectorProps {
  selectedMethod: ConcretePaymentMethod;
  onSelectMethod: (method: ConcretePaymentMethod) => void;
  availableMethods?: ConcretePaymentMethod[];
  disabled?: boolean;
}

/**
 * Props for CustomerSelector component
 */
export interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;  // True for CREDIT method
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Payment Method Capabilities
 */
export interface PaymentMethodCapabilities {
  requiresExactAmount: boolean;      // Cash = false (can overpay), Card = true
  requiresCustomer: boolean;         // Credit = true, others = false
  supportsPartialPayment: boolean;   // Credit = true, others = false
  calculateChange: boolean;          // Cash = true, others = false
}

/**
 * Payment method configuration
 */
export const PAYMENT_METHOD_CONFIG: Record<
  ConcretePaymentMethod,
  PaymentMethodCapabilities
> = {
  CASH: {
    requiresExactAmount: false,
    requiresCustomer: false,
    supportsPartialPayment: false,
    calculateChange: true,
  },
  CREDIT: {
    requiresExactAmount: true,
    requiresCustomer: true,
    supportsPartialPayment: true,
    calculateChange: false,
  },
  CARD: {
    requiresExactAmount: true,
    requiresCustomer: false,
    supportsPartialPayment: false,
    calculateChange: false,
  },
  UPI: {
    requiresExactAmount: true,
    requiresCustomer: false,
    supportsPartialPayment: false,
    calculateChange: false,
  },
  BANK_TRANSFER: {
    requiresExactAmount: true,
    requiresCustomer: false,
    supportsPartialPayment: true,
    calculateChange: false,
  },
  CHEQUE: {
    requiresExactAmount: true,
    requiresCustomer: false,
    supportsPartialPayment: true,
    calculateChange: false,
  },
  DIGITAL_WALLET: {
    requiresExactAmount: true,
    requiresCustomer: false,
    supportsPartialPayment: false,
    calculateChange: false,
  },
  DEBIT: {
    requiresExactAmount: true,
    requiresCustomer: false,
    supportsPartialPayment: false,
    calculateChange: false,
  },
  MOBILE_WALLET: {
    requiresExactAmount: true,
    requiresCustomer: false,
    supportsPartialPayment: false,
    calculateChange: false,
  },
};
