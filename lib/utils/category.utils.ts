// lib/utils/category.utils.ts

import { Category, CategoryTreeNode } from '@/types/category.types';

/**
 * Build a hierarchical tree structure from flat category list
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // Create tree nodes
  for (const category of categories) {
    map.set(category.id, {
      ...category,
      children: [],
    });
  }

  // Build relationships
  for (const category of categories) {
    const node = map.get(category.id);
    if (!node) continue;

    if (category.parentCategoryId) {
      const parent = map.get(category.parentCategoryId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort by name
  const sort = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    return nodes.sort((a, b) => a.name.localeCompare(b.name)).map(node => ({
      ...node,
      children: sort(node.children),
    }));
  };

  return sort(roots);
}

/**
 * Flatten hierarchical categories to a single-level list
 */
export function flattenCategoryTree(categories: CategoryTreeNode[]): Category[] {
  const result: Category[] = [];

  const flatten = (nodes: CategoryTreeNode[]): void => {
    for (const node of nodes) {
      const { children, ...categoryData } = node;
      result.push(categoryData as Category);
      if (children && children.length > 0) {
        flatten(children);
      }
    }
  };

  flatten(categories);
  return result;
}

/**
 * Get all descendants of a category
 */
export function getCategoryDescendants(category: CategoryTreeNode): Category[] {
  const descendants: Category[] = [];

  const collect = (node: CategoryTreeNode): void => {
    if (node.children) {
      for (const child of node.children) {
        const { children, ...categoryData } = child;
        descendants.push(categoryData as Category);
        collect(child);
      }
    }
  };

  collect(category);
  return descendants;
}

/**
 * Search categories by name (case-insensitive)
 */
export function searchCategoriesByName(
  categories: CategoryTreeNode[],
  query: string
): CategoryTreeNode[] {
  const lowerQuery = query.toLowerCase();

  const search = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    return nodes
      .map(node => ({
        ...node,
        children: search(node.children || []),
      }))
      .filter(
        node =>
          node.name.toLowerCase().includes(lowerQuery) ||
          (node.children && node.children.length > 0)
      );
  };

  return search(categories);
}

/**
 * Get the full path from root to a category
 */
export function getCategoryPath(categories: Category[], categoryId: string): Category[] {
  const path: Category[] = [];
  const visited = new Set<string>();

  const findPath = (id: string): boolean => {
    if (visited.has(id)) return false;
    visited.add(id);

    const category = categories.find(c => c.id === id);
    if (!category) return false;

    path.unshift(category);

    if (category.parentCategoryId) {
      return findPath(category.parentCategoryId);
    }

    return true;
  };

  findPath(categoryId);
  return path;
}

/**
 * Get breadcrumb navigation for a category
 */
export function getCategoryBreadcrumbs(
  categories: Category[],
  categoryId: string
): { id: string; name: string }[] {
  return getCategoryPath(categories, categoryId).map(cat => ({
    id: cat.id,
    name: cat.name,
  }));
}

/**
 * Validate that a parent is not a descendant of child
 */
export function isValidParentCategory(
  categories: Category[],
  childId: string,
  parentId: string | null
): boolean {
  if (!parentId) return true;
  if (childId === parentId) return false;

  // Get all descendants of the child
  const descendants: Set<string> = new Set();

  const collectDescendants = (id: string): void => {
    const children = categories.filter(c => c.parentCategoryId === id);
    for (const child of children) {
      descendants.add(child.id);
      collectDescendants(child.id);
    }
  };

  collectDescendants(childId);

  // Check if new parent is a descendant
  return !descendants.has(parentId);
}

/**
 * Get category depth in hierarchy
 */
export function getCategoryDepth(categories: Category[], categoryId: string): number {
  const category = categories.find(c => c.id === categoryId);
  if (!category) return 0;

  let depth = 0;
  let currentId: string | null = category.parentCategoryId;

  while (currentId) {
    depth++;
    const parent = categories.find(c => c.id === currentId);
    currentId = parent?.parentCategoryId || null;
  }

  return depth;
}

/**
 * Check if a category has any children
 */
export function hasChildren(categories: Category[], categoryId: string): boolean {
  return categories.some(c => c.parentCategoryId === categoryId);
}

/**
 * Get count of all descendants (including self)
 */
export function getSubcategoryCount(categories: Category[], categoryId: string): number {
  let count = 1;
  const children = categories.filter(c => c.parentCategoryId === categoryId);

  for (const child of children) {
    count += getSubcategoryCount(categories, child.id);
  }

  return count;
}

/**
 * Format category name for display
 */
export function formatCategoryName(name: string, maxLength: number = 50): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
}

/**
 * Get category display label with parent info
 */
export function getCategoryDisplayLabel(
  categories: Category[],
  categoryId: string
): string {
  const breadcrumbs = getCategoryBreadcrumbs(categories, categoryId);
  return breadcrumbs.map(b => b.name).join(' > ');
}
