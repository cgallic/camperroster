import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isValidEmail } from "@/lib/formContracts";

/**
 * Email + password sign-in.
 *
 * Deliberately NOT magic links: the marketing copy advertises SMS links, but no
 * SMS provider is configured on this deployment (see /api/sms/magic-link, which
 * says so plainly). Building auth on a channel that cannot deliver would lock
 * every director out of their own camp.
 */
export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are both required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: "That email address does not look valid." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    // Same message for "no such user" and "wrong password" — do not confirm
    // which camp directors have accounts here.
    return NextResponse.json(
      { success: false, error: "Those credentials did not match an account." },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, userId: data.user.id });
}
