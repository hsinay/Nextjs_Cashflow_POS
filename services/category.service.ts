// services/category.service.ts

import { prisma } from '@/lib/prisma';
import { createCategorySchema, updateCategorySchema } from '@/lib/validations/category.schema';
import { Category, CategoryTreeNode, CreateCategoryInput, UpdateCategoryInput } from '@/types/category.types';

function normalizeImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith('data:')) {
    throw new Error('Base64 image payloads are not allowed');
  }

  return imageUrl;
}

/**
 * Recursively build tree structure from flat categories
 */
function buildCategoryTree(categories: Category[], parentId: string | null = null): CategoryTreeNode[] {
  return categories
    .filter(cat => cat.parentCategoryId === parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
}

/**
 * Check for circular references by traversing up the parent chain
 * Returns true if circular reference detected
 */
async function checkCircularReference(categoryId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId || newParentId === categoryId) {
    return false;
  }

  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      return true; // Circular reference detected
    }

    if (currentId === categoryId) {
      return true; // Trying to set descendant as parent
    }

    visited.add(currentId);

    const parent = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentCategoryId: true },
    }) as { parentCategoryId: string | null } | null;

    currentId = parent?.parentCategoryId || null;
  }

  return false;
}

/**
 * Get all categories in hierarchical structure
 */
export async function getAllCategories(flat: boolean = false): Promise<Category[] | CategoryTreeNode[]> {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        description: true,
        imageUrl: true,
        parentCategoryId: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    if (flat) {
      return categories;
    }

    return buildCategoryTree(categories as Category[]);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Get single category by ID with its children
 */
export async function getCategoryById(id: string): Promise<Category> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category as Category;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw new Error('Failed to fetch category');
  }
}

/**
 * Create new category with validation
 */
export async function createCategory(data: CreateCategoryInput): Promise<Category> {
  try {
    // Validate input
    const validatedData = createCategorySchema.parse(data);

    // Check if parent exists if provided
    if (validatedData.parentCategoryId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: validatedData.parentCategoryId },
      });

      if (!parentExists) {
        throw new Error('Parent category not found');
      }
    }

    // Check for duplicate name
    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name },
    });

    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        parentCategoryId: validatedData.parentCategoryId || null,
        imageUrl: normalizeImageUrl(validatedData.imageUrl),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category as Category;
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create category');
  }
}

/**
 * Update category with validation
 */
export async function updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
  try {
    // Validate input
    const validatedData = updateCategorySchema.parse(data);

    // Check category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Prevent setting category as its own parent
    if (validatedData.parentCategoryId === id) {
      throw new Error('Category cannot be its own parent');
    }

    // Check parent exists if provided
    if (validatedData.parentCategoryId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: validatedData.parentCategoryId },
      });

      if (!parentExists) {
        throw new Error('Parent category not found');
      }

      // Check for circular references
      const hasCircularRef = await checkCircularReference(id, validatedData.parentCategoryId);
      if (hasCircularRef) {
        throw new Error('Circular reference detected. This would create an invalid hierarchy');
      }
    }

    // Check for duplicate name if changing name
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findUnique({
        where: { name: validatedData.name },
      });

      if (duplicateCategory) {
        throw new Error('Category name already exists');
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.parentCategoryId !== undefined && { parentCategoryId: validatedData.parentCategoryId }),
        ...(validatedData.imageUrl !== undefined && { imageUrl: normalizeImageUrl(validatedData.imageUrl) }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return updatedCategory as Category;
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update category');
  }
}

/**
 * Delete category with validation
 * Only allows deletion if no children or products reference it
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    // Check category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check for children
    if (category.children.length > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    // Check for products
    if (category.products.length > 0) {
      throw new Error('Cannot delete category with products');
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete category');
  }
}

/**
 * Get categories for dropdown (excludes given category and its descendants)
 * Used for parent category selection
 */
export async function getCategoriesForParentSelect(excludeCategoryId?: string): Promise<Category[]> {
  try {
    let categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parentCategoryId: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    if (excludeCategoryId) {
      // Get all descendant IDs
      const getDescendants = (parentId: string): string[] => {
        const descendants: string[] = [parentId];
        const children = categories.filter(cat => cat.parentCategoryId === parentId);
        for (const child of children) {
          descendants.push(...getDescendants(child.id));
        }
        return descendants;
      };

      const excludeIds = new Set(getDescendants(excludeCategoryId));
      categories = categories.filter(cat => !excludeIds.has(cat.id));
    }

    return categories as Category[];
  } catch (error) {
    console.error('Error fetching categories for select:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Search categories by name
 */
export async function searchCategories(query: string): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: 'asc' },
    });

    return categories as Category[];
  } catch (error) {
    console.error('Error searching categories:', error);
    throw new Error('Failed to search categories');
  }
}
