import { NextResponse } from "next/server";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, setupIncompleteResponse } from "@/lib/auth";
import { lookupCampBySlug } from "@/lib/campLookup";
import { notifyInbound } from "@/lib/notify";
import type { CampSignupPayload } from "@/lib/formContracts";
import { isValidEmail, MIN_PASSWORD_LENGTH, normalizeSlug, SLUG_PATTERN } from "@/lib/formContracts";

/**
 * Camp-director signup — the single provisioning path.
 *
 * Both /start and /signup post here. It creates, in this order:
 *   1. the auth user   (Supabase Auth, email + password)
 *   2. the camps row    (the tenant)
 *   3. the camp_members row with role 'director' (the thing that grants access)
 * and then signs the director in so the response carries session cookies.
 *
 * ATOMICITY: Postgres cannot roll back an auth.users insert made through the
 * Admin API alongside a PostgREST insert, so this route compensates by hand —
 * if step 2 fails the user is deleted, if step 3 fails both the camp and the
 * user are deleted. A director must never be left with an account that belongs
 * to no camp, or a camp nobody can sign in to.
 *
 * SERVICE ROLE: used deliberately. Step 2 has to create a camp *before* any
 * membership row exists, so there is no session that RLS could authorise it
 * with. Every write below sets or filters camp_id explicitly.
 */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Slugs that must never be handed out as a camp namespace. */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "billing",
  "c",
  "canteen",
  "counselor",
  "login",
  "logout",
  "nurse",
  "portal",
  "pricing",
  "register",
  "signup",
  "start",
  "volunteer",
  "www",
]);

export async function POST(req: Request) {
  let body: Partial<CampSignupPayload>;
  try {
    body = (await req.json()) as Partial<CampSignupPayload>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const campName = str(body.campName);
  const directorName = str(body.directorName);
  const directorEmail = str(body.directorEmail);
  const password = typeof body.password === "string" ? body.password : "";
  const slug = normalizeSlug(str(body.slug) || campName);

  if (!campName) {
    return NextResponse.json({ success: false, error: "Camp organization name is required." }, { status: 400 });
  }
  if (!directorName) {
    return NextResponse.json({ success: false, error: "Your name is required." }, { status: 400 });
  }
  if (!directorEmail) {
    return NextResponse.json({ success: false, error: "Camp director email is required." }, { status: 400 });
  }
  if (!isValidEmail(directorEmail)) {
    return NextResponse.json({ success: false, error: "That email address does not look valid." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { success: false, error: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (!slug || slug.length < 3) {
    return NextResponse.json(
      { success: false, error: "Pick a link name of at least 3 characters (letters, numbers and hyphens)." },
      { status: 400 }
    );
  }
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json(
      { success: false, error: "Link name may only contain lowercase letters, numbers and single hyphens." },
      { status: 400 }
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json(
      { success: false, error: `"${slug}" is reserved. Please choose a different link name.` },
      { status: 409 }
    );
  }

  // Without a service-role key this route cannot create an auth user or a camp.
  // Say so; do not create half of an account and report success.
  if (!hasServiceRoleKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Account creation is not configured on this deployment (SUPABASE_SERVICE_ROLE_KEY is unset). Nothing was created.",
      },
      { status: 503 }
    );
  }

  let createdUserId: string | null = null;
  let createdCampId: string | null = null;

  try {
    // ---- slug availability ------------------------------------------------
    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from("camps")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (lookupErr) throw lookupErr;
    if (existing) {
      return NextResponse.json(
        { success: false, error: `The link name "${slug}" is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // ---- 1. auth user -----------------------------------------------------
    // email_confirm: true because there is no configured transactional mail
    // provider on this deployment. A confirmation email that never arrives is a
    // locked-out director.
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: directorEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: directorName, camp_name: campName },
    });

    if (userErr || !userData?.user) {
      const msg = (userErr?.message || "").toLowerCase();
      if (msg.includes("already been registered") || msg.includes("already registered") || msg.includes("exists")) {
        return NextResponse.json(
          {
            success: false,
            error: "An account already exists for that email. Sign in instead, then create the camp from your dashboard.",
          },
          { status: 409 }
        );
      }
      throw userErr ?? new Error("Could not create the director account.");
    }
    createdUserId = userData.user.id;

    // ---- 2. camp ----------------------------------------------------------
    const { data: camp, error: insertErr } = await supabaseAdmin
      .from("camps")
      .insert({
        name: campName,
        slug,
        director_name: directorName,
        director_email: directorEmail,
      })
      .select("id, slug")
      .single();

    if (insertErr) {
      // 23505 = unique_violation: the slug was claimed between the lookup and
      // the insert.
      if ((insertErr as { code?: string }).code === "23505") {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        createdUserId = null;
        return NextResponse.json(
          { success: false, error: `The link name "${slug}" was just taken. Please choose another.` },
          { status: 409 }
        );
      }
      throw insertErr;
    }
    createdCampId = camp.id;

    // ---- 3. membership ----------------------------------------------------
    // This row is what actually grants access. A camp without it is invisible
    // to its own director, so a failure here has to unwind steps 1 and 2.
    const { error: memberErr } = await supabaseAdmin.from("camp_members").insert({
      camp_id: camp.id,
      user_id: createdUserId,
      role: "director",
    });

    if (memberErr) throw memberErr;

    // ---- 4. sign the director in -----------------------------------------
    // Uses the request-scoped (cookie-bound) client, not the admin client, so
    // the Set-Cookie headers land on this response.
    let signedIn = false;
    try {
      const supabase = await createServerSupabaseClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: directorEmail,
        password,
      });
      signedIn = !signInErr;
    } catch {
      signedIn = false;
    }

    await notifyInbound({
      kind: "camp_signup",
      summary: `New camp provisioned: ${campName} (${directorName}, ${directorEmail}) at /c/${slug}`,
      details: {
        camp_id: camp.id,
        camp_name: campName,
        director_name: directorName,
        director_email: directorEmail,
        slug,
        user_id: createdUserId,
      },
    });

    return NextResponse.json({
      success: true,
      message: signedIn
        ? "Camp created and you are signed in."
        : "Camp created. Sign in with the email and password you just chose.",
      campId: camp.id,
      slug: camp.slug,
      signedIn,
    });
  } catch (err: unknown) {
    // ---- compensating rollback -------------------------------------------
    // Best effort, most-recent-first. Failures here are logged, not swallowed
    // silently, because they leave an orphan that a human has to clear.
    if (createdCampId) {
      const { error: cleanupErr } = await supabaseAdmin.from("camps").delete().eq("id", createdCampId);
      if (cleanupErr) console.error("Signup rollback: could not delete camp", createdCampId, cleanupErr);
    }
    if (createdUserId) {
      const { error: cleanupErr } = await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      if (cleanupErr) console.error("Signup rollback: could not delete user", createdUserId, cleanupErr);
    }

    if (isSetupIncompleteError(err)) {
      console.error("Camp Signup Error (migrations not applied):", err);
      return setupIncompleteResponse(err);
    }

    console.error("Camp Signup Error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          (err as { message?: string })?.message ||
          "Could not create your camp. Nothing was saved. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * Public camp lookup: GET /api/camps?slug=<slug>
 *
 * Returns only a camp's public identity (name + slug) so the registration and
 * volunteer forms can show the family which camp they are actually submitting
 * to. No camper, guardian, health or insurance data is reachable from here, and
 * the director's email is deliberately not returned.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = normalizeSlug(str(searchParams.get("slug")));

  if (!slug) {
    return NextResponse.json({ success: false, error: "Missing slug." }, { status: 400 });
  }

  const lookup = await lookupCampBySlug(slug);

  if (lookup.status === "setup_incomplete") return setupIncompleteResponse(new Error(lookup.message));
  if (lookup.status === "error") {
    return NextResponse.json({ success: false, error: "Camp lookup failed." }, { status: 500 });
  }
  if (lookup.status === "not_found") {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    camp: { name: lookup.camp.name, slug: lookup.camp.slug },
  });
}
