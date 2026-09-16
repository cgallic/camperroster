import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vmxsxfawteycdvcxhxul.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_n-mC4RbeDag8Xp18HefllQ_dqYTw69H";

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * True when a real service-role key is configured. Routes that genuinely need
 * to bypass RLS (public registration writes, signup provisioning) must check
 * this and return 503 rather than silently running as `anon` and writing
 * nothing — or worse, appearing to succeed.
 */
export const hasServiceRoleKey = Boolean(supabaseServiceKey);

/** Browser/anon client. Subject to RLS. Holds no session of its own. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 *
 * Only three call sites may use it, each commented at the call site:
 *   1. POST /api/register   — a parent has no account; the write is public.
 *   2. POST /api/volunteer  — same.
 *   3. POST /api/camps      — signup must create a camp before any membership
 *                             row exists, so no session can authorise it.
 *   (+ /c/[slug] reads a camp's public name/slug for an unauthenticated visitor.)
 *
 * Every one of those filters or sets camp_id explicitly in application code.
 * Anywhere a user is signed in, use createServerSupabaseClient() from
 * ./supabase-server instead so RLS is actually enforced.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, supabaseServiceKey || SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
