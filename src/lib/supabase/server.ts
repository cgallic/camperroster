import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";

/**
 * Request-scoped client carrying the caller's session, so every query runs
 * under RLS as that user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Bypasses RLS. Only for work that has no user session by definition: public
 * registration intake, Stripe webhooks, scheduled jobs. Never reachable from a
 * route that a signed-in user's input can steer.
 */
export function createAdminClient() {
  return createServerClient(SUPABASE_URL(), SUPABASE_SERVICE_ROLE_KEY(), {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
