"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cancelLatestRequest, isCurrentRequest, startLatestRequest } from "@/lib/latest-request";

type RecordRow = { id: string; season_year: number; participant_type: string; first_name: string; last_name: string; source_status: string | null; source_workbook: string; source_sheet: string; source_row: number; source_data?: Record<string, unknown> };

export default function ImportedRecordsPage() {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [camp, setCamp] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    cancelLatestRequest(detailRequest);
    setDetailLoading(false);
    setLoading(true); setError(""); setRows([]); setSelected(null);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/history?${new URLSearchParams({ year, q: search, page: String(page) })}`, { cache: "no-store", signal: abort.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || "Could not load records.");
        setRows(data.records); setTotal(data.total); setCamp(data.campName);
      } catch (e) { if (!abort.signal.aborted) setError((e as Error).message); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [year, search, page]);

  useEffect(() => () => cancelLatestRequest(detailRequest), []);

  async function openRecord(row: RecordRow) {
    const request = startLatestRequest(detailRequest);
    setSelected(null); setDetailLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/history?id=${encodeURIComponent(row.id)}`, { cache: "no-store", signal: request.signal });
      const data = await response.json();
      if (!response.ok || !data.records?.[0]) throw new Error(data.error || "Could not open record.");
      if (isCurrentRequest(detailRequest, request)) setSelected(data.records[0]);
    } catch (e) {
      if (isCurrentRequest(detailRequest, request)) setError((e as Error).message);
    } finally {
      if (isCurrentRequest(detailRequest, request)) {
        detailRequest.current = null;
        setDetailLoading(false);
      }
    }
  }

  return <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
    <Link href="/admin" className="text-sm text-forest-800 underline">Director dashboard</Link>
    <div><p className="text-sm font-bold text-forest-800">{camp}</p><h1 className="font-display font-black text-3xl text-stone-900">Camp records</h1><p className="mt-3 text-stone-600 max-w-3xl">Registration records imported from the 2022–2026 workbooks. These preserve the information in each source file; they do not confirm attendance, payment, or medical clearance.</p></div>
    <div className="flex flex-wrap gap-4 items-end">
      <label className="text-sm font-bold">Year<select className="block mt-1 border rounded-xl p-3 bg-white" value={year} onChange={e => { setYear(e.target.value); setPage(0); }}>{["", "2026", "2025", "2024", "2023", "2022"].map(y => <option key={y} value={y}>{y || "All years"}</option>)}</select></label>
      <label className="text-sm font-bold flex-1 min-w-48">Find a person<input className="block mt-1 w-full border rounded-xl p-3" type="search" placeholder="First or last name" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}</p>}
    {loading ? <p role="status">Loading camp records…</p> : !error && <>
      <p className="text-sm text-stone-600">{total.toLocaleString()} records{total > 0 && ` · Showing ${page * 50 + 1}–${Math.min((page + 1) * 50, total)}`}</p>
      <div className="overflow-x-auto border rounded-2xl bg-white"><table className="w-full text-sm text-left"><thead className="bg-stone-100"><tr>{["Name", "Year", "Registration type", "Source status", "Record"].map(h => <th className="p-4" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row => <tr className="border-t" key={row.id}><td className="p-4 font-bold">{row.first_name} {row.last_name}</td><td className="p-4">{row.season_year}</td><td className="p-4 capitalize">{row.participant_type.replaceAll("_", " ")}</td><td className="p-4">{row.source_status || "Not provided"}</td><td className="p-4"><button className="font-bold text-forest-800 underline whitespace-nowrap" onClick={() => openRecord(row)} disabled={detailLoading}>View details</button></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-6">No matching records.</p>}</div>
      <div className="flex gap-4"><button className="px-4 py-2 rounded-xl border disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button className="px-4 py-2 rounded-xl border disabled:opacity-40" disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)}>Next</button></div>
    </>}
    {detailLoading && <p role="status">Opening record…</p>}
    {selected && <section aria-label="Record details" className="border rounded-2xl bg-white p-6 space-y-4"><div className="flex justify-between gap-4"><h2 className="font-display font-bold text-xl">{selected.first_name} {selected.last_name} · {selected.season_year}</h2><button onClick={() => setSelected(null)} className="underline">Close</button></div><p className="text-xs text-stone-500 break-words">{selected.source_workbook} · {selected.source_sheet} · Row {selected.source_row}</p><dl className="grid sm:grid-cols-2 gap-4">{Object.entries(selected.source_data || {}).filter(([, value]) => value !== null && value !== "").map(([key, value]) => <div key={key} className="border-t pt-3 min-w-0"><dt className="text-xs font-bold text-stone-500">{key}</dt><dd className="text-sm mt-1 whitespace-pre-wrap break-words">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl></section>}
  </main>;
}
