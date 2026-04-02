/**
 * In-Memory Cache Implementation
 * Provides caching with TTL support for optimal performance
 * 
 * Performance Optimizations:
 * - Reduces database queries
 * - TTL-based automatic invalidation
 * - Configurable cache strategies
 */

import { ICache } from '@/lib/architecture/core';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

export class InMemoryCache implements ICache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL: number; // in milliseconds

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries (optional maintenance)
   */
  cleanupExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Cache with namespace support
 * Prevents key conflicts between different domains
 */
export class NamespacedCache {
  private cache: ICache;
  private namespace: string;

  constructor(cache: ICache, namespace: string) {
    this.cache = cache;
    this.namespace = namespace;
  }

  private makeKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get(key: string): Promise<any | null> {
    return this.cache.get(this.makeKey(key));
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    return this.cache.set(this.makeKey(key), value, ttl);
  }

  async delete(key: string): Promise<void> {
    return this.cache.delete(this.makeKey(key));
  }

  async clear(): Promise<void> {
    // For simplicity, we'd need to track keys per namespace
    // This is a limitation of simple namespace approach
    return Promise.resolve();
  }
}

/**
 * Cache decorator for functions
 * Automatically caches function results
 */
export function withCache(
  cache: ICache,
  keyPrefix: string,
  ttl: number = 5 * 60 * 1000
) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}
