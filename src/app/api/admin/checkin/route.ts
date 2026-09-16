import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampOrRespond, setupIncompleteResponse } from "@/lib/auth";

/**
 * Gate check-in. Staff-only, tenant-scoped.
 *
 * This route previously used the service-role client with no auth and no camp
 * filter: anyone on the internet could flip any registration's checked_in flag
 * by guessing a UUID. It now runs on the user-scoped client (RLS applies) AND
 * filters explicitly on camp_id.
 */
export async function POST(req: Request) {
  const resolved = await resolveCampOrRespond();
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const { registration_id, checked_in } = await req.json();

    if (!registration_id) {
      return NextResponse.json({ success: false, error: "Missing registration_id" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const shouldCheckIn = checked_in ?? true;

    const { data, error } = await supabase
      .from("registrations")
      .update({
        checked_in: shouldCheckIn,
        checked_in_at: shouldCheckIn ? new Date().toISOString() : null,
      })
      .eq("id", registration_id)
      .eq("camp_id", camp.campId)
      .select();

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No such registration in your camp. Nothing was changed." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, registration: data[0] });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
