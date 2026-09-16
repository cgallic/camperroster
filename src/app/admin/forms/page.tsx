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
import {
  Badge,
  PageHeader,
  Panel,
  PageShell,
  StatCard,
  StatStrip,
  StatusDot,
} from "@/components/ui";

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

import type { StatusTone } from "@/components/ui";

/** Visibility is a label, not a status — it borrows the shared tones so the page keeps one colour language. */
const VISIBILITY_TONES: Record<string, StatusTone> = {
  public: "complete",
  link_only: "pending",
  closed: "neutral",
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

  const accepting = periods.filter((p) => isPeriodOpen(p)).length;
  const publishedCount = periods.filter((p) =>
    definitions.some((d) => d.period_id === p.id && d.published_at),
  ).length;
  const draftCount = definitions.filter((d) => !d.published_at).length;

  return (
    <>
      <StaffHeader />
      <PageShell width="narrow">
        <PageHeader
          eyebrow="Form builder"
          title="Registration Forms"
          description={
            season ? `${season.name} (${season.year})` : "No active season — set one before building forms."
          }
          actions={
            <Link
              href="/admin"
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              ← Back to Director Hub
            </Link>
          }
        />

        {season && (
          <StatStrip>
            <StatCard label="Registration periods" value={periods.length} tone="neutral" hint="One per audience." />
            <StatCard
              label="Accepting now"
              value={accepting}
              tone={accepting > 0 ? "complete" : "neutral"}
              hint="Open to families this minute."
            />
            <StatCard
              label="Published forms"
              value={publishedCount}
              of={periods.length}
              tone="complete"
              progress={periods.length > 0 ? (publishedCount / periods.length) * 100 : 0}
              progressLabel="of periods have a live form"
            />
            <StatCard
              label="Unpublished drafts"
              value={draftCount}
              tone={draftCount > 0 ? "pending" : "neutral"}
              hint="Edited but not yet live."
            />
          </StatStrip>
        )}

        {!season ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
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
                    className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-forest-600 hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate font-display text-lg font-extrabold text-stone-900">
                          {period.name || AUDIENCE_LABELS[period.audience as FormAudience]}
                        </h2>
                        <p className="mt-0.5 font-mono text-[11px] uppercase text-stone-500">
                          {AUDIENCE_LABELS[period.audience as FormAudience] ?? period.audience}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={VISIBILITY_TONES[period.visibility] ?? "neutral"}>
                          {period.visibility.replace("_", " ")}
                        </Badge>
                        <StatusDot
                          tone={open ? "complete" : "neutral"}
                          label={open ? "Accepting" : "Not accepting"}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-stone-600">
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
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
                  This season has no registration periods yet.
                </div>
              )}
            </div>

            {missing.length > 0 && (
              <Panel title="Add a missing audience" description="Every audience needs its own registration period.">
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
              </Panel>
            )}
          </>
        )}
      </PageShell>
    </>
  );
}
