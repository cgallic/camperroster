import { NextResponse } from "next/server";
import { getMembership, type Membership, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Same shape as the cabins guard: JSON refusals, never a redirect, because
 * these are fetch() endpoints.
 *
 * The role set mirrors the RLS policy on `document_records` exactly — registrar,
 * nurse and red shirt, plus the director. Counselors are not on this list and
 * must not be added; they have no reason to read a camper's medical paperwork.
 */
export const DOCUMENT_ROLES: Role[] = ["director", "registrar", "nurse", "red_shirt"];

export type DocumentGuard = {
  ok: true;
  membership: Membership;
  userId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export async function requireDocumentAccess(): Promise<DocumentGuard | { ok: false; response: NextResponse }> {
  const membership = await getMembership();
  if (!membership) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  if (!DOCUMENT_ROLES.includes(membership.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Your role cannot access camp documents" }, { status: 403 }),
    };
  }
  // Request-scoped client: every read and write below still passes through RLS.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  return { ok: true, membership, userId: user.id, supabase };
}

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status: 400 });
}

export function fromZod(error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }) {
  const first = error.issues[0];
  const path = first ? first.path.map(String).join(".") : "";
  return badRequest(first ? `${path || "body"}: ${first.message}` : "Invalid request body");
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return req.headers.get("x-real-ip");
}
