/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/change-password/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-utils', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { requireAuth } from '@/lib/auth-utils';

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  oldPassword: 'OldPass123!',
  newPassword: 'NewPass456@',
  confirmPassword: 'NewPass456@',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/change-password', () => {
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuth.mockRejectedValue({ status: 401 });

      const res = await POST(makeRequest(VALID_BODY));

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/unauthorized/i);
    });
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  describe('Input validation', () => {
    it('returns 400 when oldPassword is empty', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

      const res = await POST(makeRequest({ ...VALID_BODY, oldPassword: '' }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.errors).toBeDefined();
    });

    it('returns 400 when newPassword is too short', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

      const res = await POST(makeRequest({ ...VALID_BODY, newPassword: 'Short1!', confirmPassword: 'Short1!' }));

      expect(res.status).toBe(400);
    });

    it('returns 400 when newPassword lacks uppercase letter', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

      const res = await POST(makeRequest({
        ...VALID_BODY,
        newPassword: 'newpass456@',
        confirmPassword: 'newpass456@',
      }));

      expect(res.status).toBe(400);
    });

    it('returns 400 when newPassword lacks special character', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

      const res = await POST(makeRequest({
        ...VALID_BODY,
        newPassword: 'NewPass456',
        confirmPassword: 'NewPass456',
      }));

      expect(res.status).toBe(400);
    });

    it('returns 400 when confirmPassword does not match newPassword', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

      const res = await POST(makeRequest({
        ...VALID_BODY,
        confirmPassword: 'DifferentPass1!',
      }));

      expect(res.status).toBe(400);
    });

    it('returns 400 when newPassword equals oldPassword', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

      const samePassword = 'OldPass123!';
      const res = await POST(makeRequest({
        oldPassword: samePassword,
        newPassword: samePassword,
        confirmPassword: samePassword,
      }));

      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // Business logic
  // -------------------------------------------------------------------------

  describe('Password change logic', () => {
    it('returns 404 when authenticated user record is missing from DB', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'ghost-user' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await POST(makeRequest(VALID_BODY));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toMatch(/not found/i);
    });

    it('returns 400 when old password is incorrect', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        password: 'hashed-old-password',
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await POST(makeRequest(VALID_BODY));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/incorrect/i);
    });

    it('returns 200 and updates password on success', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        password: 'hashed-old-password',
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const res = await POST(makeRequest(VALID_BODY));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('hashes the new password with bcrypt cost factor 10', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ password: 'old-hash' });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await POST(makeRequest(VALID_BODY));

      expect(mockBcrypt.hash).toHaveBeenCalledWith(VALID_BODY.newPassword, 10);
    });

    it('stores the hashed (not plain-text) new password', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ password: 'old-hash' });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedvalue');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await POST(makeRequest(VALID_BODY));

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { password: '$2b$10$hashedvalue' },
        })
      );
      // Ensure plain-text password is never stored
      expect(mockPrisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: { password: VALID_BODY.newPassword },
        })
      );
    });

    it('updates the correct user by session ID', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-999' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ password: 'old-hash' });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await POST(makeRequest(VALID_BODY));

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-999' } })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('Error handling', () => {
    it('returns 500 when an unexpected error occurs', async () => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('DB connection lost')
      );

      const res = await POST(makeRequest(VALID_BODY));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/internal server error/i);
    });
  });
});
