import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";

/**
 * Gate check-in. Staff-only, tenant-scoped.
 *
 * This route previously used the service-role client with no auth and no camp
 * filter: anyone on the internet could flip any registration's checked_in flag
 * by guessing a UUID. It now runs on the user-scoped client (RLS applies) AND
 * filters explicitly on camp_id.
 */
export async function POST(req: Request) {
  const resolved = await resolveCampWithRolesOrRespond(["registrar", "staff"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const { registration_id, checked_in } = await req.json();

    if (!registration_id) {
      return NextResponse.json({ success: false, error: "Missing registration_id" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const shouldCheckIn = checked_in ?? true;

    const { data, error } = await (supabase as any).rpc("set_registration_checkin", {
      p_registration_id: registration_id,
      p_checked_in: Boolean(shouldCheckIn),
    });

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      if (error.code === "P0002") return NextResponse.json({ success: false, error: "Registration not found." }, { status: 404 });
      if (error.code === "42501") return NextResponse.json({ success: false, error: "Your role cannot check campers in." }, { status: 403 });
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "No such registration in your camp. Nothing was changed." },
        { status: 404 }
      );
    }

    if (data.camp_id !== camp.campId) {
      return NextResponse.json({ success: false, error: "Tenant mismatch." }, { status: 403 });
    }
    return NextResponse.json({ success: true, registration: data });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
