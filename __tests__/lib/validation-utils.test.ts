/**
 * Test suite for validation utilities
 * Tests UUID validation and error creation
 */

import { areValidUUIDs, createInvalidIDError, isValidUUID, validateIDParam } from '@/lib/validation-utils';

describe('validation-utils', () => {
  describe('isValidUUID', () => {
    it('should validate correct UUID v4 format', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidUUID(null as any)).toBe(false);
      expect(isValidUUID(undefined as any)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(isValidUUID(123 as any)).toBe(false);
      expect(isValidUUID({} as any)).toBe(false);
      expect(isValidUUID([] as any)).toBe(false);
    });

    it('should handle UUID v1 format (should reject)', () => {
      // UUID v1 has different version number
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000';
      expect(isValidUUID(uuidV1)).toBe(false);
    });
  });

  describe('areValidUUIDs', () => {
    it('should validate array of valid UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ];
      expect(areValidUUIDs(validUUIDs)).toBe(true);
    });

    it('should reject array with any invalid UUID', () => {
      const mixedUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'not-valid',
      ];
      expect(areValidUUIDs(mixedUUIDs)).toBe(false);
    });

    it('should reject non-array input', () => {
      expect(areValidUUIDs(null as any)).toBe(false);
      expect(areValidUUIDs('string' as any)).toBe(false);
      expect(areValidUUIDs({} as any)).toBe(false);
    });

    it('should reject empty array', () => {
      expect(areValidUUIDs([])).toBe(true); // Empty array is technically valid
    });
  });

  describe('createInvalidIDError', () => {
    it('should create error object with custom parameter name', () => {
      const error = createInvalidIDError('productId');
      expect(error.message).toContain('productId');
      expect(error.status).toBe(400);
    });

    it('should create error object with default parameter name', () => {
      const error = createInvalidIDError();
      expect(error.message).toContain('id');
      expect(error.status).toBe(400);
    });

    it('should include "UUID" in message', () => {
      const error = createInvalidIDError('customerId');
      expect(error.message).toContain('UUID');
    });
  });

  describe('validateIDParam', () => {
    it('should validate correct UUID', () => {
      const result = validateIDParam('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid UUID', () => {
      const result = validateIDParam('invalid-id');
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(400);
    });

    it('should use custom parameter name in error', () => {
      const result = validateIDParam('invalid', 'customerId');
      expect(result.error?.message).toContain('customerId');
    });
  });
});
