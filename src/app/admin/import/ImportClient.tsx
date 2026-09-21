"use client";

import { useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, ShieldAlert } from "lucide-react";

/**
 * Until a real parser and tenant-scoped write route exist, this page must be
 * explicit that selecting a file changes nothing.
 */
export default function ImportClient() {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-forest-700">Data import</p>
          <h1 className="mt-2 font-display text-3xl font-black text-stone-900">Import a roster</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Automated CSV and spreadsheet imports are not available yet. Selecting a file here does not upload,
            parse, or change any camp record.
          </p>
        </div>
        <Link href="/admin/history" className="text-xs font-bold text-forest-800 underline">
          View historical records
        </Link>
      </div>

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-bold">Importer unavailable</h2>
            <p className="mt-1 text-sm leading-6">
              No import API is connected to this screen. Existing historical records remain available and unchanged.
            </p>
          </div>
        </div>
      </section>

      <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-8 text-center hover:border-forest-700">
        <FileSpreadsheet className="h-10 w-10 text-forest-700" aria-hidden="true" />
        <span className="font-bold text-stone-900">{fileName || "Choose a file to identify it locally"}</span>
        <span className="text-xs text-stone-500">The file stays on this device and will not be imported.</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.tsv"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
        />
      </label>
    </main>
  );
}
