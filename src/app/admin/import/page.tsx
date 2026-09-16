"use client";

import { useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Eye, AlertCircle } from "lucide-react";

const MAX_PREVIEW_ROWS = 25;

/** Minimal CSV/TSV line splitter that respects double-quoted fields. */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(field.trim());
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field.trim());
  return out;
}

function parseDelimited(text: string) {
  const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [] as string[], rows: [] as string[][], totalRows: 0 };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map(l => splitLine(l, delimiter));

  return { headers, rows, totalRows: rows.length };
}

export default function RosterColumnMapperPage() {
  const [sourceSystem, setSourceSystem] = useState<"ultracamp" | "google_forms" | "campbrain">("ultracamp");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseError(null);
    setHeaders([]);
    setRows([]);
    setTotalRows(0);
    setFileName(file.name);

    const isSpreadsheet = /\.(xlsx|xls)$/i.test(file.name);
    if (isSpreadsheet) {
      setParseError(
        "This preview reads .csv and .tsv files only. Re-export your roster as CSV (in Excel: File → Save As → CSV) and drop it in again."
      );
      setParsing(false);
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseDelimited(text);

      if (parsed.headers.length === 0 || parsed.totalRows === 0) {
        setParseError("That file had no readable rows. Check that the first line is a header row.");
      } else {
        setHeaders(parsed.headers);
        setRows(parsed.rows.slice(0, MAX_PREVIEW_ROWS));
        setTotalRows(parsed.totalRows);
      }
    } catch (err: any) {
      setParseError("Could not read that file: " + (err?.message || "unknown error"));
    } finally {
      setParsing(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">
            ROSTER COLUMN MAPPER
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
            See how your roster maps before you migrate
          </h1>
        </div>
        <Link href="/admin" className="px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 w-max">
          ← Back to Director Hub
        </Link>
      </div>

      {/* PREVIEW-ONLY NOTICE */}
      <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5">
        <Eye className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <b className="block text-sm font-black text-amber-950">Preview only — nothing is imported or uploaded</b>
          <p className="text-xs text-amber-900 leading-relaxed">
            Your file is read in your own browser so you can check the column mapping. It is never
            sent to our servers and no records are created. When you are ready to actually migrate,
            we run the import with you from this same export.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-xl space-y-6">

        {/* STEP 1: SELECT SOURCE SYSTEM */}
        <div className="space-y-3">
          <label className="text-xs sm:text-sm font-bold text-stone-800">1. Select Current Software or Format</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setSourceSystem("ultracamp")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                sourceSystem === "ultracamp" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
              }`}
            >
              <b className="text-xs sm:text-sm font-black text-stone-900 block">UltraCamp Export</b>
              <span className="text-xs text-stone-500 block mt-1">Direct CSV Export</span>
            </div>
            <div
              onClick={() => setSourceSystem("google_forms")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                sourceSystem === "google_forms" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
              }`}
            >
              <b className="text-xs sm:text-sm font-black text-stone-900 block">Google Sheets / Forms</b>
              <span className="text-xs text-stone-500 block mt-1">Spreadsheet CSV Download</span>
            </div>
            <div
              onClick={() => setSourceSystem("campbrain")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                sourceSystem === "campbrain" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
              }`}
            >
              <b className="text-xs sm:text-sm font-black text-stone-900 block">CampBrain / Active</b>
              <span className="text-xs text-stone-500 block mt-1">Generic Household CSV</span>
            </div>
          </div>
        </div>

        {/* STEP 2: UPLOAD CSV */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold text-stone-800">2. Choose Your Exported CSV File</label>
          <label className="border-2 border-dashed border-stone-300 hover:border-forest-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-emerald-700" />
            <div className="text-center space-y-1">
              <b className="text-sm font-black text-stone-900 block">
                {parsing ? "Reading your file…" : fileName ? fileName : "Drop your roster CSV here, or browse"}
              </b>
              <span className="text-xs text-stone-500 block">Supports .csv and .tsv — read locally, never uploaded</span>
            </div>
            <input
              type="file"
              accept=".csv,.tsv,text/csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>

        {parseError && (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-300 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900 font-semibold leading-relaxed">{parseError}</p>
          </div>
        )}

        {/* STEP 3: PREVIEW OF THE ACTUAL FILE */}
        {headers.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <b className="text-xs sm:text-sm font-black text-stone-900">
                3. Your file: {headers.length} columns, {totalRows} data {totalRows === 1 ? "row" : "rows"}
              </b>
              <span className="text-xs font-bold text-stone-700 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full w-max">
                Showing first {Math.min(totalRows, MAX_PREVIEW_ROWS)}
              </span>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-xl max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 font-bold text-stone-700 border-b border-stone-200 sticky top-0">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="p-3 whitespace-nowrap">{h || <span className="text-stone-400 italic">(unnamed)</span>}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800 font-medium">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      {headers.map((_, ci) => (
                        <td key={ci} className="p-3 whitespace-nowrap">{row[ci] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-700 leading-relaxed">
              <b className="block text-stone-900 mb-1">That is everything this page does.</b>
              These rows were read from your file in this browser tab and were not imported, uploaded,
              or saved. If the columns above look right, your export is in good shape for migration
              day &mdash; bring this same file when you set up your camp.
            </div>

            <Link href="/start" className="btn-primary-agency text-xs py-3 px-6 w-max">
              Start setting up your camp →
            </Link>
          </div>
        )}

      </div>

    </main>
  );
}
