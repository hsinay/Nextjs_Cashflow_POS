/**
 * Service Container Implementation
 * Provides dependency injection for loosely coupled services
 */

import { IRepository, IServiceContainer } from './core';

class ServiceContainer implements IServiceContainer {
  private factories: Map<string, () => any> = new Map();
  private instances: Map<string, any> = new Map();
  private repositories: Map<string, IRepository<any>> = new Map();

  register<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
    // Clear cached instance when registering
    this.instances.delete(name);
  }

  get<T>(name: string): T {
    // Return cached instance if available
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Create instance from factory
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    const instance = factory();
    this.instances.set(name, instance);
    return instance;
  }

  getRepository<T>(entity: string): IRepository<T> {
    const repo = this.repositories.get(entity);
    if (!repo) {
      throw new Error(`Repository for ${entity} not registered`);
    }
    return repo;
  }

  registerRepository<T>(entity: string, repository: IRepository<T>): void {
    this.repositories.set(entity, repository);
  }

  clear(): void {
    this.instances.clear();
  }
}

// Global singleton instance
let container: ServiceContainer;

export function getServiceContainer(): IServiceContainer {
  if (!container) {
    container = new ServiceContainer();
  }
  return container;
}

export function resetServiceContainer(): void {
  if (container) {
    container.clear();
  }
  container = new ServiceContainer();
}
