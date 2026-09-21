import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";

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
  const resolved = await resolveCampWithRolesOrRespond(["registrar", "staff", "counselor"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const body = await req.json();
    const { registration_id, amount_cents, note } = body;
    const idempotencyKey = req.headers.get("idempotency-key")?.trim() ?? "";

    if (!registration_id || typeof amount_cents !== "number" || !Number.isFinite(amount_cents) || idempotencyKey.length < 8) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await (supabase as any).rpc("mutate_canteen_wallet", {
      p_registration_id: registration_id,
      p_amount_cents: Math.trunc(amount_cents),
      p_idempotency_key: idempotencyKey,
      p_note: typeof note === "string" ? note.trim().slice(0, 500) || null : null,
    });

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      if (error.code === "P0002") return NextResponse.json({ success: false, error: "Registration not found." }, { status: 404 });
      if (error.code === "42501") return NextResponse.json({ success: false, error: "Your role cannot change wallets." }, { status: 403 });
      if (error.code === "23514") return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      if (error.code === "23505") return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      throw error;
    }
    const newBalance = Number(data.new_balance_cents);

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
