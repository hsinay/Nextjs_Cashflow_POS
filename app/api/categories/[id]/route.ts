// app/api/categories/[id]/route.ts

import { authOptions } from '@/lib/auth';
import { updateCategorySchema } from '@/lib/validations/category.schema';
import { deleteCategory, getCategoryById, updateCategory } from '@/services/category.service';
import { APIResponse } from '@/types/category.types';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/categories/[id]
 * Get single category with its children and parent
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<APIResponse<unknown>>> {
  try {
    const { id } = params;

    // Validate UUID format
    if (!id || id.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category ID',
        },
        { status: 400 }
      );
    }

    const category = await getCategoryById(id);

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(`Error in GET /api/categories/[id]:`, error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id]
 * Update category
 * Required role: ADMIN or INVENTORY_MANAGER
 * Body: Partial category object (all fields optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<APIResponse<any>>> {
  try {
    const { id } = params;

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

    // Check authorization
    const userRoles = ((session.user as unknown) as { roles?: string[] }).roles || [];
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

    // Validate UUID format
    if (!id || id.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category ID',
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    const validationResult = updateCategorySchema.safeParse(body);
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

    // Update category
    const category = await updateCategory(id, validationResult.data);

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: 'Category updated successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(`Error in PUT /api/categories/[id]:`, error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('own parent') || error.message.includes('Circular reference')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 }
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
        error: 'Failed to update category',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete category
 * Required role: ADMIN or INVENTORY_MANAGER
 * Constraints:
 *   - Category must not have child categories
 *   - Category must not have products
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<APIResponse<unknown>>> {
  try {
    const { id } = params;

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

    // Check authorization
    const userRoles = ((session.user as unknown) as { roles?: string[] }).roles || [];
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

    // Validate UUID format
    if (!id || id.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category ID',
        },
        { status: 400 }
      );
    }

    // Delete category
    await deleteCategory(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Category deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(`Error in DELETE /api/categories/[id]:`, error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Cannot delete')) {
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
        error: 'Failed to delete category',
      },
      { status: 500 }
    );
  }
}
