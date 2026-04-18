import { logger } from '@/lib/logger';
import { authOptions } from "@/lib/auth";
import { updateExpenseCategorySchema } from "@/lib/validations/daybook.schema";
import { expenseCategoryService } from "@/services/expense-category.service";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/**
 * GET /api/expense-categories/[id]
 * Get a specific expense category
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const category = await expenseCategoryService.getCategory(params.id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    logger.error("Failed to fetch expense category:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/expense-categories/[id]
 * Update an expense category
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only ADMIN and ACCOUNTANT
    const hasPermission = session.user.roles?.includes("ADMIN") || session.user.roles?.includes("ACCOUNTANT");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = await updateExpenseCategorySchema.parseAsync(body);

    const category = await expenseCategoryService.updateCategory(
      params.id,
      validated
    );

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    logger.error("Failed to update expense category:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expense-categories/[id]
 * Delete an expense category
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only ADMIN
    const hasPermission = session.user.roles?.includes("ADMIN");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const category = await expenseCategoryService.deleteCategory(params.id);

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    logger.error("Failed to delete expense category:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
