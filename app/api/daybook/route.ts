import { logger } from '@/lib/logger';
import { authOptions } from "@/lib/auth";
import { createDayBookSchema } from "@/lib/validations/daybook.schema";
import { daybookService } from "@/services/daybook.service";
import { DayBookStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/**
 * GET /api/daybook
 * List all day books with optional filtering
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as DayBookStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const daybooks = await daybookService.listDayBooks({
      status: status || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({ success: true, data: daybooks });
  } catch (error) {
    logger.error("Failed to fetch daybooks:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daybook
 * Open a new day book
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only ADMIN and ACCOUNTANT can open day books
    const hasPermission = session.user.roles?.includes("ADMIN") || session.user.roles?.includes("ACCOUNTANT");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = await createDayBookSchema.parseAsync(body);

    const daybook = await daybookService.openDayBook(validated, session.user.id);

    return NextResponse.json({ success: true, data: daybook }, { status: 201 });
  } catch (error) {
    logger.error("Failed to open daybook:", error);
    if (error instanceof Error && error.message.includes("Day book already exists")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
