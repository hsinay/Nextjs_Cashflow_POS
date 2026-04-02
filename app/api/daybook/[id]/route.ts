import { authOptions } from "@/lib/auth";
import { approveDayBookSchema, closeDayBookSchema } from "@/lib/validations/daybook.schema";
import { daybookService } from "@/services/daybook.service";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/**
 * GET /api/daybook/[id]
 * Get a specific day book by ID
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

    const daybook = await daybookService.getDayBook(params.id);

    if (!daybook) {
      return NextResponse.json({ error: "Day book not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: daybook });
  } catch (error) {
    console.error("Failed to fetch daybook:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/daybook/[id]
 * Close a day book
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

    // Check permissions - only ADMIN and ACCOUNTANT can close day books
    const hasPermission = session.user.roles?.includes("ADMIN") || session.user.roles?.includes("ACCOUNTANT");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    if (action === "close") {
      const validated = await closeDayBookSchema.parseAsync(data);
      const daybook = await daybookService.closeDayBook(
        params.id,
        validated,
        session.user.id
      );
      return NextResponse.json({ success: true, data: daybook });
    }

    if (action === "approve") {
      const validated = await approveDayBookSchema.parseAsync(data);
      const daybook = await daybookService.approveDayBook(
        params.id,
        validated,
        session.user.id
      );
      return NextResponse.json({ success: true, data: daybook });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update daybook:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
