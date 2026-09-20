import { NextResponse } from "next/server";
import { resolveCampOrRespond } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const resolved = await resolveCampOrRespond();
  if (resolved.response) return resolved.response;
  const { camp } = resolved;
  if (camp.role !== "director") return NextResponse.json({ error: "Only camp directors can view imported records." }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const year = params.get("year");
  const page = Math.max(0, Number.parseInt(params.get("page") || "0", 10) || 0);
  const search = (params.get("q") || "").trim().replace(/[^\p{L}\p{N} '\-]/gu, "").slice(0, 80);
  const id = params.get("id");
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("camp_registration_imports")
    .select(id ? "*" : "id,season_year,participant_type,first_name,last_name,source_status,source_workbook,source_sheet,source_row", { count: "exact" })
    .eq("camp_id", camp.campId);
  if (id) query = query.eq("id", id);
  if (year && /^20\d{2}$/.test(year)) query = query.eq("season_year", Number(year));
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  const { data, error, count } = await query.order("season_year", { ascending: false }).order("last_name").order("first_name").order("id").range(page * 50, page * 50 + 49);
  if (error) return NextResponse.json({ error: "Imported records could not be loaded. Please try again." }, { status: 500 });
  return NextResponse.json({ records: data, total: count, campName: camp.campName }, { headers: { "Cache-Control": "private, no-store" } });
}
