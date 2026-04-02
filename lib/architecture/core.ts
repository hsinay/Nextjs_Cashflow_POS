/**
 * Core Service Layer - Loose Coupling Architecture
 * 
 * This module defines the high-level service interfaces and patterns
 * to ensure services are loosely coupled and easily testable.
 * 
 * PRINCIPLES:
 * - Dependency Injection: Services receive dependencies via constructor
 * - Interface Segregation: Small, focused interfaces
 * - Single Responsibility: Each service handles one domain
 * - No Direct ORM: Services use repositories, not Prisma directly
 */

/**
 * Repository Pattern Interface
 * Abstracts data access layer from business logic
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filters: Record<string, any>, skip: number, take: number): Promise<T[]>;
  count(filters: Record<string, any>): Promise<number>;
  create(data: any): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Event Emitter Interface
 * Enables loose coupling between services via events
 */
export interface IEventEmitter {
  emit(event: string, data: any): Promise<void>;
  on(event: string, handler: (data: any) => Promise<void>): void;
  off(event: string, handler: (data: any) => Promise<void>): void;
}

/**
 * Logger Interface
 * Abstracts logging implementation
 */
export interface ILogger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
  debug(message: string, context?: any): void;
}

/**
 * Cache Interface
 * Abstraction for caching layer
 */
export interface ICache {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Transaction Context
 * Manages database transactions across services
 */
export interface ITransactionContext {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

/**
 * Service Container
 * Manages dependency injection for all services
 */
export interface IServiceContainer {
  register<T>(name: string, factory: () => T): void;
  get<T>(name: string): T;
  getRepository<T>(entity: string): IRepository<T>;
  registerRepository<T>(entity: string, repository: IRepository<T>): void;
  clear(): void;
}

/**
 * Domain Event
 * Base class for all domain events
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }

  abstract getEventType(): string;
  abstract getEventData(): any;
}
