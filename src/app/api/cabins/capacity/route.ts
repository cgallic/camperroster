import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCabinAdmin, badRequest, fromZod } from "../_guard";

const BodySchema = z.object({
  cabinId: z.string().uuid(),
  capacity: z.number().int().min(1).max(40),
});

/** Raise or lower a single cabin's cap. Lowering below the seated count is refused. */
export async function POST(req: Request) {
  const guard = await requireCabinAdmin();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const { cabinId, capacity } = parsed.data;

  const { data: occupancy, error: occError } = await guard.supabase
    .from("cabin_occupancy")
    .select("cabin_id, name, campers_assigned")
    .eq("cabin_id", cabinId)
    .maybeSingle();
  if (occError) return NextResponse.json({ error: occError.message }, { status: 400 });
  if (!occupancy) return badRequest("That cabin no longer exists");

  if (capacity < occupancy.campers_assigned) {
    return badRequest(
      `${occupancy.name} already has ${occupancy.campers_assigned} campers. Move campers out before lowering the cap to ${capacity}.`,
    );
  }

  const { error } = await guard.supabase.from("cabins").update({ capacity }).eq("id", cabinId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ cabinId, capacity, campersAssigned: occupancy.campers_assigned });
}
