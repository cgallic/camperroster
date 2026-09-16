"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, X, Check, RefreshCw, Database } from "lucide-react";

/**
 * Director dashboard.
 *
 * This page no longer talks to Supabase from the browser. It used to query
 * registrations / staff_applications / health_profiles / staff_references with
 * the publishable anon key, unfiltered, which returned every camp's rows to
 * anyone who opened /admin. All reads and the sign-off write now go through
 * /api/admin/*, which resolve the camp from the session and filter by camp_id.
 */

interface OverviewResponse {
  success: boolean;
  camp?: { campId: string; campName: string; slug: string; role: string };
  counts?: { registrations: number; staffApplications: number; allergyFlags: number; references: number };
  health?: any[];
  references?: any[];
  error?: string;
  message?: string;
}

type Blocker = { kind: "setup" | "auth" | "error"; message: string };

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [camp, setCamp] = useState<OverviewResponse["camp"] | null>(null);
  const [counts, setCounts] = useState<OverviewResponse["counts"] | null>(null);
  const [triageItems, setTriageItems] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [approving, setApproving] = useState(false);

  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    setBlocker(null);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const data: OverviewResponse = await res.json().catch(() => ({ success: false }));

      if (!res.ok || !data.success) {
        if (res.status === 503) {
          setBlocker({
            kind: "setup",
            message:
              data.message ||
              "This deployment's database has not been migrated yet. Apply supabase/migrations/0001_tenancy_and_auth.sql.",
          });
        } else if (res.status === 401 || res.status === 403) {
          setBlocker({ kind: "auth", message: data.message || data.error || "You are not signed in." });
        } else {
          setBlocker({ kind: "error", message: data.error || "Could not load the dashboard." });
        }
        setCamp(null);
        setCounts(null);
        setTriageItems([]);
        return;
      }

      setCamp(data.camp ?? null);
      setCounts(data.counts ?? null);

      const items: any[] = [];
      (data.health ?? []).forEach((h: any) => {
        const first = h.campers?.legal_first_name || "";
        const last = h.campers?.legal_last_name || "";
        const name = `${first} ${last}`.trim();
        items.push({
          type: "medical",
          title: name || "Camper record " + String(h.id).slice(0, 8),
          sub: h.campers?.grade_entering ? "Camper • Grade " + h.campers.grade_entering : "Camper",
          badge: "⚠️ Medical Review Needed",
          badgeClass: "bg-alert-red-bg text-alert-red border-alert-red-border",
          detail: h.allergy_details || "Allergy flagged, no detail on record",
          data: h,
        });
      });

      (data.references ?? []).forEach((r: any) => {
        const first = r.staff_applications?.first_name || "";
        const last = r.staff_applications?.last_name || "";
        const name = `${first} ${last}`.trim();
        items.push({
          type: "reference",
          title: name || "Applicant record " + String(r.id).slice(0, 8),
          sub: r.staff_applications?.role_applied ? "Volunteer • " + r.staff_applications.role_applied : "Volunteer",
          badge: "🎙️ KaiCalls Reference Ready",
          badgeClass: "bg-sun-50 text-sun-600 border-sun-100",
          detail:
            (r.reference_name || "Reference") +
            (r.sentiment_score ? " (Score " + r.sentiment_score + "/5.0)" : " (no score yet)"),
          data: r,
        });
      });

      setTriageItems(items);
    } catch (e: any) {
      setBlocker({ kind: "error", message: e?.message || "Network error." });
    } finally {
      setLoading(false);
    }
  }, []);

  const stat = (n: number | null | undefined) => (n === null || n === undefined ? "—" : String(n));

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  const openRecord = (rec: any) => {
    setSelectedRecord(rec);
    setDrawerOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    setApproving(true);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedRecord.type, id: selectedRecord.data.id }),
      });
      const data = await res.json().catch(() => ({ success: false }));

      if (!res.ok || !data.success) {
        alert("Could not save this approval. Nothing was written. Error: " + (data.error || res.status));
        return;
      }

      alert(
        selectedRecord.type === "medical"
          ? "✓ Medical clearance saved."
          : "✓ Counselor reference approval saved."
      );
      setDrawerOpen(false);
      fetchLiveData();
    } finally {
      setApproving(false);
    }
  };

  if (blocker) {
    return (
      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 border-2 border-amber-300 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              {blocker.kind === "setup" ? <Database className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <h1 className="font-display font-black text-2xl text-stone-900">
              {blocker.kind === "setup"
                ? "Database setup incomplete"
                : blocker.kind === "auth"
                  ? "Sign in to see your camp"
                  : "Could not load the dashboard"}
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">{blocker.message}</p>
            {blocker.kind === "setup" && (
              <p className="text-xs text-stone-500 leading-relaxed">
                No numbers are shown because none could be read for your camp. Nothing here is a
                placeholder or another camp&apos;s data — see <code className="font-mono">supabase/README.md</code>{" "}
                for how to apply the migration.
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={fetchLiveData}
                className="px-4 py-2.5 rounded-xl bg-forest-900 text-white font-bold text-xs cursor-pointer"
              >
                Retry
              </button>
              {blocker.kind === "auth" && (
                <Link href="/login?next=/admin" className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              {camp ? `Live data for ${camp.campName} — /c/${camp.slug}` : "Loading your camp…"}
            </span>
            <h1 className="font-display font-black text-3xl text-stone-900 mt-2">Camp Director Command Center</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchLiveData}
              className="px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={"w-3.5 h-3.5 " + (loading ? "animate-spin" : "")} />
              Sync DB
            </button>
            <button
              onClick={() =>
                alert(
                  "Emergency voice blast is not wired up yet — nothing was sent. This button is a placeholder for the KaiCalls all-family broadcast."
                )
              }
              className="px-4 py-2 bg-alert-red hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              Emergency Blast (coming soon)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="double-bezel p-5 space-y-1">
            <span className="text-xs text-stone-500 font-bold">Campers Registered</span>
            <div className="font-display font-black text-3xl text-stone-900">{stat(counts?.registrations)}</div>
            <span className="text-xs text-forest-700 font-semibold">Rows in registrations for this camp</span>
          </div>

          <div className="double-bezel p-5 space-y-1">
            <span className="text-xs text-stone-500 font-bold">Volunteers in Pipeline</span>
            <div className="font-display font-black text-3xl text-stone-900">{stat(counts?.staffApplications)}</div>
            <span className="text-xs text-forest-700 font-semibold">Rows in staff_applications for this camp</span>
          </div>

          <div className="bg-alert-red-bg border border-alert-red-border rounded-2xl p-5 space-y-1">
            <span className="text-xs text-alert-red font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Needs Attention
            </span>
            <div className="font-display font-black text-3xl text-red-950">{loading ? "—" : triageItems.length}</div>
            <span className="text-xs text-alert-red font-semibold">Records in the triage queue</span>
          </div>

          <div className="double-bezel p-5 space-y-1">
            <span className="text-xs text-stone-500 font-bold">Allergy Flags on File</span>
            <div className="font-display font-black text-3xl text-stone-900">{stat(counts?.allergyFlags)}</div>
            <span className="text-xs text-forest-700 font-semibold">
              {counts ? `${counts.references} reference calls to review` : "Health profiles flagged"}
            </span>
          </div>
        </div>

        <div className="double-bezel overflow-hidden">
          <div className="p-6 bg-white border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-lg text-stone-900">Priority Triage Queue</h2>
              <p className="text-xs text-stone-500">Live records from your camp requiring director or medical clearance.</p>
            </div>
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
              {camp ? camp.role : "—"}
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {!loading && triageItems.length === 0 && (
              <div className="p-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center mx-auto border border-forest-100">
                  <Check className="w-6 h-6" />
                </div>
                <b className="block text-sm font-extrabold text-stone-900">Nothing in the queue</b>
                <p className="text-stone-500 text-[11px] max-w-sm mx-auto leading-relaxed">
                  No health profiles or staff references in your camp are currently waiting on a director sign-off. New records appear here as families and volunteers submit them.
                </p>
              </div>
            )}
            {triageItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => openRecord(item)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors cursor-pointer"
              >
                <div>
                  <b className="text-sm font-extrabold text-stone-900 block">{item.title}</b>
                  <span className="text-stone-500 text-[11px]">{item.sub}</span>
                </div>
                <span className={"font-mono text-[11px] font-bold px-2.5 py-1 rounded-full border w-max " + item.badgeClass}>
                  {item.badge}
                </span>
                <span className="text-stone-600">{item.detail}</span>
                <button className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-white text-stone-800 font-bold text-xs">
                  Review Record →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {drawerOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <b className="font-display font-extrabold text-lg text-stone-900">
                  {selectedRecord.type === "medical" ? "Medical Clearance Review" : "KaiCalls Voice Interview"}
                </b>
                <button onClick={() => setDrawerOpen(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedRecord.type === "medical" ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-alert-red-bg p-4 rounded-xl border border-alert-red-border space-y-1">
                    <b className="text-alert-red text-sm">⚠️ {selectedRecord.data.allergy_details || "Allergy flagged, no detail on record"}</b>
                    <p className="text-stone-700">
                      {selectedRecord.data.has_epipen
                        ? "EpiPen on file" + (selectedRecord.data.epipen_location ? " — stored: " + selectedRecord.data.epipen_location : " — no storage location recorded")
                        : "No EpiPen recorded for this camper."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div><b>Camper:</b> {selectedRecord.title}</div>
                    <div><b>Record:</b> {selectedRecord.sub}</div>
                    <div><b>Database Record ID:</b> <span className="font-mono text-[11px] text-stone-500">{selectedRecord.data.id}</span></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="bg-sun-50 p-4 rounded-xl border border-sun-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <b className="text-sun-700">🎙️ {selectedRecord.data.reference_name || "Reference"} {selectedRecord.data.relationship ? "(" + selectedRecord.data.relationship + ")" : ""}</b>
                      <span className="font-mono text-[10px] font-bold bg-white text-forest-800 px-2 py-0.5 rounded">
                        {selectedRecord.data.sentiment_score ? "Score: " + selectedRecord.data.sentiment_score + " / 5.0" : "No score yet"}
                      </span>
                    </div>
                    <p className="italic text-stone-700 leading-relaxed">
                      {selectedRecord.data.call_transcript
                        ? `"${selectedRecord.data.call_transcript}"`
                        : "No call transcript on this record yet."}
                    </p>
                  </div>
                  <div><b>Applicant:</b> {selectedRecord.title}</div>
                  <div><b>Phone:</b> {selectedRecord.data.phone || "Not on record"}</div>
                  <div><b>Database Record ID:</b> <span className="font-mono text-[11px] text-stone-500">{selectedRecord.data.id}</span></div>
                </div>
              )}
            </div>

            <button
              onClick={handleApprove}
              disabled={approving}
              className="w-full py-3 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-md transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{approving ? "Saving…" : "Sign Off & Update Supabase Record"}</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
