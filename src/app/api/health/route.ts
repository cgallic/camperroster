import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = {
    app: "CamperRoster.com",
    version: "1.0.0",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    timestamp: new Date().toISOString(),
  };

  try {
    // Cheap real round-trip to Postgres: count only, no rows returned.
    const { count, error } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true });

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
      registrations: count ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ...base, status: "unhealthy", db: "error", db_error: err?.message || "Unknown error" },
      { status: 503 }
    );
  }
}
