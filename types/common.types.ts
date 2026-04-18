/**
 * Common types used across the application
 */

/**
 * Dropdown entity with minimal data for UI selection
 */
export interface DropdownEntity {
  id: string;
  name: string;
}

/**
 * Simple entity reference (used in form selections)
 */
export interface EntityRef {
  id: string;
  name: string;
}

/**
 * API Response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
