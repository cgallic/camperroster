import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Counselor-safe roster data. Guardian contact details and health records are
 * deliberately absent: those tables are not readable by the counselor role.
 */
export async function GET() {
  const resolved = await resolveCampWithRolesOrRespond(["counselor", "staff", "nurse", "registrar"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("registrations")
      .select(
        "id, cabin_id, cabin_name, counselor_name, buddy_requests, checked_in, campers(legal_first_name, legal_last_name, preferred_name, birth_date, grade_entering)"
      )
      .eq("camp_id", camp.campId)
      .order("cabin_name", { ascending: true });

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    const registrations = (data ?? []).map((row: any) => {
      const camper = Array.isArray(row.campers) ? row.campers[0] : row.campers;
      const legalName = [camper?.legal_first_name, camper?.legal_last_name].filter(Boolean).join(" ").trim();
      return {
        id: row.id,
        name: camper?.preferred_name || legalName || `Registration ${String(row.id).slice(0, 8)}`,
        legalName: legalName || null,
        birthDate: camper?.birth_date ?? null,
        grade: camper?.grade_entering ?? null,
        buddyRequests: row.buddy_requests ?? [],
        checkedIn: Boolean(row.checked_in),
        cabinId: row.cabin_id ?? null,
        cabin: row.cabin_name ?? null,
        counselor: row.counselor_name ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      camp: { campId: camp.campId, campName: camp.campName },
      registrations,
    });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
