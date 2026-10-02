import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { timingSafeEqual } from "@/lib/email";
import { demoRows } from "@/lib/demo/rows";

export const dynamic = "force-dynamic";

/**
 * Nightly cron: puts the demo camp back to its fixture state, so anything the
 * demo login changed through a path the middleware does not see (the
 * dashboard's browser-side Supabase writes) lasts a day at most. Touches only rows with the fixed demo ids.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });

  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!timingSafeEqual(presented, expected)) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const db = createAdminClient();
  const day = new Date().toISOString().slice(0, 10);
  const counts: Record<string, number> = {};

  for (const [table, rows] of demoRows(day)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db.from(table as any) as any).upsert(rows, { onConflict: "id" });
    if (error) return NextResponse.json({ error: `${table}: ${error.message}`, counts }, { status: 500 });
    counts[table] = rows.length;
  }

  return NextResponse.json({ success: true, counts });
}
