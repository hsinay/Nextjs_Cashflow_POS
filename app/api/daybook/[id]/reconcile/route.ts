import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { daybookService } from "@/services/daybook.service";
import { reconcileDayBookSchema } from "@/lib/validations/daybook.schema";

/**
 * POST /api/daybook/[id]/reconcile
 * Record cash denominations and complete reconciliation
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

    // Check permissions
    const hasPermission = session.user.roles?.includes("ADMIN") || session.user.roles?.includes("ACCOUNTANT");
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = await reconcileDayBookSchema.parseAsync(body);

    // Record denominations with dayBookId
    const denominationsWithId = validated.denominations.map((d: any) => ({
      ...d,
      dayBookId: params.id,
    }));

    const { created, totalCash } = await daybookService.recordDenominations(
      params.id,
      denominationsWithId
    );

    // Get reconciliation summary
    const summary = await daybookService.getReconciliationSummary(params.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          denominations: created,
          totalFromDenominations: totalCash,
          reconciliationSummary: summary,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to reconcile daybook:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/daybook/[id]/reconcile
 * Get reconciliation summary
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

    const summary = await daybookService.getReconciliationSummary(params.id);

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Failed to fetch reconciliation summary:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
