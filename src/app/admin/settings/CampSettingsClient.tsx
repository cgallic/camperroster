"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge, Button, Notice, Panel, inputClass } from "@/components/ui";
import {
  MAX_GRADE,
  MIN_GRADE,
  TIER_CAMPER_COUNTS,
  centsToDollars,
  gradeLabel,
} from "@/lib/camp-settings";
import { formatCents } from "@/lib/pricing";
import {
  createSeason,
  createSession,
  saveCampDetails,
  savePricingTiers,
  setActiveSeason,
  setSessionActive,
  updateSeason,
  updateSession,
  type ActionResult,
} from "./actions";

type Season = {
  id: string;
  year: number;
  name: string;
  forms_due_on: string;
  early_rate_ends_on: string;
  is_active: boolean;
};

type Session = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  min_grade: number;
  max_grade: number;
  capacity: number;
  price_cents: number;
  deposit_cents: number;
  is_active: boolean;
  registrations: number;
};

export type SettingsData = {
  camp: {
    name: string;
    slug: string;
    location: string | null;
    director_name: string;
    director_email: string;
    director_phone: string | null;
    logo_url: string | null;
    primary_color: string | null;
  };
  seasons: Season[];
  sessions: Session[];
  activeSeasonId: string | null;
  tiers: { camper_count: number; early_cents: number; regular_cents: number }[];
};

const field = `${inputClass} mt-1 w-full text-base sm:text-sm`;
const labelClass = "block text-xs font-bold text-stone-800";

/** One pending flag and one notice per form; refreshes server data on success. */
function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (action: () => Promise<ActionResult>, onSuccess?: () => void) =>
    startTransition(async () => {
      setResult(null);
      try {
        const next = await action();
        setResult(next);
        if (next.ok) {
          onSuccess?.();
          router.refresh();
        }
      } catch {
        setResult({ ok: false, message: "The change could not be sent. Check your connection and try again." });
      }
    });
  const notice = result ? <Notice tone={result.ok ? "ok" : "error"}>{result.message}</Notice> : null;
  return { pending, run, notice };
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// Camp details ----------------------------------------------------------------------

function CampDetailsPanel({ camp }: { camp: SettingsData["camp"] }) {
  const { pending, run, notice } = useAction();
  const [form, setForm] = useState({
    name: camp.name,
    location: camp.location ?? "",
    director_name: camp.director_name,
    director_email: camp.director_email,
    director_phone: camp.director_phone ?? "",
    logo_url: camp.logo_url ?? "",
    primary_color: camp.primary_color ?? "",
  });
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const colorValid = /^#[0-9a-f]{6}$/i.test(form.primary_color);

  return (
    <Panel title="Camp details" description="What families see on your registration pages and emails.">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => saveCampDetails(form));
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Camp name<input required value={form.name} onChange={set("name")} className={field} /></label>
          <label className={labelClass}>Location<input value={form.location} onChange={set("location")} placeholder="City, State" className={field} /></label>
          <label className={labelClass}>Director name<input required value={form.director_name} onChange={set("director_name")} className={field} /></label>
          <label className={labelClass}>Director email<input required type="email" value={form.director_email} onChange={set("director_email")} className={field} /></label>
          <label className={labelClass}>Director phone<input type="tel" value={form.director_phone} onChange={set("director_phone")} className={field} /></label>
          <label className={labelClass}>Logo URL<input type="url" value={form.logo_url} onChange={set("logo_url")} placeholder="https://…" className={field} /></label>
          <div className={labelClass}>
            <label htmlFor="primary_color">Brand colour</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick brand colour"
                value={colorValid ? form.primary_color : "#1c3b2f"}
                onChange={set("primary_color")}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-200 bg-white p-1"
              />
              <input id="primary_color" value={form.primary_color} onChange={set("primary_color")} placeholder="#1c3b2f" className={`${inputClass} w-full text-base sm:text-sm`} />
            </div>
          </div>
          <div className={labelClass}>
            Web address
            <p className="mt-1 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 font-mono text-sm font-normal text-stone-600">/{camp.slug}</p>
            <p className="mt-1 text-[11px] font-normal text-stone-500">Fixed, because families already have links to it.</p>
          </div>
        </div>
        {form.logo_url && /^https:\/\//i.test(form.logo_url) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.logo_url} alt="Logo preview" className="h-12 w-auto rounded border border-stone-100" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : "Save camp details"}</Button>
        </div>
        {notice}
      </form>
    </Panel>
  );
}

// Seasons ----------------------------------------------------------------------------

type SeasonForm = { year: string; name: string; forms_due_on: string; early_rate_ends_on: string };

function SeasonFields({ value, onChange }: { value: SeasonForm; onChange: (next: SeasonForm) => void }) {
  const set = (key: keyof SeasonForm) => (event: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: event.target.value });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className={labelClass}>Year<input required inputMode="numeric" value={value.year} onChange={set("year")} className={field} /></label>
      <label className={labelClass}>Name<input required value={value.name} onChange={set("name")} placeholder="Summer 2027" className={field} /></label>
      <label className={labelClass}>
        Forms due
        <input required type="date" value={value.forms_due_on} onChange={set("forms_due_on")} className={field} />
        <span className="mt-1 block text-[11px] font-normal text-stone-500">After this, unfinished registrations show as overdue.</span>
      </label>
      <label className={labelClass}>
        Early-bird price ends
        <input required type="date" value={value.early_rate_ends_on} onChange={set("early_rate_ends_on")} className={field} />
        <span className="mt-1 block text-[11px] font-normal text-stone-500">Families registering on or after this date pay the regular price.</span>
      </label>
    </div>
  );
}

function SeasonRow({ season }: { season: Season }) {
  const { pending, run, notice } = useAction();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SeasonForm>({
    year: String(season.year),
    name: season.name,
    forms_due_on: season.forms_due_on,
    early_rate_ends_on: season.early_rate_ends_on,
  });

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm text-stone-900">{season.name}</b>
            {season.is_active && <Badge tone="complete">Active</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-stone-600">
            Forms due {formatDate(season.forms_due_on)} · early-bird until {formatDate(season.early_rate_ends_on)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!season.is_active && (
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() => {
                if (window.confirm(`Make ${season.name} the active season? Registration, forms and invoices will switch to it.`)) {
                  run(() => setActiveSeason(season.id));
                }
              }}
            >
              Make active
            </Button>
          )}
          <Button size="sm" disabled={pending} onClick={() => setEditing((v) => !v)}>{editing ? "Close" : "Edit"}</Button>
        </div>
      </div>
      {editing && (
        <form
          className="space-y-3 rounded-xl border border-stone-100 bg-stone-50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => updateSeason(season.id, form), () => setEditing(false));
          }}
        >
          <SeasonFields value={form} onChange={setForm} />
          <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : "Save season"}</Button>
        </form>
      )}
      {notice}
    </div>
  );
}

function SeasonsPanel({ seasons }: { seasons: Season[] }) {
  const { pending, run, notice } = useAction();
  const [adding, setAdding] = useState(seasons.length === 0);
  const nextYear = (seasons[0]?.year ?? new Date().getFullYear()) + 1;
  const blank: SeasonForm = { year: String(nextYear), name: `Summer ${nextYear}`, forms_due_on: "", early_rate_ends_on: "" };
  const [form, setForm] = useState<SeasonForm>(blank);

  return (
    <Panel
      title="Seasons"
      description="One season is active at a time. Registration, forms and invoices all use the active season."
      actions={!adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" />New season</Button>}
      bodyClassName="p-0"
    >
      <div className="divide-y divide-stone-100">
        {seasons.map((season) => <SeasonRow key={season.id} season={season} />)}
        {seasons.length === 0 && <p className="p-4 text-sm text-stone-500">No seasons yet. Add your first one below.</p>}
        {adding && (
          <form
            className="space-y-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => createSeason(form), () => { setForm(blank); setAdding(false); });
            }}
          >
            <h3 className="text-sm font-black text-stone-900">New season</h3>
            <SeasonFields value={form} onChange={setForm} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={pending}>{pending ? "Adding…" : "Add season"}</Button>
              {seasons.length > 0 && <Button type="button" variant="quiet" onClick={() => setAdding(false)}>Cancel</Button>}
            </div>
          </form>
        )}
      </div>
      {notice && <div className="px-4 pb-4">{notice}</div>}
    </Panel>
  );
}

// Sessions ----------------------------------------------------------------------------

type SessionForm = {
  name: string;
  start_date: string;
  end_date: string;
  min_grade: string;
  max_grade: string;
  capacity: string;
  price: string;
  deposit: string;
};

const GRADES = Array.from({ length: MAX_GRADE - MIN_GRADE + 1 }, (_, i) => MIN_GRADE + i);

function SessionFields({ value, onChange }: { value: SessionForm; onChange: (next: SessionForm) => void }) {
  const set = (key: keyof SessionForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [key]: event.target.value });
  const gradeSelect = (key: "min_grade" | "max_grade", label: string) => (
    <label className={labelClass}>
      {label}
      <select value={value[key]} onChange={set(key)} className={field}>
        {GRADES.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
      </select>
    </label>
  );
  const dollars = (key: "price" | "deposit", label: string) => (
    <label className={labelClass}>
      {label}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-stone-500">$</span>
        <input required inputMode="decimal" value={value[key]} onChange={set(key)} className={`${field} pl-6`} />
      </div>
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className={`${labelClass} sm:col-span-2`}>Session name<input required value={value.name} onChange={set("name")} placeholder="Week 1" className={field} /></label>
      <label className={labelClass}>Starts<input required type="date" value={value.start_date} onChange={set("start_date")} className={field} /></label>
      <label className={labelClass}>Ends<input required type="date" value={value.end_date} onChange={set("end_date")} className={field} /></label>
      {gradeSelect("min_grade", "Lowest grade")}
      {gradeSelect("max_grade", "Highest grade")}
      <label className={labelClass}>Capacity (campers)<input required inputMode="numeric" value={value.capacity} onChange={set("capacity")} className={field} /></label>
      <div className="hidden sm:block" />
      {dollars("price", "Price")}
      {dollars("deposit", "Deposit")}
    </div>
  );
}

function sessionToForm(session: Session): SessionForm {
  return {
    name: session.name,
    start_date: session.start_date,
    end_date: session.end_date,
    min_grade: String(session.min_grade),
    max_grade: String(session.max_grade),
    capacity: String(session.capacity),
    price: centsToDollars(session.price_cents),
    deposit: centsToDollars(session.deposit_cents),
  };
}

function SessionRow({ session }: { session: Session }) {
  const { pending, run, notice } = useAction();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SessionForm>(() => sessionToForm(session));

  return (
    <div className={`space-y-3 p-4 ${session.is_active ? "" : "bg-stone-50"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm text-stone-900">{session.name}</b>
            {!session.is_active && <Badge tone="neutral">Switched off</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-stone-600">
            {formatDate(session.start_date)} – {formatDate(session.end_date)} · grades {gradeLabel(session.min_grade)}–{gradeLabel(session.max_grade)}
          </p>
          <p className="text-xs text-stone-600">
            {formatCents(session.price_cents)} · deposit {formatCents(session.deposit_cents)} · {session.registrations}/{session.capacity} registered
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={pending} onClick={() => { setForm(sessionToForm(session)); setEditing((v) => !v); }}>{editing ? "Close" : "Edit"}</Button>
          {session.is_active ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (window.confirm(`Switch off ${session.name}? Families can no longer choose it. Its ${session.registrations} registration(s) are kept.`)) {
                  run(() => setSessionActive(session.id, false));
                }
              }}
            >
              Switch off
            </Button>
          ) : (
            <Button size="sm" disabled={pending} onClick={() => run(() => setSessionActive(session.id, true))}>Switch back on</Button>
          )}
        </div>
      </div>
      {editing && (
        <form
          className="space-y-3 rounded-xl border border-stone-100 bg-white p-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => updateSession(session.id, form), () => setEditing(false));
          }}
        >
          <SessionFields value={form} onChange={setForm} />
          <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : "Save session"}</Button>
        </form>
      )}
      {notice}
    </div>
  );
}

function SessionsPanel({ sessions }: { sessions: Session[] }) {
  const { pending, run, notice } = useAction();
  const [adding, setAdding] = useState(sessions.length === 0);
  const blank: SessionForm = { name: "", start_date: "", end_date: "", min_grade: "0", max_grade: "12", capacity: "0", price: "", deposit: "0.00" };
  const [form, setForm] = useState<SessionForm>(blank);

  return (
    <Panel
      title="Sessions"
      description="The weeks or programs families register for. Sessions with registrations are switched off, not deleted."
      actions={!adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" />New session</Button>}
      bodyClassName="p-0"
    >
      <div className="divide-y divide-stone-100">
        {sessions.map((session) => <SessionRow key={session.id} session={session} />)}
        {sessions.length === 0 && <p className="p-4 text-sm text-stone-500">No sessions yet. Add your first one below.</p>}
        {adding && (
          <form
            className="space-y-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => createSession(form), () => { setForm(blank); setAdding(false); });
            }}
          >
            <h3 className="text-sm font-black text-stone-900">New session</h3>
            <SessionFields value={form} onChange={setForm} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={pending}>{pending ? "Adding…" : "Add session"}</Button>
              {sessions.length > 0 && <Button type="button" variant="quiet" onClick={() => setAdding(false)}>Cancel</Button>}
            </div>
          </form>
        )}
      </div>
      {notice && <div className="px-4 pb-4">{notice}</div>}
    </Panel>
  );
}

// Pricing tiers -------------------------------------------------------------------------

function PricingPanel({ season, tiers }: { season: Season | null; tiers: SettingsData["tiers"] }) {
  const { pending, run, notice } = useAction();
  const [rows, setRows] = useState(() =>
    TIER_CAMPER_COUNTS.map((count) => {
      const tier = tiers.find((t) => t.camper_count === count);
      return {
        camper_count: count,
        early: tier ? centsToDollars(tier.early_cents) : "",
        regular: tier ? centsToDollars(tier.regular_cents) : "",
      };
    }),
  );

  if (!season) {
    return (
      <Panel title="Family pricing" description="Household tuition by number of campers.">
        <p className="text-sm text-stone-500">Make a season active first. Prices are set per season.</p>
      </Panel>
    );
  }

  const set = (index: number, key: "early" | "regular") => (event: React.ChangeEvent<HTMLInputElement>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: event.target.value } : row)));

  return (
    <Panel
      title={`Family pricing · ${season.name}`}
      description={`Total tuition for the whole household. Early-bird applies before ${formatDate(season.early_rate_ends_on)}.`}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => savePricingTiers(season.id, rows));
        }}
      >
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-2">
          <span className="text-[11px] font-bold uppercase text-stone-500">Campers</span>
          <span className="text-[11px] font-bold uppercase text-stone-500">Early-bird</span>
          <span className="text-[11px] font-bold uppercase text-stone-500">Regular</span>
          {rows.map((row, index) => (
            <div key={row.camper_count} className="contents">
              <span className="text-sm font-bold text-stone-900">{row.camper_count}{row.camper_count === 4 ? "+" : ""}</span>
              {(["early", "regular"] as const).map((key) => (
                <div key={key} className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">$</span>
                  <input
                    required
                    inputMode="decimal"
                    aria-label={`${key === "early" ? "Early-bird" : "Regular"} price for ${row.camper_count} camper${row.camper_count > 1 ? "s" : ""}`}
                    value={row[key]}
                    onChange={set(index, key)}
                    className={`${inputClass} w-full pl-6 text-base sm:text-sm`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-500">
          Families with more than four campers are charged the four-camper rate unless you set a custom total on their invoice.
          Invoices already created keep the price they were given.
        </p>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : "Save pricing"}</Button>
        {notice}
      </form>
    </Panel>
  );
}

export default function CampSettingsClient({ data }: { data: SettingsData }) {
  const activeSeason = data.seasons.find((s) => s.id === data.activeSeasonId) ?? null;
  return (
    <div className="space-y-6">
      <CampDetailsPanel camp={data.camp} />
      <SeasonsPanel seasons={data.seasons} />
      <PricingPanel key={activeSeason?.id ?? "none"} season={activeSeason} tiers={data.tiers} />
      <SessionsPanel sessions={data.sessions} />
    </div>
  );
}
