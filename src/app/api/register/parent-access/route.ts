import { NextResponse } from "next/server";
import { verifyIntakeToken } from "@/lib/signed-payload";
import { createAdminClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  const claims = verifyIntakeToken(token);
  if (!claims) return NextResponse.json({ error: "This registration link is invalid or expired." }, { status: 401 });

  const db = createAdminClient();
  const { data: registration } = await db.from("registrations").select("id, camp_id, guardian_id").eq("id", claims.registrationId).eq("camp_id", claims.campId).eq("camper_id", claims.camperId).maybeSingle();
  if (!registration) return NextResponse.json({ error: "The registration could not be verified." }, { status: 403 });
  const { data: guardian } = await db.from("guardians").select("email, auth_user_id").eq("id", registration.guardian_id).eq("camp_id", claims.campId).maybeSingle();
  if (!guardian?.email) return NextResponse.json({ error: "No guardian email is attached to this registration." }, { status: 409 });

  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent("/portal")}`;
  if (guardian.auth_user_id) {
    const { error } = await db.auth.signInWithOtp({ email: guardian.email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
    if (error) return NextResponse.json({ error: "Parent sign-in email could not be delivered." }, { status: 502 });
    return NextResponse.json({ status: "existing" });
  }

  const { error: inviteError } = await db.auth.admin.inviteUserByEmail(guardian.email, { redirectTo, data: { registration_id: claims.registrationId, camp_id: claims.campId } });
  if (!inviteError) return NextResponse.json({ status: "invited" });
  const { error: magicLinkError } = await db.auth.signInWithOtp({ email: guardian.email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
  if (magicLinkError) return NextResponse.json({ error: "Parent access email could not be delivered." }, { status: 502 });
  return NextResponse.json({ status: "existing" });
}
