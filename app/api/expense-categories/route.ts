import { logger } from '@/lib/logger';
import { authOptions } from "@/lib/auth";
import { createExpenseCategorySchema } from "@/lib/validations/daybook.schema";
import { expenseCategoryService } from "@/services/expense-category.service";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/**
 * GET /api/expense-categories
 * List expense categories
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format"); // 'tree' or 'flat'
    const includeInactive = searchParams.get("includeInactive") === "true";

    if (format === "tree") {
      const categories = await expenseCategoryService.getCategoriesTree(!includeInactive);
      return NextResponse.json({ success: true, data: categories });
    }

    const categories = await expenseCategoryService.getCategoriesFlat(!includeInactive);
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    logger.error("Failed to fetch expense categories:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expense-categories
 * Create a new expense category
 */
export async function POST(req: Request) {
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
    const validated = await createExpenseCategorySchema.parseAsync(body);

    const category = await expenseCategoryService.createCategory(validated);

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    logger.error("Failed to create expense category:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
