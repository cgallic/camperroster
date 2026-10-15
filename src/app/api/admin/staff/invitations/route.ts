import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveCampWithRolesOrRespond, ROLES } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createStaffInvitation, siteOrigin } from "@/lib/staff-invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InviteSchema = z.object({
  email: z.string().email().max(320).transform((value) => value.trim().toLowerCase()),
  role: z.enum(ROLES),
});

async function directorContext() {
  const resolved = await resolveCampWithRolesOrRespond([]);
  if (resolved.response) return { response: resolved.response } as const;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || resolved.camp.role !== "director") {
    return { response: NextResponse.json({ error: "Only a camp director can manage staff invitations." }, { status: 403 }) } as const;
  }
  return { camp: resolved.camp, user } as const;
}

export async function GET() {
  const context = await directorContext();
  if ("response" in context) return context.response;
  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("staff_invitations")
    .select("id,email,role,status,invited_at,expires_at,accepted_at,revoked_at")
    .eq("camp_id", context.camp.campId)
    .order("invited_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invitations: data ?? [] });
}

export async function POST(req: Request) {
  const context = await directorContext();
  if ("response" in context) return context.response;
  const parsed = InviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid email and role are required." }, { status: 400 });

  const result = await createStaffInvitation({
    campId: context.camp.campId,
    email: parsed.data.email,
    role: parsed.data.role,
    invitedBy: context.user.id,
    origin: siteOrigin(req),
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(req: Request) {
  const context = await directorContext();
  if ("response" in context) return context.response;
  const id = (await req.json().catch(() => null) as { id?: unknown } | null)?.id;
  if (typeof id !== "string") return NextResponse.json({ error: "Invitation id is required." }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("staff_invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id).eq("camp_id", context.camp.campId).eq("status", "pending")
    .select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No pending invitation was found." }, { status: 404 });
  return NextResponse.json({ revoked: true, id });
}
