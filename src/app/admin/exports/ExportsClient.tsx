"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Lock } from "lucide-react";
import { STATUS_LABELS, TIMING_LABELS, WHO_LABELS } from "@/lib/registration-status";
import {
  Button,
  FilterChip,
  FilterGroup,
  Notice,
  PageHeader,
  Panel,
  PageShell,
  StatCard,
  StatStrip,
  TONE_STYLES,
  selectClass,
  inputClass,
  toneFor,
} from "@/components/ui";

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

  const activeFilters =
    (["who", "population", "status", "grade", "gender", "cabin", "serviceArea", "timing"] as const).reduce(
      (n, key) => n + selection[key].length,
      0,
    ) +
    (selection.missingDocument.trim() ? 1 : 0) +
    (selection.unpaidOnly ? 1 : 0);

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Reports"
        title="Spreadsheets & Lists"
        description={`${seasonYear ? `Season ${seasonYear}.` : "No active season."} ${
          formsDueOn
            ? `Paperwork is due ${formsDueOn} — after that, outstanding registrations read as overdue.`
            : ""
        }`}
      />

      <StatStrip>
        <StatCard
          label="Filters applied"
          value={activeFilters}
          tone={activeFilters > 0 ? "pending" : "neutral"}
          hint={activeFilters === 0 ? "Every workbook covers everybody." : "Each workbook is cut to this selection."}
        />
        <StatCard label="Cabins" value={cabins.length} tone="complete" hint="Available as a filter and a sheet." />
        <StatCard label="Grades in play" value={grades.length} tone="complete" hint="Distinct grades entering camp." />
        <StatCard
          label="Email templates"
          value={templates.length}
          tone={templates.length > 0 ? "complete" : "neutral"}
          hint="Ready to turn this filter into a draft."
        />
      </StatStrip>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="ok">{notice}</Notice>}

      <Panel
        title="Narrow the export"
        description="Every workbook below is built from whatever is selected here. Leave a group empty to include all of it."
      >
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ChipGroup label="Who" options={Object.entries(WHO_LABELS).map(([id, name]) => ({ id, name }))} selected={selection.who} onToggle={(v) => toggle("who", v)} />
            <ChipGroup label="Population" options={POPULATIONS} selected={selection.population} onToggle={(v) => toggle("population", v)} />
            <ChipGroup
              label="Registration status"
              options={Object.entries(STATUS_LABELS).map(([id, name]) => ({ id, name }))}
              selected={selection.status}
              onToggle={(v) => toggle("status", v)}
              colorCoded
            />
            <ChipGroup label="Grade" options={grades.map((g) => ({ id: String(g), name: `Grade ${g}` }))} selected={selection.grade} onToggle={(v) => toggle("grade", v)} />
            <ChipGroup label="Gender" options={genders.map((g) => ({ id: g, name: g }))} selected={selection.gender} onToggle={(v) => toggle("gender", v)} />
            <ChipGroup label="Cabin" options={cabins} selected={selection.cabin} onToggle={(v) => toggle("cabin", v)} />
            <ChipGroup label="Area of service" options={serviceAreas} selected={selection.serviceArea} onToggle={(v) => toggle("serviceArea", v)} />
            <ChipGroup label="Timing" options={Object.entries(TIMING_LABELS).map(([id, name]) => ({ id, name }))} selected={selection.timing} onToggle={(v) => toggle("timing", v)} />

            <div className="space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-stone-500">Missing document</p>
              <input
                value={selection.missingDocument}
                onChange={(e) => setSelection((p) => ({ ...p, missingDocument: e.target.value }))}
                placeholder="e.g. insurance"
                className={inputClass + " w-full"}
              />
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={selection.unpaidOnly}
                  onChange={(e) => setSelection((p) => ({ ...p, unpaidOnly: e.target.checked }))}
                  className="h-4 w-4 accent-forest-800"
                />
                Only those carrying a balance
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3">
            <Button variant="quiet" size="sm" onClick={() => setSelection(EMPTY)}>
              Clear all filters
            </Button>
            <span className="truncate font-mono text-[10px] text-stone-500">
              {query || "no filters — everything is included"}
            </span>
          </div>
        </div>
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => {
          const locked = report === "financial" && !canSeeFinance;
          return (
            <div key={report} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5">
              <div>
                <h3 className="font-display text-base font-bold text-stone-900">{REPORT_META[report].title}</h3>
                <p className="mt-1 text-xs text-stone-500">{REPORT_META[report].description}</p>
              </div>
              <Button
                variant={locked ? "secondary" : "primary"}
                disabled={busy || locked}
                onClick={() => download(report)}
                className="mt-auto w-full py-2.5 text-sm"
              >
                {locked ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {locked ? "Registrars and directors only" : "Download .xlsx"}
              </Button>
            </div>
          );
        })}
      </section>

      <Panel
        title="Email this group"
        description="Turn the filter above into a draft. Nothing sends from here — the draft lands on the review queue with its recipients, its body and a link back to this filter."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              className={selectClass}
            >
              {templates.length === 0 && <option value="">No templates yet</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" disabled={busy} onClick={previewAudience}>
              Preview recipients
            </Button>
            <Button variant="primary" disabled={busy || !templateCode} onClick={createDraft}>
              Create draft for review
            </Button>
            <Link href="/admin/mail" className="text-xs font-semibold text-forest-800 underline underline-offset-2">
              Go to the review queue
            </Link>
          </div>

          {preview && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-800">{preview.audienceLabel}</p>
              <ul className="mt-2 max-h-48 space-y-0.5 overflow-auto text-xs text-stone-600">
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
        </div>
      </Panel>
    </PageShell>
  );
}

/**
 * A labelled row of chips. The registration-status group is colour-coded from
 * the shared taxonomy, so "overdue" is the same red here as on every table.
 */
function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  colorCoded = false,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  colorCoded?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <FilterGroup label={label}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <FilterChip key={o.id} active={on} onClick={() => onToggle(o.id)}>
            <span className="inline-flex items-center gap-1.5">
              {colorCoded && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : TONE_STYLES[toneFor(o.id)].dot}`}
                  aria-hidden
                />
              )}
              {o.name}
            </span>
          </FilterChip>
        );
      })}
    </FilterGroup>
  );
}
