import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { uploadImageToImageKit } from '@/lib/imagekit';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission =
      hasRole(session.user, 'ADMIN') || hasRole(session.user, 'INVENTORY_MANAGER');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Image file is required' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const uploaded = await uploadImageToImageKit({
      file,
      folder: typeof folder === 'string' ? folder : undefined,
      tags: ['cashflow-pos'],
    });

    return NextResponse.json(
      {
        success: true,
        data: uploaded,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ error }, 'POST /api/uploads/image error');

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Image upload failed' },
      { status: 500 }
    );
  }
}
