import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCabinAdmin, badRequest, fromZod } from "../_guard";

const BodySchema = z.object({
  registrationId: z.string().uuid(),
  cabinId: z.string().uuid(),
  /** Directors can seat a camper past the cap deliberately (siblings, buddy requests). */
  override: z.boolean().optional(),
});

export async function POST(req: Request) {
  const guard = await requireCabinAdmin();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const { registrationId, cabinId, override } = parsed.data;

  const { data: existing } = await guard.supabase
    .from("cabin_assignments")
    .select("cabin_id")
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (existing?.cabin_id === cabinId) {
    return NextResponse.json({ moved: false, message: "Camper is already in that cabin" });
  }

  // The capacity check and the write happen inside one locked transaction, so a
  // second admin moving someone into the same last bed cannot slip between them.
  const { error } = await guard.supabase.rpc("move_camper_to_cabin", {
    p_registration_id: registrationId,
    p_cabin_id: cabinId,
    p_override: Boolean(override),
  });

  if (error) {
    // 23514 is the check-violation code the function raises for a full cabin or
    // a grade/gender mismatch; both are the admin's problem to resolve, not ours.
    const status = error.code === "42501" ? 403 : 400;
    return NextResponse.json({ error: error.message, full: error.code === "23514" }, { status });
  }

  return NextResponse.json({ moved: true, cabinId, overrode: Boolean(override) });
}
