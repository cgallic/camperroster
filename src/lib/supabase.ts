import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./supabase/env";

/**
 * Credentials are resolved on first use rather than at import time, so a missing
 * env var surfaces as a failing request instead of a build that won't start.
 */
function lazyClient(build: () => SupabaseClient<Database>): SupabaseClient<Database> {
  let instance: SupabaseClient<Database> | null = null;
  const resolve = () => (instance ??= build());
  return new Proxy({} as SupabaseClient<Database>, {
    get: (_target, prop, receiver) => Reflect.get(resolve(), prop, receiver),
  });
}

export const supabase = lazyClient(() => createClient<Database>(SUPABASE_URL(), SUPABASE_ANON_KEY()));

/**
 * Bypasses RLS. Reserved for work with no user session by definition: public
 * registration intake, verified webhooks, scheduled jobs. Prefer the
 * request-scoped client in `lib/supabase/server` anywhere a user is signed in.
 */
export const supabaseAdmin = lazyClient(() =>
  createClient<Database>(SUPABASE_URL(), SUPABASE_SERVICE_ROLE_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
);
