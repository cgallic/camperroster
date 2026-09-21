import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";

/**
 * Director sign-off on a medical clearance or a volunteer reference.
 *
 * Both updates carry an explicit .eq("camp_id", campId) on top of RLS. A
 * director of camp A sending camp B's record id gets 0 rows updated and a 404,
 * not someone else's child marked medically cleared.
 */
export async function POST(req: Request) {
  let body: { type?: unknown; id?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type : "";
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing record id." }, { status: 400 });
  }
  if (type !== "medical" && type !== "reference") {
    return NextResponse.json(
      { success: false, error: "type must be 'medical' or 'reference'." },
      { status: 400 }
    );
  }

  const resolved = await resolveCampWithRolesOrRespond(
    type === "medical" ? ["nurse"] : ["registrar", "red_shirt"]
  );
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });

  try {
    const query =
      type === "medical"
        ? (supabase as any)
            .from("health_profiles")
            .update({
              immunization_status: "approved",
              immunization_reviewed_by: user.id,
              immunization_reviewed_at: new Date().toISOString(),
              immunization_review_note: typeof body.note === "string" ? body.note.trim().slice(0, 1000) || null : null,
            })
            .eq("id", id)
            .eq("camp_id", camp.campId)
            .select("id")
        : supabase
            .from("staff_references")
            .update({ director_reviewed: true })
            .eq("id", id)
            .eq("camp_id", camp.campId)
            .select("id");

    const { data, error } = await query;

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No such record in your camp. Nothing was changed." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: data[0].id });
  } catch (err) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    console.error("Admin approve error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || "Could not save this approval." },
      { status: 500 }
    );
  }
}
