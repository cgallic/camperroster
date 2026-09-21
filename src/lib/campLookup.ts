import { supabaseAdmin } from "./supabase";
import { isSetupIncompleteError } from "./auth";

export interface PublicCamp {
  id: string;
  name: string;
  slug: string;
  directorName: string | null;
}

export interface PublicCampSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minGrade: number;
  maxGrade: number;
  priceCents: number;
  depositCents: number;
  capacity: number;
}

export interface PublicCampConfiguration {
  sessions: PublicCampSession[];
  activeSeason: { id: string; name: string; year: number } | null;
}

export type CampLookup =
  | { status: "found"; camp: PublicCamp }
  | { status: "not_found" }
  | { status: "setup_incomplete"; message: string }
  | { status: "error"; message: string };

/**
 * Resolve a camp from its public slug, for UNAUTHENTICATED callers only:
 *   - GET /c/<slug>            (a parent looking at a camp's page)
 *   - POST /api/register       (a parent submitting a registration)
 *   - POST /api/volunteer      (a volunteer applying)
 *
 * SERVICE ROLE is used on purpose. These callers have no account, so RLS has no
 * identity to authorise them with, and migration 0001 deliberately grants the
 * `anon` role nothing. The blast radius is contained by selecting only the four
 * columns below — a camp's name, slug and director name are what the public
 * page already prints. No camper, guardian, health or insurance row is ever
 * reachable from here.
 */
export async function lookupCampBySlug(rawSlug: string): Promise<CampLookup> {
  const slug = (rawSlug || "").trim().toLowerCase();
  if (!slug) return { status: "not_found" };

  try {
    const { data, error } = await supabaseAdmin
      .from("camps")
      .select("id, name, slug, director_name")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (isSetupIncompleteError(error)) {
        return { status: "setup_incomplete", message: error.message };
      }
      return { status: "error", message: error.message };
    }

    if (!data) return { status: "not_found" };

    return {
      status: "found",
      camp: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        directorName: data.director_name ?? null,
      },
    };
  } catch (err) {
    if (isSetupIncompleteError(err)) {
      return { status: "setup_incomplete", message: (err as Error).message };
    }
    return { status: "error", message: (err as Error)?.message || "Camp lookup failed." };
  }
}

/** Public, non-PII configuration used by a camp page and its registration form. */
export async function getPublicCampConfiguration(campId: string): Promise<PublicCampConfiguration> {
  const [{ data: sessionRows, error: sessionError }, { data: seasonRow, error: seasonError }] =
    await Promise.all([
      supabaseAdmin
        .from("camp_sessions")
        .select("id, name, start_date, end_date, min_grade, max_grade, price_cents, deposit_cents, capacity")
        .eq("camp_id", campId)
        .eq("is_active", true)
        .order("start_date", { ascending: true }),
      supabaseAdmin
        .from("seasons")
        .select("id, name, year")
        .eq("camp_id", campId)
        .eq("is_active", true)
        .order("year", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (sessionError) throw sessionError;
  if (seasonError) throw seasonError;

  return {
    sessions: (sessionRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      minGrade: row.min_grade,
      maxGrade: row.max_grade,
      priceCents: row.price_cents,
      depositCents: row.deposit_cents,
      capacity: row.capacity,
    })),
    activeSeason: seasonRow
      ? { id: seasonRow.id, name: seasonRow.name, year: seasonRow.year }
      : null,
  };
}
