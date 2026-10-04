"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";

import { Badge, Button, Notice, PageHeader, PageShell, Panel, StatCard, StatStrip, selectClass } from "@/components/ui";
import { FilterChip } from "@/components/ui/FilterBar";
import { safeApiMessage } from "@/lib/operations";
import {
  CHUNK_SIZE,
  FIELD_DEFS,
  MAX_FILE_BYTES,
  MAX_ROWS,
  applyMapping,
  chunk,
  guessMapping,
  missingRequiredFields,
  parseCsv,
  sanitizeCell,
  validateRows,
  type FieldGroup,
  type ImportField,
  type Mapping,
  type NormalizedRow,
  type RowIssue,
} from "@/lib/roster-import";

type Step = 1 | 2 | 3 | 4;
type Action = "create" | "update" | "skip" | "error";
type Session = { id: string; name: string; start_date: string; end_date: string; is_active: boolean };
type Sheet = { name: string; rows: string[][] };
type PreviewRow = {
  sourceRow: number;
  action: Action;
  camper: string;
  birthDate: string;
  email: string;
  notes: string[];
  warnings: string[];
};
type CommitTotals = {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  guardians_created: number;
  registrations_created: number;
};

const STEPS = ["Upload", "Map columns", "Preview", "Import"] as const;
const GROUPS: FieldGroup[] = ["Camper", "Guardian", "Health"];
const ACTION_TONE = { create: "complete", update: "waitlisted", skip: "neutral", error: "overdue" } as const;
const ACTION_LABEL: Record<Action, string> = { create: "New", update: "Update", skip: "No change", error: "Error" };
const VISIBLE_ROWS = 200;

async function sha256Hex(data: BufferSource | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const v = value as { result?: unknown; richText?: { text: string }[]; text?: unknown; error?: unknown };
    if (Array.isArray(v.richText)) return v.richText.map((part) => part.text).join("");
    if ("result" in v) return cellText(v.result);
    if (v.text !== undefined) return cellText(v.text);
    if (v.error !== undefined) return "";
  }
  return String(value);
}

async function readWorkbook(buffer: ArrayBuffer): Promise<Sheet[]> {
  const mod: any = await import("exceljs");
  const ExcelJS = mod.default ?? mod;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.worksheets.map((ws: any) => {
    const rows: string[][] = [];
    const width = ws.columnCount as number;
    ws.eachRow({ includeEmpty: false }, (row: any) => {
      const cells: string[] = [];
      for (let c = 1; c <= width; c += 1) cells.push(cellText(row.getCell(c).value));
      if (cells.some((cell) => cell.trim() !== "")) rows.push(cells);
    });
    return { name: ws.name as string, rows };
  });
}

export default function ImportClient() {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState("");
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [mapping, setMapping] = useState<Mapping>([]);
  const [guessed, setGuessed] = useState<Mapping>([]);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [role, setRole] = useState<string>("");
  const [sessionId, setSessionId] = useState("");

  const [validRows, setValidRows] = useState<NormalizedRow[]>([]);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [previewProgress, setPreviewProgress] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<Action | "warnings" | "all">("all");

  const [confirmed, setConfirmed] = useState(false);
  const [commitProgress, setCommitProgress] = useState<[number, number] | null>(null);
  const [totals, setTotals] = useState<CommitTotals | null>(null);
  const [commitWarnings, setCommitWarnings] = useState<RowIssue[]>([]);
  const [completedChunks, setCompletedChunks] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/import", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(safeApiMessage(payload, "Could not load your camp's sessions."));
        if (!active) return;
        setSessions(payload.sessions ?? []);
        setRole(payload.role ?? "");
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Could not load your camp's sessions."));
    return () => {
      active = false;
    };
  }, []);

  const sheet = sheets[sheetIndex];
  const headers = useMemo(() => (sheet?.rows[0] ?? []).map((h) => sanitizeCell(h)), [sheet]);
  const dataRows = useMemo(() => sheet?.rows.slice(1) ?? [], [sheet]);
  const missing = missingRequiredFields(mapping);

  function chooseSheet(index: number, list: Sheet[] = sheets) {
    const rows = list[index]?.rows ?? [];
    const guess = guessMapping((rows[0] ?? []).map((h) => sanitizeCell(h)));
    setSheetIndex(index);
    setMapping(guess);
    setGuessed(guess);
    setError(null);
    if (rows.length - 1 > MAX_ROWS) {
      setError(`This sheet has ${(rows.length - 1).toLocaleString()} rows. Split it into files of ${MAX_ROWS.toLocaleString()} rows or fewer.`);
    } else if (rows.length < 2) {
      setError("This sheet has a header row but no campers under it.");
    }
  }

  async function onFile(file: File | undefined) {
    setError(null);
    setSheets([]);
    setFileName(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is larger than 5 MB. Export only the columns you need, or split it.");
      return;
    }
    const ext = file.name.toLowerCase().split(".").pop();
    if (!["csv", "tsv", "txt", "xlsx"].includes(ext ?? "")) {
      setError("Upload a .csv, .tsv or .xlsx file. Older .xls files need to be re-saved as .xlsx or CSV first.");
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const list: Sheet[] =
        ext === "xlsx"
          ? (await readWorkbook(buffer)).filter((s) => s.rows.length > 0)
          : [{ name: file.name, rows: parseCsv(new TextDecoder("utf-8").decode(buffer), ext === "tsv" ? "\t" : undefined) }];
      if (list.length === 0 || list.every((s) => s.rows.length === 0)) throw new Error("We could not find any rows in that file.");
      setFileHash(await sha256Hex(buffer));
      setFileName(file.name);
      setSheets(list);
      chooseSheet(0, list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That file could not be read.");
    } finally {
      setBusy(false);
    }
  }

  function setField(index: number, field: ImportField | null) {
    setMapping((current) =>
      current.map((value, i) => {
        if (i === index) return field;
        return field && value === field ? null : value;
      }),
    );
  }

  async function post(body: object) {
    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) throw new Error(safeApiMessage(payload, "The import service did not respond."));
    return payload;
  }

  async function runPreview(forSession: string = sessionId) {
    const check = validateRows(applyMapping(dataRows, mapping));
    setValidRows(check.rows);
    setPreview([]);
    setTotals(null);
    setCompletedChunks(0);
    setConfirmed(false);
    setError(null);
    setStep(3);

    const warningsByRow = new Map<number, string[]>();
    for (const w of check.warnings) warningsByRow.set(w.row, [...(warningsByRow.get(w.row) ?? []), w.message]);
    const errorsByRow = new Map<number, string[]>();
    for (const e of check.errors) errorsByRow.set(e.row, [...(errorsByRow.get(e.row) ?? []), e.message]);

    const raw = applyMapping(dataRows, mapping);
    const out: PreviewRow[] = [];
    for (const [row, messages] of errorsByRow) {
      const r = raw[row - 2] ?? {};
      out.push({
        sourceRow: row,
        action: "error",
        camper: [r.camper_first_name, r.camper_last_name].filter(Boolean).join(" ") || "—",
        birthDate: r.camper_birth_date ?? "",
        email: r.guardian_email ?? "",
        notes: messages,
        warnings: warningsByRow.get(row) ?? [],
      });
    }

    const parts = chunk(check.rows, CHUNK_SIZE);
    setBusy(true);
    try {
      for (let i = 0; i < parts.length; i += 1) {
        setPreviewProgress([i, parts.length]);
        const payload = await post({
          mode: "dry_run",
          sessionId: forSession || undefined,
          idempotencyKey: `preview:${fileHash.slice(0, 32)}:${i}`,
          sourceName: fileName ?? "roster",
          rows: parts[i],
        });
        const bySource = new Map<number, NormalizedRow>(parts[i].map((r) => [r.source_row, r]));
        for (const result of payload.rows as { source_row: number; action: Action; notes: string[] }[]) {
          const r = bySource.get(result.source_row)!;
          out.push({
            sourceRow: result.source_row,
            action: result.action,
            camper: `${r.camper_first_name} ${r.camper_last_name}`,
            birthDate: r.camper_birth_date,
            email: r.guardian_email,
            notes: result.notes,
            warnings: warningsByRow.get(result.source_row) ?? [],
          });
        }
      }
      setPreviewProgress([parts.length, parts.length]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      out.sort((a, b) => a.sourceRow - b.sourceRow);
      setPreview(out);
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!confirmed || validRows.length === 0) return;
    setStep(4);
    setBusy(true);
    setError(null);
    const parts = chunk(validRows, CHUNK_SIZE);
    // The key covers the file, the mapping and the session, so re-running the
    // same import replays instead of duplicating, but a corrected mapping is new.
    const runHash = await sha256Hex(`${fileHash}|${sheet?.name ?? ""}|${JSON.stringify(mapping)}|${sessionId}`);
    const sum: CommitTotals = {
      ...(totals ?? { created: 0, updated: 0, skipped: 0, errors: 0, guardians_created: 0, registrations_created: 0 }),
    };
    const warnings: RowIssue[] = [...commitWarnings];
    try {
      for (let i = completedChunks; i < parts.length; i += 1) {
        setCommitProgress([i, parts.length]);
        const payload = await post({
          mode: "commit",
          sessionId: sessionId || undefined,
          idempotencyKey: `${runHash}:${i}`,
          sourceName: fileName ?? "roster",
          rows: parts[i],
        });
        const result = payload.result as CommitTotals & {
          rows: { source_row: number; action: string; warnings?: string[]; message?: string }[];
        };
        for (const key of Object.keys(sum) as (keyof CommitTotals)[]) sum[key] += Number(result[key] ?? 0);
        for (const row of result.rows ?? []) {
          if (row.message) warnings.push({ row: row.source_row, field: null, message: row.message });
          for (const message of row.warnings ?? []) {
            if (message.startsWith("Health details skipped")) warnings.push({ row: row.source_row, field: null, message });
          }
        }
        setCompletedChunks(i + 1);
        setTotals({ ...sum });
        setCommitWarnings([...warnings]);
      }
      setCommitProgress([parts.length, parts.length]);
    } catch (err) {
      setError(
        `${err instanceof Error ? err.message : "Import failed."} Chunks already imported are saved; retrying continues where this stopped.`,
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep(1);
    setSheets([]);
    setFileName(null);
    setFileHash("");
    setMapping([]);
    setPreview([]);
    setValidRows([]);
    setTotals(null);
    setCommitWarnings([]);
    setCompletedChunks(0);
    setCommitProgress(null);
    setPreviewProgress(null);
    setConfirmed(false);
    setError(null);
  }

  const counts = useMemo(() => {
    const c: Record<Action, number> = { create: 0, update: 0, skip: 0, error: 0 };
    for (const row of preview) c[row.action] += 1;
    return c;
  }, [preview]);
  const filtered = preview.filter((row) =>
    filter === "all" ? true : filter === "warnings" ? row.warnings.length > 0 : row.action === filter,
  );
  const warningCount = preview.filter((row) => row.warnings.length > 0).length;
  const sessionName = sessions.find((s) => s.id === sessionId)?.name;

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Data import"
        title="Import a roster"
        description="Upload a CSV or Excel export from UltraCamp, CampMinder, CampBrain or a Google Form, match its columns to ours, check the preview, then import. Existing families and campers are matched, not duplicated."
        actions={
          <Link href="/admin/history" className="text-xs font-bold text-forest-800 underline">
            View historical records
          </Link>
        }
      />

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((label, index) => {
          const n = (index + 1) as Step;
          return (
            <li
              key={label}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                n === step
                  ? "border-forest-700 bg-forest-50 text-forest-900"
                  : n < step
                    ? "border-stone-200 bg-white text-stone-600"
                    : "border-stone-200 bg-stone-50 text-stone-400"
              }`}
            >
              <span className="font-mono">{n}.</span> {label}
            </li>
          );
        })}
      </ol>

      {error && <Notice tone="error">{error}</Notice>}

      {step === 1 && (
        <Panel title="Upload your export" description=".csv, .tsv or .xlsx, up to 5 MB and 5,000 rows. The first row must be the column headers.">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-8 text-center hover:border-forest-700">
            {busy ? (
              <Loader2 className="h-10 w-10 animate-spin text-forest-700" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="h-10 w-10 text-forest-700" aria-hidden="true" />
            )}
            <span className="font-bold text-stone-900">{fileName || "Choose a file"}</span>
            <span className="text-xs text-stone-500">The file is read in your browser. Nothing is saved until you confirm the import.</span>
            <input
              type="file"
              accept=".csv,.tsv,.txt,.xlsx"
              className="sr-only"
              disabled={busy}
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
          </label>

          {sheets.length > 1 && (
            <label className="mt-4 flex items-center gap-2 text-xs font-bold text-stone-700">
              Sheet
              <select className={selectClass} value={sheetIndex} onChange={(e) => chooseSheet(Number(e.target.value))}>
                {sheets.map((s, i) => (
                  <option key={s.name + i} value={i}>
                    {s.name} ({Math.max(0, s.rows.length - 1).toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </label>
          )}

          {sheet && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                {dataRows.length.toLocaleString()} rows and {headers.length} columns found in{" "}
                <span className="font-semibold">{sheet.name}</span>.
              </p>
              <Button
                variant="primary"
                disabled={busy || dataRows.length === 0 || dataRows.length > MAX_ROWS}
                onClick={() => setStep(2)}
              >
                Next: map columns
              </Button>
            </div>
          )}
        </Panel>
      )}

      {step === 2 && (
        <Panel
          title="Match your columns"
          description="We guessed from the header names. Check each one; columns you don't need can be ignored."
          actions={
            <>
              <Button variant="quiet" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" disabled={missing.length > 0} onClick={() => void runPreview()}>
                Next: preview
              </Button>
            </>
          }
        >
          {missing.length > 0 && (
            <p className="mb-3 text-sm font-semibold text-alert-red">
              Still needed:{" "}
              {missing.map((f) => FIELD_DEFS.find((d) => d.key === f)?.label).join(", ")}
            </p>
          )}
          <div className="divide-y divide-stone-100">
            {headers.map((header, index) => {
              const samples = dataRows
                .map((row) => sanitizeCell(row[index]))
                .filter(Boolean)
                .slice(0, 3);
              const value = mapping[index] ?? "";
              const wasGuessed = value !== "" && guessed[index] === value;
              return (
                <div key={index} className="grid gap-2 py-3 sm:grid-cols-[1fr_16rem] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-900">{header || `Column ${index + 1}`}</p>
                    <p className="truncate text-xs text-stone-500">{samples.length ? samples.join(" · ") : "No values"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Field for ${header || `column ${index + 1}`}`}
                      className={`${selectClass} w-full`}
                      value={value}
                      onChange={(e) => setField(index, (e.target.value || null) as ImportField | null)}
                    >
                      <option value="">Ignore this column</option>
                      {GROUPS.map((group) => (
                        <optgroup key={group} label={group}>
                          {FIELD_DEFS.filter((f) => f.group === group).map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                              {f.required ? " (required)" : ""}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {wasGuessed && <Badge tone="neutral">guessed</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {step === 3 && (
        <>
          <Panel
            title="Preview"
            description="Nothing has been saved yet. Rows are matched to existing guardians by email and to existing campers by name and birth date."
            actions={
              <Button variant="quiet" disabled={busy} onClick={() => setStep(2)}>
                Back to mapping
              </Button>
            }
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-stone-700">
                Also register everyone into a session (optional)
                <select
                  className={selectClass}
                  value={sessionId}
                  disabled={busy}
                  onChange={(e) => {
                    setSessionId(e.target.value);
                    void runPreview(e.target.value);
                  }}
                >
                  <option value="">Don&apos;t register, just add to the roster</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_date}){s.is_active ? "" : " · inactive"}
                    </option>
                  ))}
                </select>
              </label>
              <Button disabled={busy} onClick={() => void runPreview()}>
                Refresh preview
              </Button>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Registrations are created without an invoice or payment schedule.
              {role === "registrar" && " Health details are skipped for registrars; a director can import them."}
            </p>
            {previewProgress && busy && (
              <p className="mt-3 flex items-center gap-2 text-sm text-stone-600">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking batch {previewProgress[0] + 1} of {previewProgress[1]}…
              </p>
            )}
          </Panel>

          <StatStrip>
            <StatCard label="New campers" value={counts.create} tone="complete" />
            <StatCard label="Updates" value={counts.update} tone="waitlisted" hint="Matched; blanks filled or registered" />
            <StatCard label="No change" value={counts.skip} tone="neutral" />
            <StatCard label="Errors" value={counts.error} tone="overdue" hint="These rows will not be imported" />
          </StatStrip>

          <div className="flex flex-wrap gap-1.5">
            {(["all", "create", "update", "skip", "error", "warnings"] as const).map((key) => (
              <FilterChip key={key} active={filter === key} onClick={() => setFilter(key)}>
                {key === "all"
                  ? `All (${preview.length})`
                  : key === "warnings"
                    ? `Warnings (${warningCount})`
                    : `${ACTION_LABEL[key]} (${counts[key]})`}
              </FilterChip>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Camper</th>
                  <th className="px-3 py-2">Birth date</th>
                  <th className="px-3 py-2">Guardian email</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.slice(0, VISIBLE_ROWS).map((row) => (
                  <tr key={row.sourceRow} className="align-top">
                    <td className="px-3 py-2 font-mono text-xs text-stone-500">{row.sourceRow}</td>
                    <td className="px-3 py-2">
                      <Badge tone={ACTION_TONE[row.action]}>{ACTION_LABEL[row.action]}</Badge>
                    </td>
                    <td className="px-3 py-2 font-semibold text-stone-900">{row.camper}</td>
                    <td className="px-3 py-2 text-stone-600">{row.birthDate}</td>
                    <td className="px-3 py-2 text-stone-600">{row.email}</td>
                    <td className="px-3 py-2 text-xs">
                      {row.notes.map((n) => (
                        <p key={n} className={row.action === "error" ? "font-semibold text-alert-red" : "text-stone-600"}>
                          {n}
                        </p>
                      ))}
                      {row.warnings.map((w) => (
                        <p key={w} className="text-sun-600">
                          {w}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-stone-500">
                      {busy ? "Checking rows…" : "No rows in this view."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filtered.length > VISIBLE_ROWS && (
              <p className="border-t border-stone-100 px-3 py-2 text-xs text-stone-500">
                Showing the first {VISIBLE_ROWS} of {filtered.length.toLocaleString()} rows in this view.
              </p>
            )}
          </div>

          <Panel title="Import">
            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                disabled={busy}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                Import {validRows.length.toLocaleString()} row{validRows.length === 1 ? "" : "s"}
                {sessionName ? ` and register them into ${sessionName}` : ""}.
                {counts.error > 0 && ` ${counts.error} row${counts.error === 1 ? "" : "s"} with errors will be left out.`}
              </span>
            </label>
            <div className="mt-3 flex justify-end">
              <Button
                variant="primary"
                disabled={!confirmed || busy || validRows.length === 0 || preview.length === 0}
                onClick={() => void runCommit()}
              >
                <Upload className="h-4 w-4" aria-hidden="true" /> Import now
              </Button>
            </div>
          </Panel>
        </>
      )}

      {step === 4 && (
        <Panel title={busy ? "Importing…" : totals && !error ? "Import finished" : "Import stopped"}>
          {commitProgress && (
            <div className="mb-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-forest-600 transition-all"
                  style={{ width: `${Math.round((completedChunks / Math.max(1, commitProgress[1])) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-stone-500">
                {completedChunks} of {commitProgress[1]} batch{commitProgress[1] === 1 ? "" : "es"} saved
              </p>
            </div>
          )}
          {totals && (
            <StatStrip>
              <StatCard label="Campers added" value={totals.created} tone="complete" />
              <StatCard label="Campers updated" value={totals.updated} tone="waitlisted" />
              <StatCard label="Guardians added" value={totals.guardians_created} tone="neutral" />
              <StatCard label="Registrations" value={totals.registrations_created} tone="neutral" />
            </StatStrip>
          )}
          {commitWarnings.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-sun-600">
              {commitWarnings.slice(0, 50).map((w, i) => (
                <li key={`${w.row}-${i}`}>
                  Row {w.row}: {w.message}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {error && !busy && (
              <Button variant="primary" onClick={() => void runCommit()}>
                Retry
              </Button>
            )}
            {!busy && (
              <Button onClick={reset}>
                {totals && !error ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Import another file
                  </>
                ) : (
                  "Start over"
                )}
              </Button>
            )}
          </div>
        </Panel>
      )}
    </PageShell>
  );
}
