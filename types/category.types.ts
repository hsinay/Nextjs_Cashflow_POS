// types/category.types.ts

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentCategoryId: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category | null;
  children?: Category[];
}

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  imageUrl?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  imageUrl?: string | null;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}
