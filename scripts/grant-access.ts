/**
 * Grants a person access to a camp's staff area.
 *
 * Membership in camp_members is the only thing that opens the admin, nurse and
 * counselor pages -- row-level security answers every other query with nothing.
 * A fresh database therefore has no way in, which is what this script is for.
 *
 *   npx tsx scripts/grant-access.ts dave@camphope.org camphope director
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY, since creating users and writing membership
 * both sit behind RLS by design.
 */

import { createClient } from "@supabase/supabase-js";

const ROLES = ["director", "registrar", "nurse", "red_shirt", "counselor", "staff"] as const;
type Role = (typeof ROLES)[number];

async function main() {
  const [email, campSlug, role] = process.argv.slice(2);

  if (!email || !campSlug || !role) {
    console.error("Usage: npx tsx scripts/grant-access.ts <email> <camp-slug> <role>");
    console.error(`Roles: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  if (!ROLES.includes(role as Role)) {
    console.error(`Unknown role "${role}". Expected one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: camp, error: campError } = await supabase
    .from("camps")
    .select("id, name")
    .eq("slug", campSlug)
    .maybeSingle();

  if (campError) throw campError;
  if (!camp) {
    console.error(`No camp with slug "${campSlug}".`);
    process.exit(1);
  }

  // The admin API has no get-by-email, so find an existing account by paging.
  let userId: string | undefined;
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    if (data.users.length < 200) break;
  }

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created account for ${email}`);
  }

  const { error: memberError } = await supabase
    .from("camp_members")
    .upsert({ camp_id: camp.id, user_id: userId, role }, { onConflict: "camp_id,user_id" });

  if (memberError) throw memberError;

  console.log(`${email} is now ${role} at ${camp.name}.`);
  console.log("They sign in at /login, which emails them a link -- no password to set.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
