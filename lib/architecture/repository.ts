/**
 * Base Repository Implementation
 * Provides generic CRUD operations with type safety
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { IRepository } from './core';

/**
 * Generic Repository base class
 * Reduces boilerplate for entity-specific repositories
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  protected abstract modelName: keyof typeof prisma;
  protected abstract select?: Record<string, unknown>;

  async findById(id: string): Promise<T | null> {
    const model = prisma[this.modelName] as unknown as Prisma.ModelDelegate<any>;
    return model.findUnique({
      where: { id },
      select: this.select || undefined,
    }) as Promise<T | null>;
  }

  async findMany(
    filters: Record<string, unknown>,
    skip: number = 0,
    take: number = 20
  ): Promise<T[]> {
    const model = prisma[this.modelName] as unknown as Prisma.ModelDelegate<any>;
    const where = this.buildWhereClause(filters);

    return model.findMany({
      where,
      skip,
      take,
      select: this.select || undefined,
    }) as Promise<T[]>;
  }

  async count(filters: Record<string, unknown>): Promise<number> {
    const model = prisma[this.modelName] as unknown as Prisma.ModelDelegate<any>;
    const where = this.buildWhereClause(filters);
    return model.count({ where });
  }

  async create(data: unknown): Promise<T> {
    const model = prisma[this.modelName] as unknown as Prisma.ModelDelegate<any>;
    return model.create({
      data,
      select: this.select || undefined,
    }) as Promise<T>;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const model = prisma[this.modelName] as any;
    return model.update({
      where: { id },
      data,
      select: this.select || undefined,
    }) as Promise<T>;
  }

  async delete(id: string): Promise<boolean> {
    const model = prisma[this.modelName] as unknown as Prisma.ModelDelegate<any>;
    await model.delete({ where: { id } });
    return true;
  }

  /**
   * Override this method in subclasses to customize query building
   */
  protected buildWhereClause(filters: Record<string, unknown>): unknown {
    return filters;
  }

  /**
   * Utility: Convert Prisma Decimal to number
   */
  protected convertToNumber(value: unknown): number | null | undefined {
    if (value === null || value === undefined) return value;
    if (value instanceof Prisma.Decimal) {
      return value.toNumber();
    }
    return value;
  }

  /**
   * Utility: Convert array of values
   */
  protected convertArrayToNumbers(items: unknown[], fields: string[]): unknown[] {
    return items.map(item => {
      const converted = { ...item };
      fields.forEach(field => {
        if (field in converted) {
          converted[field] = this.convertToNumber(converted[field]);
        }
      });
      return converted;
    });
  }
}
