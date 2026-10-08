import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import { PageHeader, PageShell } from "@/components/ui";
import CampSettingsClient, { type SettingsData } from "./CampSettingsClient";

export const dynamic = "force-dynamic";

export default async function CampSettingsPage() {
  const membership = await requireRole(["director"], "/admin/settings");
  const supabase = await createClient();

  const [{ data: camp }, { data: seasons }, { data: sessions }] = await Promise.all([
    supabase
      .from("camps")
      .select("id, name, slug, location, director_name, director_email, director_phone, logo_url, primary_color")
      .eq("id", membership.campId)
      .maybeSingle(),
    supabase
      .from("seasons")
      .select("id, year, name, forms_due_on, early_rate_ends_on, is_active")
      .eq("camp_id", membership.campId)
      .order("year", { ascending: false }),
    supabase
      .from("camp_sessions")
      .select("id, name, start_date, end_date, min_grade, max_grade, capacity, price_cents, deposit_cents, is_active")
      .eq("camp_id", membership.campId)
      .order("start_date"),
  ]);

  const activeSeason = (seasons ?? []).find((s) => s.is_active) ?? null;

  const [{ data: tiers }, registrationCounts] = await Promise.all([
    activeSeason
      ? supabase
          .from("pricing_tiers")
          .select("camper_count, early_cents, regular_cents")
          .eq("camp_id", membership.campId)
          .eq("season_id", activeSeason.id)
          .order("camper_count")
      : Promise.resolve({ data: [] as { camper_count: number; early_cents: number; regular_cents: number }[] }),
    Promise.all(
      (sessions ?? []).map(async (session) => {
        const { count } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id);
        return [session.id, count ?? 0] as const;
      }),
    ),
  ]);

  const counts = Object.fromEntries(registrationCounts);

  const data: SettingsData | null = camp
    ? {
        camp: {
          name: camp.name,
          slug: camp.slug,
          location: camp.location,
          director_name: camp.director_name,
          director_email: camp.director_email,
          director_phone: camp.director_phone,
          logo_url: camp.logo_url,
          primary_color: camp.primary_color,
        },
        seasons: seasons ?? [],
        sessions: (sessions ?? []).map((s) => ({ ...s, is_active: s.is_active !== false, registrations: counts[s.id] ?? 0 })),
        activeSeasonId: activeSeason?.id ?? null,
        tiers: tiers ?? [],
      }
    : null;

  return (
    <>
      <StaffHeader />
      <PageShell width="narrow">
        <PageHeader
          eyebrow="Director only"
          title="Camp settings"
          description="Your camp's details, seasons, sessions and family pricing. Changes take effect right away."
          actions={
            <Link
              href="/admin"
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              ← Back to Director Hub
            </Link>
          }
        />
        {data ? (
          <CampSettingsClient data={data} />
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
            Your camp record could not be loaded. Refresh the page; if it keeps happening, contact support.
          </div>
        )}
      </PageShell>
    </>
  );
}
