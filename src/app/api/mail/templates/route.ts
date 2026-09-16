import { NextResponse } from "next/server";
import { z } from "zod";
import { fromZod, requireMailAdmin } from "../_guard";
import { seedTemplates, STANDARD_TEMPLATES } from "@/lib/email";

export const dynamic = "force-dynamic";

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  mergeKeys: z.array(z.string()).optional(),
});

export async function GET() {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.supabase.from("email_templates").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const have = new Set(((data ?? []) as { code: string }[]).map((t) => t.code));
  return NextResponse.json({
    templates: data ?? [],
    // So the editor can offer "add the ones we ship" without guessing.
    missingStandard: STANDARD_TEMPLATES.filter((t) => !have.has(t.code)).map((t) => t.code),
  });
}

/** Creates or edits a template; `?seed=1` installs the standard set instead. */
export async function POST(req: Request) {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;

  if (new URL(req.url).searchParams.get("seed")) {
    try {
      const result = await seedTemplates(guard.supabase, guard.membership.campId);
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not seed templates";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const parsed = UpsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const row = {
    camp_id: guard.membership.campId,
    code: input.code,
    name: input.name,
    subject: input.subject,
    body: input.body,
    merge_keys: input.mergeKeys ?? [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await guard.supabase
    .from("email_templates")
    .upsert(row, { onConflict: "camp_id,code" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ template: data });
}
