/**
 * Service Factory
 * Central place to initialize all services with dependencies
 * 
 * Benefits:
 * - Single point of dependency configuration
 * - Easy to swap implementations for testing
 * - Ensures consistent service initialization
 */

import { IServiceContainer } from '@/lib/architecture/core';
import { PaymentRepository } from '@/lib/repositories/payment.repository';
import { PaymentService, createPaymentService } from '@/lib/services/payment.service';

export class ServiceFactory {
  private repositories = new Map();
  private services = new Map();

  constructor(private container: IServiceContainer) {}

  /**
   * Initialize all repositories
   */
  initializeRepositories(): void {
    // Payment Repository
    const paymentRepo = new PaymentRepository();
    this.repositories.set('payment', paymentRepo);
    this.container.registerRepository('payment', paymentRepo);
  }

  /**
   * Initialize all services
   */
  initializeServices(): void {
    const paymentRepo = this.repositories.get('payment') as PaymentRepository;
    const paymentService = createPaymentService(paymentRepo);
    this.services.set('payment', paymentService);
    this.container.register('paymentService', () => paymentService);
  }

  /**
   * Get initialized service
   */
  getService(name: string): any {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not initialized`);
    }
    return service;
  }

  /**
   * Initialize all (repositories first, then services)
   */
  initializeAll(): void {
    this.initializeRepositories();
    this.initializeServices();
  }
}

/**
 * Global factory instance
 */
let factory: ServiceFactory;

export function initializeServices(container: IServiceContainer): ServiceFactory {
  factory = new ServiceFactory(container);
  factory.initializeAll();
  return factory;
}

export function getServiceFactory(): ServiceFactory {
  if (!factory) {
    throw new Error('Services not initialized. Call initializeServices first.');
  }
  return factory;
}

/**
 * Convenience methods for getting services
 */
export function getPaymentService(): PaymentService {
  return getServiceFactory().getService('payment');
}
