import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { notifyInbound } from "@/lib/notify";
import type { CampSignupPayload } from "@/lib/formContracts";
import { isValidEmail, normalizeSlug, SLUG_PATTERN } from "@/lib/formContracts";

/**
 * Inbound camp-director signup from /start.
 *
 * Writes to the existing public.camps table. Columns were verified against the
 * live PostgREST schema before this route was written; camps exposes exactly:
 *   id, name, slug, director_name, director_email, created_at
 * Nothing else is written, and no other table is touched.
 *
 * This records a REQUEST. It does not provision a tenant, a subdomain, or a
 * branded registration page — the /start success screen must not claim it did.
 */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Slugs that must never be handed out as a camp namespace. */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "c",
  "canteen",
  "counselor",
  "nurse",
  "portal",
  "pricing",
  "register",
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

  try {
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
      // 23505 = unique_violation: someone claimed the slug between the lookup
      // and the insert.
      if ((insertErr as { code?: string }).code === "23505") {
        return NextResponse.json(
          { success: false, error: `The link name "${slug}" was just taken. Please choose another.` },
          { status: 409 }
        );
      }
      throw insertErr;
    }

    await notifyInbound({
      kind: "camp_signup",
      summary: `New camp signup request: ${campName} (${directorName}, ${directorEmail}) wants /${slug}`,
      details: {
        camp_id: camp.id,
        camp_name: campName,
        director_name: directorName,
        director_email: directorEmail,
        requested_slug: slug,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Signup request received.",
      campId: camp.id,
      slug: camp.slug,
    });
  } catch (err: any) {
    console.error("Camp Signup Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Could not save your request. Please try again." },
      { status: 500 }
    );
  }
}
