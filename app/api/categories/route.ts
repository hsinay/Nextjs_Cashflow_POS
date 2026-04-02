// app/api/categories/route.ts

import { authOptions } from '@/lib/auth';
import { createCategorySchema } from '@/lib/validations/category.schema';
import { createCategory, getAllCategories } from '@/services/category.service';
import { APIResponse } from '@/types/category.types';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/categories
 * Returns all categories in hierarchical structure or flat list
 * Query params:
 *   - flat=true: returns flat list instead of hierarchical tree
 */
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse<unknown>>> {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true';

    const categories = await getAllCategories(flat);

    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create new category
 * Required role: ADMIN or INVENTORY_MANAGER
 * Body: {
 *   name: string (required),
 *   description?: string,
 *   parentCategoryId?: string,
 *   imageUrl?: string
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<APIResponse<any>>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Check authorization - only ADMIN and INVENTORY_MANAGER can create
    const userRoles = (session.user as any).roles || [];
    const hasPermission = userRoles.includes('ADMIN') || userRoles.includes('INVENTORY_MANAGER');
    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - insufficient permissions',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate input
    const validationResult = createCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    // Create category
    const category = await createCategory(validationResult.data);

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: 'Category created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/categories:', error);

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes('Parent category not found')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('already exists')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
      },
      { status: 500 }
    );
  }
}
