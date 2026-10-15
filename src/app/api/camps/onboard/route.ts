import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCamp, getCurrentUser } from "@/lib/auth";
import { normalizeSlug, RESERVED_SLUGS, SLUG_PATTERN } from "@/lib/formContracts";
import { notifyInbound } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/server";
import { createStaffInvitation, siteOrigin } from "@/lib/staff-invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  campName: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(60).transform(normalizeSlug),
  directorName: z.string().trim().min(2).max(120),
  directorEmail: z.string().trim().toLowerCase().email().max(320),
});

/**
 * Sets up a camp for a new customer. The camp is created empty and its
 * director is invited by email; the person setting it up does NOT join it, so
 * every account still belongs to exactly one camp (most pages rely on RLS
 * alone, so an account in two camps would see both camps' data mixed).
 */
export async function POST(req: Request) {
  const [camp, user] = await Promise.all([getCurrentCamp(), getCurrentUser()]);
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!camp || camp.role !== "director") return NextResponse.json({ error: "Only a camp director can set up a camp for a customer." }, { status: 403 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Camp name, link name, director name and a valid director email are required." }, { status: 400 });
  const { campName, slug, directorName, directorEmail } = parsed.data;
  if (slug.length < 3 || !SLUG_PATTERN.test(slug)) return NextResponse.json({ error: "Pick a link name of at least 3 letters or numbers." }, { status: 400 });
  if (RESERVED_SLUGS.has(slug)) return NextResponse.json({ error: `"${slug}" is reserved. Choose another link name.` }, { status: 409 });

  const admin = createAdminClient();
  const { data: created, error: insertError } = await admin.from("camps")
    .insert({ name: campName, slug, director_name: directorName, director_email: directorEmail })
    .select("id, slug")
    .single();
  if (insertError) {
    if ((insertError as { code?: string }).code === "23505") return NextResponse.json({ error: `The link name "${slug}" is already taken. Choose another.` }, { status: 409 });
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const result = await createStaffInvitation({ campId: created.id, email: directorEmail, role: "director", invitedBy: user.id, origin: siteOrigin(req) });
  if ("error" in result) {
    // A camp nobody can be invited into is an orphan; undo it.
    await admin.from("camps").delete().eq("id", created.id);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await notifyInbound({
    kind: "camp_onboarded",
    summary: `Camp set up for a customer: ${campName} (${directorName}, ${directorEmail}) at /c/${slug}, by ${user.email}`,
    details: { camp_id: created.id, slug, director_email: directorEmail, set_up_by: user.email ?? null },
  });

  return NextResponse.json({ campId: created.id, slug: created.slug, campName, directorEmail, acceptUrl: result.acceptUrl, emailSent: result.emailSent }, { status: 201 });
}
