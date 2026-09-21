import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Registrations the canteen register may charge, scoped to the caller's camp.
 *
 * The POS page used to run this query in the browser with the publishable anon
 * key and no camp filter, so whichever camp happened to hold the first row in
 * the table became "the camper at the register".
 */
export async function GET(req: Request) {
  const resolved = await resolveCampWithRolesOrRespond(["registrar", "staff", "counselor"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 25;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("registrations")
      .select("id, canteen_balance_cents, campers(legal_first_name, legal_last_name)")
      .eq("camp_id", camp.campId)
      .limit(limit);

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    const registrations = (data ?? []).map((row: any) => {
      const camper = Array.isArray(row.campers) ? row.campers[0] : row.campers;
      const name = [camper?.legal_first_name, camper?.legal_last_name].filter(Boolean).join(" ").trim();
      return {
        id: row.id,
        name: name || "Registration " + String(row.id).slice(0, 8),
        balanceCents: row.canteen_balance_cents || 0,
      };
    });

    return NextResponse.json({
      success: true,
      camp: { campId: camp.campId, campName: camp.campName, slug: camp.slug },
      registrations,
    });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
