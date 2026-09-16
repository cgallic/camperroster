/**
 * Alias kept so the routes written against this name keep working.
 *
 * Two conventions for "the request-scoped client" arrived from different
 * branches. There is now one implementation, in ./supabase/server, which is
 * typed against the generated Database and also exposes the service-role
 * client. This file just points at it.
 *
 * Prefer importing from `@/lib/supabase/server` in new code.
 */
export { createClient as createServerSupabaseClient, createAdminClient } from "./supabase/server";
