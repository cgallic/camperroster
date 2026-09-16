import { NextResponse } from "next/server";
import { rolesForArea } from "@/lib/auth";
import { FINANCE_ROLES, requireExportAccess } from "../_guard";
import {
  buildWorkbook,
  isReportKey,
  loadExportData,
  parseFilters,
  workbookFilename,
  XLSX_CONTENT_TYPE,
} from "@/lib/exports";

export const dynamic = "force-dynamic";

/**
 * `GET /api/exports/master?grade=9&status=overdue` streams a workbook.
 *
 * Filters arrive as repeated (or comma-separated) query parameters and narrow
 * what goes into the file, so the sheet the team opens is the same slice they
 * were looking at on screen.
 */
export async function GET(req: Request, ctx: { params: Promise<{ report: string }> }) {
  const { report } = await ctx.params;
  if (!isReportKey(report)) {
    return NextResponse.json({ error: `Unknown report "${report}"` }, { status: 404 });
  }

  // Money is not for counselors or nurses, even ones who can reach /admin.
  const allowed = report === "financial" ? FINANCE_ROLES : rolesForArea("admin");
  const guard = await requireExportAccess(allowed);
  if (!guard.ok) return guard.response;

  const filters = parseFilters(new URL(req.url).searchParams);

  try {
    const data = await loadExportData(guard.supabase as never);
    const buffer = await buildWorkbook(report, data, filters);
    const filename = workbookFilename(report, data);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not build the workbook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
