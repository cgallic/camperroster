import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Liveness + database reachability.
 *
 * It no longer reports a registration count. With RLS enabled (migration 0001)
 * the anonymous client legitimately sees zero rows in every camp, so a count
 * here would always print 0 and read like "nobody has registered" rather than
 * "this client is not allowed to see registrations". The round-trip is kept
 * because it still proves PostgREST is answering.
 */
export async function GET() {
  const base = {
    app: "CamperRoster.com",
    version: "1.0.0",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    timestamp: new Date().toISOString(),
  };

  try {
    // head:true -> no rows transferred. Under RLS the anon role sees nothing,
    // which is the point: we are testing reachability, not reading data.
    const { error } = await supabaseAdmin.from("registrations").select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { ...base, status: "unhealthy", db: "error", db_error: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ...base,
      status: "healthy",
      db: "connected",
      note: "Row counts are not reported here: RLS correctly hides every camp's rows from the anonymous client.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ...base, status: "unhealthy", db: "error", db_error: err?.message || "Unknown error" },
      { status: 503 }
    );
  }
}
