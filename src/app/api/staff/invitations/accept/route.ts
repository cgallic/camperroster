import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  token: z.string().min(32).max(200),
  // Only for someone with no account yet: the invitation link stands in for
  // the email confirmation, since it was sent to (or handed to) that address.
  password: z.string().min(10).max(200).optional(),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid invitation and a password of at least 10 characters are required." }, { status: 400 });
  const db = await createClient();
  let { data: { user } } = await db.auth.getUser();

  if (!user && parsed.data.password) {
    const admin = createAdminClient();
    const tokenHash = createHash("sha256").update(parsed.data.token, "utf8").digest("hex");
    const { data: invite } = await (admin as any).from("staff_invitations")
      .select("email,status,expires_at").eq("token_sha256", tokenHash).maybeSingle();
    if (!invite || invite.status !== "pending" || new Date(invite.expires_at) <= new Date()) {
      return NextResponse.json({ error: "This invitation is invalid or expired. Ask your director to send a new one." }, { status: 400 });
    }
    const { error: createError } = await admin.auth.admin.createUser({ email: invite.email, password: parsed.data.password, email_confirm: true });
    if (createError) {
      return NextResponse.json({ error: "An account already exists for this email. Sign in, then open this link again.", code: "account_exists" }, { status: 409 });
    }
    const { data: signedIn, error: signInError } = await db.auth.signInWithPassword({ email: invite.email, password: parsed.data.password });
    if (signInError) return NextResponse.json({ error: "Your account was created but sign-in failed. Sign in, then open this link again." }, { status: 500 });
    user = signedIn.user;
  }

  if (!user) return NextResponse.json({ error: "Sign in with the invited email first." }, { status: 401 });

  // One account, one camp: most pages rely on RLS alone, so an account in two
  // camps would see both camps' records mixed together.
  const admin = createAdminClient();
  const tokenHash = createHash("sha256").update(parsed.data.token, "utf8").digest("hex");
  const { data: target } = await (admin as any).from("staff_invitations").select("camp_id").eq("token_sha256", tokenHash).maybeSingle();
  if (target) {
    const { data: other } = await admin.from("camp_members").select("camp_id, camps(name)").eq("user_id", user.id).neq("camp_id", target.camp_id).limit(1).maybeSingle();
    if (other) {
      const otherCamp = Array.isArray(other.camps) ? other.camps[0] : other.camps;
      return NextResponse.json({ error: `This account already belongs to ${otherCamp?.name ?? "another camp"}. Accept with a different email address.` }, { status: 409 });
    }
  }

  const { data, error } = await (db as any).rpc("accept_staff_invitation", { p_token: parsed.data.token });
  if (error) {
    const status = error.code === "42501" ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ accepted: true, membership: data });
}

/** What the invitation is for, so the acceptance page can say so before sign-in. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length < 32 || token.length > 200) return NextResponse.json({ error: "This invitation link is incomplete." }, { status: 400 });
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const admin = createAdminClient();
  const { data: invite } = await (admin as any).from("staff_invitations")
    .select("email,role,status,expires_at,camps(name)").eq("token_sha256", tokenHash).maybeSingle();
  if (!invite) return NextResponse.json({ error: "This invitation link is not valid." }, { status: 404 });
  const camp = Array.isArray(invite.camps) ? invite.camps[0] : invite.camps;
  const expired = invite.status === "pending" && new Date(invite.expires_at) <= new Date();
  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    campName: camp?.name ?? "",
    status: expired ? "expired" : invite.status,
  }, { headers: { "Cache-Control": "no-store" } });
}
