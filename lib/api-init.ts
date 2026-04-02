/**
 * API Server Initialization
 * Sets up the service layer for API requests
 * 
 * Usage in route handlers:
 * ```
 * import { getPaymentService } from '@/lib/api-init';
 * 
 * export async function GET() {
 *   const paymentService = getPaymentService();
 *   const payments = await paymentService.getAllPayments(filters);
 *   return NextResponse.json(payments);
 * }
 * ```
 */

import { getServiceContainer } from '@/lib/architecture/container';
import { initializeServices } from '@/lib/services/factory';
import { PaymentService } from '@/lib/services/payment.service';

// Track initialization
let isInitialized = false;

/**
 * Initialize API services (called once)
 */
export function initializeAPI(): void {
  if (isInitialized) return;

  const container = getServiceContainer();
  initializeServices(container);

  isInitialized = true;
}

/**
 * Get Payment Service with automatic initialization
 */
export function getPaymentService(): PaymentService {
  initializeAPI();
  const container = getServiceContainer();
  return container.get<PaymentService>('paymentService');
}

/**
 * Reset services (useful for testing)
 */
export function resetAPI(): void {
  const container = getServiceContainer();
  container.clear();
  isInitialized = false;
}
