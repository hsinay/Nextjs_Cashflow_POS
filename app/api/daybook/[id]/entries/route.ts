import { logger } from '@/lib/logger';
import { authOptions } from "@/lib/auth";
import { createDayBookEntrySchema } from "@/lib/validations/daybook.schema";
import { daybookService } from "@/services/daybook.service";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/**
 * GET /api/daybook/[id]/entries
 * List all entries for a day book
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const entries = await daybookService.getEntries(params.id, {
      type: type || undefined,
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    logger.error("Failed to fetch entries:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daybook/[id]/entries
 * Create a new entry in a day book
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - multiple roles can create entries
    const hasPermission = session.user.roles?.some((role: string) =>
      ["ADMIN", "ACCOUNTANT", "CASHIER"].includes(role)
    );
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = await createDayBookEntrySchema.parseAsync({
      dayBookId: params.id,
      ...body,
    });

    const entry = await daybookService.createEntry(validated, session.user.id);

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    logger.error("Failed to create entry:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
