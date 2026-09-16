"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUS_LABELS, TIMING_LABELS, WHO_LABELS } from "@/lib/registration-status";

/**
 * Deliberately not imported from `@/lib/exports`: that module pulls in ExcelJS,
 * which has no business in a browser bundle. The four keys are stable, so a
 * small copy of the labels is cheaper than shipping a spreadsheet writer.
 */
type ReportKey = "master" | "sortable" | "cabins" | "financial";

const REPORTS: ReportKey[] = ["master", "sortable", "cabins", "financial"];

const REPORT_META: Record<ReportKey, { title: string; filename: string; description: string }> = {
  master: {
    title: "Master Registration",
    filename: "master-registration",
    description:
      "Everything on file for every camper, teen volunteer and adult volunteer, documentation status included.",
  },
  sortable: {
    title: "Sortable Basic Registration",
    filename: "sortable-basic-registration",
    description:
      "Basic information for all three populations, with a column for everything the team sorts by.",
  },
  cabins: {
    title: "Camper Cabin Assignment",
    filename: "camper-cabin-assignment",
    description: "Campers by cabin, with the waitlist and remaining capacity on their own sheets.",
  },
  financial: {
    title: "Financial",
    filename: "financial",
    description:
      "Payment status per family, payments made, financial aid applications, and the have-not-paid-in-full list.",
  },
};

type Option = { id: string; name: string };
type Template = { id: string; code: string; name: string; subject: string; body: string };

type Selection = {
  who: string[];
  population: string[];
  status: string[];
  grade: string[];
  gender: string[];
  cabin: string[];
  serviceArea: string[];
  timing: string[];
  missingDocument: string;
  unpaidOnly: boolean;
};

const EMPTY: Selection = {
  who: [],
  population: [],
  status: [],
  grade: [],
  gender: [],
  cabin: [],
  serviceArea: [],
  timing: [],
  missingDocument: "",
  unpaidOnly: false,
};

const POPULATIONS: Option[] = [
  { id: "camper", name: "Campers" },
  { id: "teen_volunteer", name: "Teen volunteers" },
  { id: "adult_volunteer", name: "Adult volunteers" },
];

const FINANCE_ROLES = ["director", "registrar"];

export default function ExportsClient({
  role,
  cabins,
  serviceAreas,
  grades,
  genders,
  seasonYear,
  formsDueOn,
  templates,
}: {
  role: string;
  cabins: Option[];
  serviceAreas: Option[];
  grades: number[];
  genders: string[];
  seasonYear: number | null;
  formsDueOn: string | null;
  templates: Template[];
}) {
  const [selection, setSelection] = useState<Selection>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ audienceLabel: string; recipients: { email: string; name?: string | null }[] } | null>(null);
  const [templateCode, setTemplateCode] = useState(templates[0]?.code ?? "");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of ["who", "population", "status", "grade", "gender", "cabin", "serviceArea", "timing"] as const) {
      for (const value of selection[key]) params.append(key, value);
    }
    if (selection.missingDocument.trim()) params.set("missingDocument", selection.missingDocument.trim());
    if (selection.unpaidOnly) params.set("unpaidOnly", "1");
    return params.toString();
  }, [selection]);

  const toggle = (key: keyof Selection, value: string) => {
    setSelection((prev) => {
      const current = prev[key] as string[];
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const canSeeFinance = FINANCE_ROLES.includes(role);

  const download = async (report: ReportKey) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/exports/${report}${query ? `?${query}` : ""}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Could not build that workbook");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const named = /filename="([^"]+)"/.exec(disposition)?.[1];
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = named ?? `${REPORT_META[report].filename}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice(`${REPORT_META[report].title} downloaded.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const previewAudience = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/mail/audience?${query}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Could not resolve that list");
      setPreview(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const createDraft = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/mail/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, templateCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Could not build that draft");
      setNotice("Draft created and waiting for review on the mail queue.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
            Reports
          </span>
          <h1 className="font-display font-black text-3xl text-stone-900 mt-2">Spreadsheets &amp; Lists</h1>
          <p className="text-xs text-stone-500 mt-1">
            {seasonYear ? `Season ${seasonYear}.` : "No active season."}{" "}
            {formsDueOn ? `Paperwork is due ${formsDueOn} — after that, outstanding registrations read as overdue.` : ""}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-alert-red-border bg-alert-red-bg px-4 py-3 text-sm text-alert-red">{error}</div>
        )}
        {notice && (
          <div className="rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-800">{notice}</div>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-5">
          <div>
            <h2 className="font-display font-bold text-lg text-stone-900">Narrow the export</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Every workbook below is built from whatever is selected here. Leave a group empty to include all of it.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FilterGroup label="Who" options={Object.entries(WHO_LABELS).map(([id, name]) => ({ id, name }))} selected={selection.who} onToggle={(v) => toggle("who", v)} />
            <FilterGroup label="Population" options={POPULATIONS} selected={selection.population} onToggle={(v) => toggle("population", v)} />
            <FilterGroup label="Registration status" options={Object.entries(STATUS_LABELS).map(([id, name]) => ({ id, name }))} selected={selection.status} onToggle={(v) => toggle("status", v)} />
            <FilterGroup label="Grade" options={grades.map((g) => ({ id: String(g), name: `Grade ${g}` }))} selected={selection.grade} onToggle={(v) => toggle("grade", v)} />
            <FilterGroup label="Gender" options={genders.map((g) => ({ id: g, name: g }))} selected={selection.gender} onToggle={(v) => toggle("gender", v)} />
            <FilterGroup label="Cabin" options={cabins} selected={selection.cabin} onToggle={(v) => toggle("cabin", v)} />
            <FilterGroup label="Area of service" options={serviceAreas} selected={selection.serviceArea} onToggle={(v) => toggle("serviceArea", v)} />
            <FilterGroup label="Timing" options={Object.entries(TIMING_LABELS).map(([id, name]) => ({ id, name }))} selected={selection.timing} onToggle={(v) => toggle("timing", v)} />

            <div className="space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase text-stone-500">Missing document</p>
              <input
                value={selection.missingDocument}
                onChange={(e) => setSelection((p) => ({ ...p, missingDocument: e.target.value }))}
                placeholder="e.g. insurance"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={selection.unpaidOnly}
                  onChange={(e) => setSelection((p) => ({ ...p, unpaidOnly: e.target.checked }))}
                />
                Only those carrying a balance
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setSelection(EMPTY)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-2"
            >
              Clear all filters
            </button>
            <span className="font-mono text-[10px] text-stone-500 truncate">{query || "no filters — everything is included"}</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {REPORTS.map((report) => {
            const locked = report === "financial" && !canSeeFinance;
            return (
              <div key={report} className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-stone-900">{REPORT_META[report].title}</h3>
                  <p className="text-xs text-stone-500 mt-1">{REPORT_META[report].description}</p>
                </div>
                <button
                  disabled={busy || locked}
                  onClick={() => download(report)}
                  className="mt-auto rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-forest-900 disabled:opacity-40"
                >
                  {locked ? "Registrars and directors only" : "Download .xlsx"}
                </button>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-stone-900">Email this group</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Turn the filter above into a draft. Nothing sends from here — the draft lands on the review queue with its
              recipients, its body and a link back to this filter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              {templates.length === 0 && <option value="">No templates yet</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              disabled={busy}
              onClick={previewAudience}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              Preview recipients
            </button>
            <button
              disabled={busy || !templateCode}
              onClick={createDraft}
              className="rounded-lg bg-sun-600 px-4 py-2 text-sm font-bold text-white hover:bg-sun-500 disabled:opacity-40"
            >
              Create draft for review
            </button>
            <Link href="/admin/mail" className="text-xs font-semibold text-forest-800 underline underline-offset-2">
              Go to the review queue
            </Link>
          </div>

          {preview && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-800">{preview.audienceLabel}</p>
              <ul className="mt-2 max-h-48 overflow-auto text-xs text-stone-600 space-y-0.5">
                {preview.recipients.map((r) => (
                  <li key={r.email} className="font-mono">
                    {r.name ? `${r.name} — ` : ""}
                    {r.email}
                  </li>
                ))}
                {preview.recipients.length === 0 && <li>Nobody matches that filter.</li>}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] font-bold uppercase text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() => onToggle(o.id)}
              className={
                on
                  ? "rounded-full border border-forest-700 bg-forest-800 px-2.5 py-1 text-[11px] font-semibold text-white"
                  : "rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:border-stone-300"
              }
            >
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
