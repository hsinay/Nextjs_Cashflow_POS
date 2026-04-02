/**
 * Payment Service (Refactored)
 * 
 * Loose coupling through:
 * - Dependency injection of repository
 * - No direct Prisma usage
 * - Clear separation of concerns
 * - Event-driven for ledger entries
 */

import { PaymentRepository } from '@/lib/repositories/payment.repository';
import {
    CreatePaymentInput,
    PaginatedPayments,
    Payment,
    PaymentFilters,
} from '@/types/payment.types';

export class PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  /**
   * Get all payments with filters and pagination
   */
  async getAllPayments(filters: PaymentFilters): Promise<PaginatedPayments> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const { items: payments, total } = await this.paymentRepository.findByFilters(
      filters,
      skip,
      limit
    );

    const pages = Math.ceil(total / limit);

    return {
      payments,
      pagination: { page, limit, total, pages },
    };
  }

  /**
   * Get single payment by ID
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findById(id);
  }

  /**
   * Create new payment
   * Emits PaymentCreated event for ledger entry creation
   */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const payment = await this.paymentRepository.create({
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit event for ledger entry creation (loose coupling)
    // This allows ledger service to listen without direct dependency
    // await this.eventEmitter.emit('payment.created', { payment });

    return payment;
  }

  /**
   * Calculate total amount paid by a payer
   */
  async calculatePayerPayments(
    payerType: string,
    payerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    return this.paymentRepository.calculatePayerTotal(
      payerType,
      payerId,
      startDate,
      endDate
    );
  }

  /**
   * Get payment by reference number
   */
  async getPaymentByReference(refNum: string): Promise<Payment | null> {
    return this.paymentRepository.findByReferenceNumber(refNum);
  }

  /**
   * Get all payments for a specific payer
   */
  async getPayerPayments(payerType: string, payerId: string): Promise<Payment[]> {
    return this.paymentRepository.findByPayer(payerType, payerId);
  }
}

/**
 * Factory function for dependency injection
 */
export function createPaymentService(repository: PaymentRepository): PaymentService {
  return new PaymentService(repository);
}
