/**
 * Validation utilities for common API operations
 */

/**
 * UUID v4 regex pattern
 * Matches: 550e8400-e29b-41d4-a716-446655440000
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 * @param id - The ID to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_PATTERN.test(id);
}

/**
 * Validates array of IDs are all valid UUIDs
 * @param ids - Array of IDs to validate
 * @returns true if all are valid UUIDs, false otherwise
 */
export function areValidUUIDs(ids: string[]): boolean {
  if (!Array.isArray(ids)) return false;
  return ids.every(id => isValidUUID(id));
}

/**
 * Creates a safe error response for invalid ID
 * @param paramName - The name of the parameter that was invalid
 * @returns Error object with message and status
 */
export function createInvalidIDError(paramName: string = 'id') {
  return {
    message: `Invalid ${paramName}: must be a valid UUID`,
    status: 400,
  };
}

/**
 * Validates and sanitizes a single ID parameter from route params
 * Returns error response if invalid
 */
export function validateIDParam(id: string, paramName: string = 'id') {
  if (!isValidUUID(id)) {
    return {
      error: createInvalidIDError(paramName),
    };
  }
  return { success: true };
}
