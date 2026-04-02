import { prisma } from "@/lib/prisma";
import {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from "@/lib/validations/daybook.schema";
import { ExpenseCategory, ExpenseCategoryStatus } from "@prisma/client";
// Type-safe tree node for category tree
export interface CategoryTreeNode extends ExpenseCategory {
  children: CategoryTreeNode[];
}

class ExpenseCategoryService {
  /**
   * Create a new expense category
   */
  async createCategory(data: CreateExpenseCategoryInput) {
    // Check if category with same code already exists
    if (data.code) {
      const existing = await prisma.expenseCategory.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new Error(`Category with code ${data.code} already exists`);
      }
    }

    // If parent category specified, verify it exists
    if (data.parentCategoryId) {
      const parent = await prisma.expenseCategory.findUnique({
        where: { id: data.parentCategoryId },
      });
      if (!parent) {
        throw new Error("Parent category not found");
      }

      // Prevent circular references
      await this.checkCircularReference(data.parentCategoryId, null);
    }

    return await prisma.expenseCategory.create({
      data: {
        name: data.name,
        description: data.description,
        code: data.code,
        parentCategoryId: data.parentCategoryId,
        accountHead: data.accountHead,
        status: ExpenseCategoryStatus.ACTIVE,
      },
      include: {
        parentCategory: true,
        childCategories: true,
      },
    });
  }

  /**
   * Update an expense category
   */
  async updateCategory(
    categoryId: string,
    data: UpdateExpenseCategoryInput
  ) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // If changing parent, check for circular reference
    if (
      data.parentCategoryId !== undefined &&
      data.parentCategoryId !== category.parentCategoryId
    ) {
      if (data.parentCategoryId) {
        const parent = await prisma.expenseCategory.findUnique({
          where: { id: data.parentCategoryId },
        });
        if (!parent) {
          throw new Error("Parent category not found");
        }
        await this.checkCircularReference(data.parentCategoryId, categoryId);
      }
    }

    // Check if code is being changed and new code already exists
    if (data.code !== undefined && data.code !== category.code && data.code) {
      const existing = await prisma.expenseCategory.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new Error(`Category with code ${data.code} already exists`);
      }
    }

    return await prisma.expenseCategory.update({
      where: { id: categoryId },
      data,
      include: {
        parentCategory: true,
        childCategories: true,
      },
    });
  }

  /**
   * Get a category by ID
   */
  async getCategory(categoryId: string) {
    return await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
      include: {
        parentCategory: true,
        childCategories: true,
      },
    });
  }

  /**
   * Get all categories as a hierarchical tree
   */
  async getCategoriesTree(onlyActive: boolean = true) {
    const allCategories = await prisma.expenseCategory.findMany({
      where: onlyActive ? { status: ExpenseCategoryStatus.ACTIVE } : {},
      include: {
        childCategories: true,
      },
    });

    // Build tree by filtering root categories
    const tree = allCategories
      .filter((cat) => !cat.parentCategoryId)
      .map((cat) => this.buildCategoryNode(cat, allCategories));

    return tree;
  }

  /**
   * Get all categories as a flat list
   */
  async getCategoriesFlat(onlyActive: boolean = true) {
    return await prisma.expenseCategory.findMany({
      where: onlyActive ? { status: ExpenseCategoryStatus.ACTIVE } : {},
      orderBy: { name: "asc" },
    });
  }

  /**
   * Deactivate a category
   */
  async deactivateCategory(categoryId: string) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Also deactivate all child categories
    await prisma.expenseCategory.updateMany({
      where: {
        parentCategoryId: categoryId,
      },
      data: {
        status: ExpenseCategoryStatus.INACTIVE,
      },
    });

    return await prisma.expenseCategory.update({
      where: { id: categoryId },
      data: {
        status: ExpenseCategoryStatus.INACTIVE,
        isActive: false,
      },
    });
  }

  /**
   * Activate a category
   */
  async activateCategory(categoryId: string) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return await prisma.expenseCategory.update({
      where: { id: categoryId },
      data: {
        status: ExpenseCategoryStatus.ACTIVE,
        isActive: true,
      },
    });
  }

  /**
   * Delete a category (only if no entries or child categories)
   */
  async deleteCategory(categoryId: string) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
      include: {
        childCategories: true,
        dayBookEntries: true,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.childCategories.length > 0) {
      throw new Error("Cannot delete category with child categories");
    }

    if (category.dayBookEntries.length > 0) {
      throw new Error("Cannot delete category with associated entries");
    }

    return await prisma.expenseCategory.delete({
      where: { id: categoryId },
    });
  }

  /**
   * Check for circular references in hierarchy
   */
  private async checkCircularReference(
    parentId: string,
    childId: string | null
  ): Promise<void> {
    const visited = new Set<string>();
    let current = parentId;

    while (current) {
      if (visited.has(current)) {
        throw new Error("Circular reference detected in category hierarchy");
      }

      if (current === childId) {
        throw new Error("Cannot create circular reference");
      }

      visited.add(current);

      const category = await prisma.expenseCategory.findUnique({
        where: { id: current },
        select: { parentCategoryId: true },
      });

      if (!category) break;
      current = category.parentCategoryId || "";
    }
  }

  /**
   * Build a category node with children recursively
   */
  private buildCategoryNode(
    category: ExpenseCategory,
    allCategories: ExpenseCategory[]
  ): CategoryTreeNode {
    return {
      ...category,
      children: allCategories
        .filter((cat) => cat.parentCategoryId === category.id)
        .map((child) => this.buildCategoryNode(child, allCategories)),
    };
  }
}

export const expenseCategoryService = new ExpenseCategoryService();
