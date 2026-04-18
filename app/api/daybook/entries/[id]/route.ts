import { logger } from '@/lib/logger';
import { authOptions } from "@/lib/auth";
import { updateDayBookEntrySchema } from "@/lib/validations/daybook.schema";
import { daybookService } from "@/services/daybook.service";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/**
 * PUT /api/daybook/entries/[id]
 * Update an entry
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

    // Check permissions
    const hasPermission = session.user.roles?.some((role: string) =>
      ["ADMIN", "ACCOUNTANT", "CASHIER"].includes(role)
    );
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = await updateDayBookEntrySchema.parseAsync(body);

    const entry = await daybookService.updateEntry(params.id, validated);

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    logger.error("Failed to update entry:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/daybook/entries/[id]
 * Delete an entry
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

    // Check permissions - only ADMIN and ACCOUNTANT can delete entries
    const hasPermission = session.user.roles?.includes("ADMIN") || session.user.roles?.includes("ACCOUNTANT");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entry = await daybookService.deleteEntry(params.id);

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    logger.error("Failed to delete entry:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
