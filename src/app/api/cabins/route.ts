import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCabinAdmin, badRequest, fromZod } from "./_guard";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  gender: z.enum(["male", "female"]),
  minGrade: z.number().int().min(0).max(12),
  maxGrade: z.number().int().min(0).max(12),
  capacity: z.number().int().min(1).max(40).optional(),
  sessionId: z.string().uuid().optional(),
  leadCounselorId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
});

/** Opens an additional cabin for a grade/gender bucket that filled up. */
export async function POST(req: Request) {
  const guard = await requireCabinAdmin();
  if (!guard.ok) return guard.response;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const body = parsed.data;

  if (body.minGrade > body.maxGrade) return badRequest("Lowest grade must not be above the highest grade");

  const { data, error } = await guard.supabase
    .from("cabins")
    .insert({
      camp_id: guard.membership.campId,
      name: body.name,
      gender: body.gender,
      min_grade: body.minGrade,
      max_grade: body.maxGrade,
      capacity: body.capacity ?? 12,
      session_id: body.sessionId ?? null,
      lead_counselor_id: body.leadCounselorId ?? null,
      sort_order: body.sortOrder ?? 0,
      is_open: true,
    })
    .select("id, name, gender, min_grade, max_grade, capacity, is_open")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cabin: data }, { status: 201 });
}

const ToggleSchema = z.object({ cabinId: z.string().uuid(), isOpen: z.boolean() });

/** Opens or closes a cabin to new placements without deleting it. */
export async function PATCH(req: Request) {
  const guard = await requireCabinAdmin();
  if (!guard.ok) return guard.response;

  const parsed = ToggleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const { data, error } = await guard.supabase
    .from("cabins")
    .update({ is_open: parsed.data.isOpen })
    .eq("id", parsed.data.cabinId)
    .select("id, is_open")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return badRequest("That cabin no longer exists");
  return NextResponse.json({ cabinId: data.id, isOpen: data.is_open });
}
