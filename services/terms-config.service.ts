/**
 * Credit System Configuration Service
 * Manages payment terms, interest rates, and late fee rules
 */

export interface CreditTermsConfig {
  monthlyInterestRate: number; // 2% = 0.02
  dailyInterestRate: number; // calculated from monthly
  lateFeeFixed: number; // flat fee per day overdue
  lateFeePercentage: number; // 0.5% = 0.005 of outstanding balance
  gracePeriodDays: number; // days before late fee applies
  minimumLateFee: number;
  maximumMonthlyFee: number;
  compoundInterest: boolean; // apply interest on interest
}

export interface PaymentTermConfig {
  name: string;
  days: number;
  discountPercentage?: number; // early payment discount
}

class TermsConfigService {
  /**
   * Default credit configuration
   * In production, load from database/environment
   */
  private readonly defaultConfig: CreditTermsConfig = {
    monthlyInterestRate: 0.02, // 2% per month
    dailyInterestRate: 0.02 / 30, // ~0.067% per day
    lateFeeFixed: 10, // Rs. 10 per day overdue
    lateFeePercentage: 0.005, // 0.5% of outstanding
    gracePeriodDays: 3, // 3 days grace after due date
    minimumLateFee: 50, // minimum Rs. 50 per month
    maximumMonthlyFee: 5000, // cap at Rs. 5000 per month
    compoundInterest: false, // don't compound by default
  };

  /**
   * Standard payment term definitions
   */
  private readonly paymentTerms: Record<string, PaymentTermConfig> = {
    IMMEDIATE: { name: 'Immediate Payment', days: 0 },
    NET_7: { name: '7 Days', days: 7, discountPercentage: 2 },
    NET_15: { name: '15 Days', days: 15, discountPercentage: 1 },
    NET_30: { name: '30 Days', days: 30 },
    NET_60: { name: '60 Days', days: 60 },
    END_OF_MONTH: { name: 'End of Month', days: -1 }, // Special handling
    CUSTOM: { name: 'Custom Terms', days: 0 },
  };

  /**
   * Get current credit configuration
   */
  getConfig(): CreditTermsConfig {
    return this.defaultConfig;
  }

  /**
   * Get payment term details
   */
  getPaymentTerm(term: string): PaymentTermConfig | null {
    return this.paymentTerms[term] || null;
  }

  /**
   * Calculate due date from transaction date and payment term
   */
  calculateDueDate(transactionDate: Date, paymentTerm: string): Date {
    const config = this.getPaymentTerm(paymentTerm);
    if (!config) throw new Error(`Invalid payment term: ${paymentTerm}`);

    const dueDate = new Date(transactionDate);

    if (paymentTerm === 'END_OF_MONTH') {
      // Due on last day of month
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(0);
    } else {
      // Add days to transaction date
      dueDate.setDate(dueDate.getDate() + config.days);
    }

    return dueDate;
  }

  /**
   * Calculate early payment discount
   */
  calculateEarlyPaymentDiscount(
    amount: number,
    paymentTerm: string,
    daysEarly: number
  ): number {
    const config = this.getPaymentTerm(paymentTerm);
    if (!config || !config.discountPercentage || daysEarly <= 0) return 0;

    return amount * (config.discountPercentage / 100);
  }

  /**
   * Calculate late fees for overdue transaction
   */
  calculateLateFee(
    outstandingAmount: number,
    daysPastDue: number
  ): {
    fixedFee: number;
    percentageFee: number;
    totalFee: number;
    effectiveRate: number;
  } {
    const config = this.defaultConfig;

    // No fee in grace period
    if (daysPastDue <= config.gracePeriodDays) {
      return {
        fixedFee: 0,
        percentageFee: 0,
        totalFee: 0,
        effectiveRate: 0,
      };
    }

    // Calculate days chargeable
    const chargeDays = daysPastDue - config.gracePeriodDays;

    // Fixed fee
    const fixedFee = Math.max(
      config.lateFeeFixed * chargeDays,
      config.minimumLateFee
    );

    // Percentage-based fee
    const percentageFee = outstandingAmount * config.lateFeePercentage * Math.ceil(daysPastDue / 30);

    // Total fee capped at max monthly fee
    const totalBeforeCap = fixedFee + percentageFee;
    const totalFee = Math.min(totalBeforeCap, config.maximumMonthlyFee);

    const effectiveRate = (totalFee / outstandingAmount) * 100;

    return {
      fixedFee,
      percentageFee,
      totalFee,
      effectiveRate,
    };
  }

  /**
   * Calculate interest on outstanding balance
   */
  calculateInterest(
    principal: number,
    days: number,
    useDaily: boolean = true
  ): {
    amount: number;
    rate: number;
  } {
    const config = this.defaultConfig;
    const rate = useDaily ? config.dailyInterestRate : config.monthlyInterestRate;
    const periods = useDaily ? days : days / 30;

    const amount = principal * rate * periods;

    return {
      amount,
      rate: rate * 100, // as percentage
    };
  }

  /**
   * Generate payment schedule for a transaction
   */
  generatePaymentSchedule(
    amount: number,
    dueDate: Date,
    numberOfPayments: number = 1
  ): Array<{
    paymentNumber: number;
    dueDate: Date;
    amount: number;
    description: string;
  }> {
    if (numberOfPayments <= 1) {
      return [
        {
          paymentNumber: 1,
          dueDate,
          amount,
          description: 'Full payment',
        },
      ];
    }

    const installmentAmount = amount / numberOfPayments;
    const schedule = [];
    const daysBetweenPayments = 30; // Monthly installments

    for (let i = 0; i < numberOfPayments; i++) {
      const paymentDueDate = new Date(dueDate);
      paymentDueDate.setDate(paymentDueDate.getDate() + i * daysBetweenPayments);

      schedule.push({
        paymentNumber: i + 1,
        dueDate: paymentDueDate,
        amount: i === numberOfPayments - 1 ? amount - installmentAmount * i : installmentAmount,
        description: `Installment ${i + 1} of ${numberOfPayments}`,
      });
    }

    return schedule;
  }

  /**
   * Calculate total cost of credit (interest + fees)
   */
  calculateTotalCreditCost(
    principalAmount: number,
    days: number,
    daysPastDue: number = 0
  ): {
    interest: number;
    lateFees: number;
    totalCost: number;
    effectiveAnnualRate: number;
  } {
    const interest = this.calculateInterest(principalAmount, days).amount;
    const lateFees = daysPastDue > 0 
      ? this.calculateLateFee(principalAmount, daysPastDue).totalFee 
      : 0;

    const totalCost = interest + lateFees;

    // Calculate effective annual rate
    const daysInYear = 365;
    const yearlyRate = (totalCost / principalAmount) * (daysInYear / days);

    return {
      interest,
      lateFees,
      totalCost,
      effectiveAnnualRate: yearlyRate * 100,
    };
  }
}

export const termsConfigService = new TermsConfigService();
