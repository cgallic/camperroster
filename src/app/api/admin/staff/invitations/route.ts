import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { resolveCampWithRolesOrRespond } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

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

/**
 * Sends the invitation email through Supabase Auth. Both links come back through
 * /auth/callback with the session in the URL fragment, which the callback hands
 * on to the acceptance page. The implicit flow is deliberate: these emails are requested from the
 * server, so there is no browser holding a PKCE verifier to exchange a code.
 */
async function emailInvitation(email: string, redirectTo: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (!inviteError) return true;
  // Existing accounts cannot be invited again; email them a sign-in link instead.
  const mailer = createSupabaseClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } });
  const { error: otpError } = await mailer.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
  return !otpError;
}

export async function POST(req: Request) {
  const context = await directorContext();
  if ("response" in context) return context.response;
  const parsed = InviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid email and role are required." }, { status: 400 });

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const siteUrl = configured && /^https?:\/\//.test(configured) ? configured : new URL(req.url).origin;
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const origin = siteUrl.replace(/\/$/, "");
  const acceptancePath = `/staff/invite?token=${encodeURIComponent(token)}`;
  const acceptUrl = `${origin}${acceptancePath}`;
  const admin = createAdminClient();

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

  // The invitation stands even when the email does not go out: the director
  // gets the link back and can text or email it themselves.
  const emailSent = await emailInvitation(parsed.data.email, `${origin}/auth/callback?next=${encodeURIComponent(acceptancePath)}`);
  return NextResponse.json({ invitation: data, acceptUrl, emailSent }, { status: 201 });
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
