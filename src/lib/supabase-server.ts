import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase";

/**
 * Request-scoped Supabase client bound to the caller's auth cookies.
 *
 * This is the client that should be used for anything a signed-in user does.
 * It runs as that user, so Row Level Security actually applies — a query that
 * forgets a camp_id filter returns nothing instead of another camp's campers.
 *
 * Contrast with `supabaseAdmin` in ./supabase, which is service-role and
 * bypasses RLS entirely.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component, where the cookie store is
          // read-only. That is fine: src/middleware.ts refreshes the session
          // on every matched request, so the tokens stay current.
        }
      },
    },
  });
}
