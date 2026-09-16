import Link from "next/link";
import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import {
  AUDIENCE_LABELS,
  FORM_AUDIENCES,
  isPeriodOpen,
  type FormAudience,
  type RegistrationPeriod,
} from "@/lib/forms";
import NewPeriodButton from "./NewPeriodButton";

export const dynamic = "force-dynamic";

function formatWindow(period: RegistrationPeriod): string {
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
  const from = fmt(period.opens_at);
  const to = fmt(period.closes_at);
  if (!from && !to) return "No dates set";
  if (from && !to) return `Opens ${from}`;
  if (!from && to) return `Closes ${to}`;
  return `${from} – ${to}`;
}

const VISIBILITY_STYLES: Record<string, string> = {
  public: "bg-emerald-100 text-emerald-800 border-emerald-200",
  link_only: "bg-amber-100 text-amber-800 border-amber-200",
  closed: "bg-stone-200 text-stone-700 border-stone-300",
};

export default async function AdminFormsIndexPage() {
  await requireArea("admin", "/admin/forms");
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("id, year, name")
    .eq("is_active", true)
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  const periods: RegistrationPeriod[] = season
    ? ((
        await supabase
          .from("registration_periods")
          .select("*")
          .eq("season_id", season.id)
          .order("audience")
      ).data as RegistrationPeriod[] | null) ?? []
    : [];

  const definitions = periods.length
    ? ((
        await supabase
          .from("form_definitions")
          .select("id, period_id, version, title, published_at")
          .in(
            "period_id",
            periods.map((p) => p.id)
          )
      ).data as { id: string; period_id: string; version: number; title: string; published_at: string | null }[] | null) ?? []
    : [];

  const missing = FORM_AUDIENCES.filter((a) => !periods.some((p) => p.audience === a));

  return (
    <>
      <StaffHeader />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">
              Form Builder
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
              Registration Forms
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              {season ? `${season.name} (${season.year})` : "No active season — set one before building forms."}
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 w-max"
          >
            ← Back to Director Hub
          </Link>
        </div>

        {!season ? (
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-8 text-center text-stone-600">
            No season is marked active. Activate a season to manage its registration forms.
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {periods.map((period) => {
                const forms = definitions.filter((d) => d.period_id === period.id);
                const published = forms.find((d) => d.published_at);
                const draft = forms.find((d) => !d.published_at);
                const open = isPeriodOpen(period);
                return (
                  <Link
                    key={period.id}
                    href={`/admin/forms/${period.id}`}
                    className="block bg-white rounded-2xl border-2 border-stone-200 hover:border-forest-300 hover:shadow-md transition p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="min-w-0">
                        <h2 className="font-display font-black text-lg text-stone-900 truncate">
                          {period.name || AUDIENCE_LABELS[period.audience as FormAudience]}
                        </h2>
                        <p className="text-xs font-mono uppercase text-stone-500 mt-0.5">
                          {AUDIENCE_LABELS[period.audience as FormAudience] ?? period.audience}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            VISIBILITY_STYLES[period.visibility] ?? VISIBILITY_STYLES.closed
                          }`}
                        >
                          {period.visibility.replace("_", " ")}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            open
                              ? "bg-forest-50 text-forest-800 border-forest-100"
                              : "bg-stone-100 text-stone-600 border-stone-200"
                          }`}
                        >
                          {open ? "Accepting" : "Not accepting"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600">
                      <span>{formatWindow(period)}</span>
                      <span>
                        {published
                          ? `Published v${published.version}`
                          : "No published form yet"}
                        {draft ? ` · draft v${draft.version}` : ""}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {periods.length === 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-stone-300 p-8 text-center text-stone-600">
                  This season has no registration periods yet.
                </div>
              )}
            </div>

            {missing.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-stone-200 p-5 space-y-3">
                <h3 className="font-display font-black text-stone-900">Add a missing audience</h3>
                <div className="flex flex-wrap gap-2">
                  {missing.map((audience) => (
                    <NewPeriodButton
                      key={audience}
                      seasonId={season.id}
                      audience={audience}
                      label={AUDIENCE_LABELS[audience]}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
