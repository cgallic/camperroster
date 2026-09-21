import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveCampWithRolesOrRespond } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InviteSchema = z.object({
  email: z.string().email().max(320).transform((value) => value.trim().toLowerCase()),
  role: z.enum(["director", "registrar", "nurse", "red_shirt", "counselor", "staff"]),
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
    return NextResponse.json({ error: "Staff invitations are not configured (NEXT_PUBLIC_SITE_URL)." }, { status: 503 });
  }
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const acceptancePath = `/staff/invite?token=${encodeURIComponent(token)}`;
  const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(acceptancePath)}`;
  const admin = createAdminClient();

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo });
  if (inviteError) {
    // Existing accounts cannot be invited again; email a sign-in link that
    // lands on the same one-time invitation acceptance screen.
    const { error: otpError } = await admin.auth.signInWithOtp({
      email: parsed.data.email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });
    if (otpError) return NextResponse.json({ error: "Supabase could not deliver the invitation email." }, { status: 502 });
  }

  await (admin as any).from("staff_invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("camp_id", context.camp.campId)
    .eq("email", parsed.data.email)
    .eq("status", "pending");
  const { data, error } = await (admin as any)
    .from("staff_invitations")
    .insert({
      camp_id: context.camp.campId,
      email: parsed.data.email,
      role: parsed.data.role,
      token_sha256: tokenHash,
      invited_by: context.user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id,email,role,status,invited_at,expires_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invitation: data }, { status: 201 });
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
