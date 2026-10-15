/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash, randomBytes } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Role } from "./auth";
import { createAdminClient } from "./supabase/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase/env";

/**
 * Sends the invitation email through Supabase Auth. Both links come back through
 * /auth/callback with the session in the URL fragment, which the callback hands
 * on to the acceptance page. The implicit flow is deliberate: these emails are
 * requested from the server, so there is no browser holding a PKCE verifier to
 * exchange a code.
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

/** The public origin invitation links point at, falling back to the request's own. */
export function siteOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const siteUrl = configured && /^https?:\/\//.test(configured) ? configured : new URL(req.url).origin;
  return siteUrl.replace(/\/$/, "");
}

/**
 * Creates a one-time invitation (replacing any pending one for the same email)
 * and tries to email it. The invitation stands even when the email does not go
 * out: the caller gets the link back to send by hand.
 */
export async function createStaffInvitation(input: { campId: string; email: string; role: Role; invitedBy: string; origin: string }) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const acceptancePath = `/staff/invite?token=${encodeURIComponent(token)}`;
  const admin = createAdminClient();

  await (admin as any).from("staff_invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("camp_id", input.campId)
    .eq("email", input.email)
    .eq("status", "pending");
  const { data, error } = await (admin as any)
    .from("staff_invitations")
    .insert({
      camp_id: input.campId,
      email: input.email,
      role: input.role,
      token_sha256: tokenHash,
      invited_by: input.invitedBy,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id,email,role,status,invited_at,expires_at")
    .single();
  if (error) return { error: error.message as string } as const;

  const emailSent = await emailInvitation(input.email, `${input.origin}/auth/callback?next=${encodeURIComponent(acceptancePath)}`);
  return { invitation: data, acceptUrl: `${input.origin}${acceptancePath}`, emailSent } as const;
}
