import Link from "next/link";
import StaffHeader from "@/components/StaffHeader";
import { Badge, FilterBar, Notice, PageHeader, PageShell, buttonClass, inputClass, selectClass, type StatusTone } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVITY_AREAS,
  ACTIVITY_PAGE_SIZE,
  actionLabel,
  activityHref,
  actorLabel,
  areaLabel,
  dateBounds,
  describeChanges,
  pageRange,
  parseActivityFilters,
  personMatch,
  type ChangeLine,
} from "@/lib/activity";
import LocalTime from "./LocalTime";

export const dynamic = "force-dynamic";

/** Lines shown before the rest of an entry folds away. */
const VISIBLE_LINES = 4;

const ACTION_TONES: Record<string, StatusTone> = { INSERT: "complete", UPDATE: "pending", DELETE: "overdue" };

/**
 * Who changed what, and when. Reads `audit_log` as the signed-in director, so
 * RLS still decides what is visible; the camp filter is explicit as well so a
 * multi-camp account never sees another camp's history mixed in.
 */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const membership = await requireRole(["director"], "/admin/activity");
  const filters = parseActivityFilters(await searchParams);
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id, table_name, action, actor_email, changed, occurred_at", { count: "exact" })
    .eq("camp_id", membership.campId);
  if (filters.area) query = query.eq("table_name", filters.area);
  const person = personMatch(filters.person);
  if (person.kind === "system") query = query.is("actor_email", null);
  if (person.kind === "ilike") query = query.ilike("actor_email", person.pattern);
  const bounds = dateBounds(filters);
  if (bounds.gte) query = query.gte("occurred_at", bounds.gte);
  if (bounds.lt) query = query.lt("occurred_at", bounds.lt);
  const [start, end] = pageRange(filters.page);

  const [{ data: rows, count, error }, { data: recentActors }] = await Promise.all([
    query.order("occurred_at", { ascending: false }).order("id", { ascending: false }).range(start, end),
    supabase
      .from("audit_log")
      .select("actor_email")
      .eq("camp_id", membership.campId)
      .not("actor_email", "is", null)
      .order("occurred_at", { ascending: false })
      .limit(500),
  ]);

  const entries = rows ?? [];
  const total = count ?? 0;
  const people = [...new Set((recentActors ?? []).map((r) => r.actor_email).filter((e): e is string => !!e))].sort();
  const lastPage = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  const filtered = Boolean(filters.area || filters.person || filters.from || filters.to);

  return (
    <>
      <StaffHeader />
      <PageShell>
        <PageHeader
          eyebrow="Director"
          title="Activity history"
          description="Every change to campers, families, registrations, cabins, staff and team access: who made it and when. Medical, insurance, reference and credential details show which fields changed, never their values."
        />

        <form method="get" action="/admin/activity">
          <FilterBar
            trailing={
              <>
                {filtered && <Link href="/admin/activity" className={buttonClass("quiet")}>Clear</Link>}
                <button type="submit" className={buttonClass("primary")}>Apply</button>
              </>
            }
          >
            <label className="flex w-full flex-col gap-1 text-xs font-bold text-stone-600 sm:w-auto">
              Area
              <select name="area" defaultValue={filters.area ?? ""} className={selectClass}>
                <option value="">All areas</option>
                {Object.entries(ACTIVITY_AREAS).map(([table, label]) => (
                  <option key={table} value={table}>{label}</option>
                ))}
              </select>
            </label>
            <label className="flex w-full flex-col gap-1 text-xs font-bold text-stone-600 sm:w-56">
              Person
              <input
                name="person"
                type="search"
                list="activity-people"
                defaultValue={filters.person}
                placeholder="Email, or System"
                className={inputClass}
              />
              <datalist id="activity-people">
                <option value="System" />
                {people.map((email) => <option key={email} value={email} />)}
              </datalist>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-bold text-stone-600 sm:flex-none">
              From
              <input name="from" type="date" defaultValue={filters.from ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-bold text-stone-600 sm:flex-none">
              To
              <input name="to" type="date" defaultValue={filters.to ?? ""} className={inputClass} />
            </label>
          </FilterBar>
        </form>

        {error ? (
          <Notice tone="error">Could not load activity history. {error.message}</Notice>
        ) : (
          <>
            <p className="text-sm text-stone-600">
              {total.toLocaleString()} {total === 1 ? "change" : "changes"}
              {total > 0 && ` · Showing ${(start + 1).toLocaleString()}–${Math.min(end + 1, total).toLocaleString()}`}
            </p>

            {entries.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
                {filtered ? "No changes match these filters." : "No changes have been recorded yet."}
              </div>
            ) : (
              <ol className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
                {entries.map((entry) => (
                  <li key={entry.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Badge tone={ACTION_TONES[entry.action] ?? "neutral"}>{actionLabel(entry.action)}</Badge>
                      <span className="font-bold text-stone-900">{areaLabel(entry.table_name)}</span>
                      <span className="text-xs text-stone-500 sm:ml-auto">
                        <LocalTime iso={entry.occurred_at} />
                      </span>
                    </div>
                    <p className="mt-1 break-words text-sm text-stone-600">
                      by <span className="font-semibold text-stone-800">{actorLabel(entry.actor_email)}</span>
                    </p>
                    <Changes lines={describeChanges(entry.table_name, entry.action, entry.changed)} />
                  </li>
                ))}
              </ol>
            )}

            {total > ACTIVITY_PAGE_SIZE && (
              <nav aria-label="Pages" className="flex items-center justify-between gap-4">
                <PageLink href={activityHref(filters, { page: filters.page - 1 })} disabled={filters.page <= 1}>Previous</PageLink>
                <span className="text-xs text-stone-500">Page {filters.page} of {lastPage}</span>
                <PageLink href={activityHref(filters, { page: filters.page + 1 })} disabled={filters.page >= lastPage}>Next</PageLink>
              </nav>
            )}
          </>
        )}
      </PageShell>
    </>
  );
}

function Changes({ lines }: { lines: ChangeLine[] }) {
  if (lines.length === 0) return null;
  const shown = lines.slice(0, VISIBLE_LINES);
  const rest = lines.slice(VISIBLE_LINES);
  return (
    <div className="mt-2 text-sm">
      <ChangeList lines={shown} />
      {rest.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs font-bold text-forest-800">
            {rest.length} more {rest.length === 1 ? "field" : "fields"}
          </summary>
          <ChangeList lines={rest} />
        </details>
      )}
    </div>
  );
}

function ChangeList({ lines }: { lines: ChangeLine[] }) {
  return (
    <ul className="space-y-1">
      {lines.map((line) => (
        <li key={line.field} className="flex flex-col gap-x-2 sm:flex-row">
          <span className="shrink-0 font-semibold text-stone-700 sm:w-44">{line.label}</span>
          <span className="min-w-0 break-words text-stone-600">
            {line.redacted ? (
              <span className="italic text-stone-500">hidden for privacy</span>
            ) : line.from !== undefined && line.to !== undefined ? (
              <>
                <span className="line-through decoration-stone-400">{line.from}</span>
                <span aria-label="changed to"> → </span>
                <span className="text-stone-900">{line.to}</span>
              </>
            ) : (
              line.to ?? line.from
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return <span aria-disabled="true" className={buttonClass("secondary", "md", "opacity-40")}>{children}</span>;
  }
  return <Link href={href} className={buttonClass("secondary")}>{children}</Link>;
}
