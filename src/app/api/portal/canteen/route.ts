import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampOrRespond, setupIncompleteResponse } from "@/lib/auth";

/**
 * Canteen wallet credit/debit. Staff-only, tenant-scoped.
 *
 * It lives under /api/portal for historical reasons but the only caller is the
 * staff POS at /canteen/pos. It used to be an unauthenticated service-role
 * route that would move money on any registration UUID.
 *
 * A REAL parent-facing top-up would need parent authentication (see the note in
 * the report) — it must not be built by loosening this route.
 */
export async function POST(req: Request) {
  const resolved = await resolveCampOrRespond();
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const body = await req.json();
    const { registration_id, amount_cents } = body;

    if (!registration_id || typeof amount_cents !== "number" || !Number.isFinite(amount_cents)) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: reg, error: fetchErr } = await supabase
      .from("registrations")
      .select("id, canteen_balance_cents")
      .eq("id", registration_id)
      .eq("camp_id", camp.campId)
      .maybeSingle();

    if (fetchErr) {
      if (isSetupIncompleteError(fetchErr)) return setupIncompleteResponse(fetchErr);
      throw fetchErr;
    }
    if (!reg) {
      return NextResponse.json(
        { success: false, error: "No such registration in your camp. Nothing was charged." },
        { status: 404 }
      );
    }

    const newBalance = (reg.canteen_balance_cents || 0) + amount_cents;
    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: "That would overdraw the camper's wallet. Nothing was charged." },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("registrations")
      .update({ canteen_balance_cents: newBalance })
      .eq("id", registration_id)
      .eq("camp_id", camp.campId)
      .select("id")
      .single();

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      new_balance_cents: newBalance,
      message:
        amount_cents < 0
          ? `Debited $${Math.abs(amount_cents / 100).toFixed(2)} from the canteen wallet.`
          : `Added $${(amount_cents / 100).toFixed(2)} to the canteen wallet.`,
    });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
