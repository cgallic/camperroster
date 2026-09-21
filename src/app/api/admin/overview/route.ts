import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Director dashboard data, scoped to the caller's camp.
 *
 * The /admin page used to run these queries in the browser with the publishable
 * anon key and no camp filter at all, which returned every camp's rows to
 * anyone who opened the URL. It now runs here, on the user-scoped client, so
 * RLS applies as a second line of defence behind the explicit .eq("camp_id")
 * filters below.
 */
export async function GET() {
  const resolved = await resolveCampWithRolesOrRespond(["registrar"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  const supabase = await createServerSupabaseClient();

  try {
    const [regRes, volRes, healthRes, refRes] = await Promise.all([
      supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("camp_id", camp.campId),
      supabase
        .from("staff_applications")
        .select("*", { count: "exact", head: true })
        .eq("camp_id", camp.campId),
      supabase
        .from("health_profiles")
        .select(
          "id, camper_id, has_allergies, allergy_details, has_epipen, epipen_location, campers(legal_first_name, legal_last_name, grade_entering)"
        )
        .eq("camp_id", camp.campId)
        .eq("has_allergies", true),
      supabase
        .from("staff_references")
        .select(
          "id, reference_name, relationship, phone, sentiment_score, call_transcript, staff_applications(first_name, last_name, role_applied)"
        )
        .eq("camp_id", camp.campId)
        .limit(5),
    ]);

    for (const r of [regRes, volRes, healthRes, refRes]) {
      if (r.error) {
        if (isSetupIncompleteError(r.error)) return setupIncompleteResponse(r.error);
        throw r.error;
      }
    }

    return NextResponse.json({
      success: true,
      camp: { campId: camp.campId, campName: camp.campName, slug: camp.slug, role: camp.role },
      counts: {
        registrations: regRes.count ?? 0,
        staffApplications: volRes.count ?? 0,
        allergyFlags: healthRes.data?.length ?? 0,
        references: refRes.data?.length ?? 0,
      },
      health: healthRes.data ?? [],
      references: refRes.data ?? [],
    });
  } catch (err) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    console.error("Admin overview error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || "Could not load the dashboard." },
      { status: 500 }
    );
  }
}
