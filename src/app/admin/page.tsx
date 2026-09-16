"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, X, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [campersCount, setCampersCount] = useState<number | null>(null);
  const [volsCount, setVolsCount] = useState<number | null>(null);
  const [medicalCount, setMedicalCount] = useState<number | null>(null);
  const [referenceCount, setReferenceCount] = useState<number | null>(null);
  const [triageItems, setTriageItems] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const { count: regCount } = await supabase.from("registrations").select("*", { count: "exact", head: true });
      setCampersCount(regCount ?? 0);

      const { count: volCount } = await supabase.from("staff_applications").select("*", { count: "exact", head: true });
      setVolsCount(volCount ?? 0);

      const { data: healthData } = await supabase
        .from("health_profiles")
        .select("id, camper_id, has_allergies, allergy_details, has_epipen, epipen_location, campers(legal_first_name, legal_last_name, grade_entering)")
        .eq("has_allergies", true);

      const { data: refData } = await supabase
        .from("staff_references")
        .select("id, reference_name, relationship, phone, sentiment_score, call_transcript, staff_applications(first_name, last_name, role_applied)")
        .limit(5);

      const items: any[] = [];
      if (healthData) {
        healthData.forEach((h: any) => {
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
      }

      if (refData) {
        refData.forEach((r: any) => {
          const first = r.staff_applications?.first_name || "";
          const last = r.staff_applications?.last_name || "";
          const name = `${first} ${last}`.trim();
          items.push({
            type: "reference",
            title: name || "Applicant record " + String(r.id).slice(0, 8),
            sub: r.staff_applications?.role_applied ? "Volunteer • " + r.staff_applications.role_applied : "Volunteer",
            badge: "🎙️ KaiCalls Reference Ready",
            badgeClass: "bg-sun-50 text-sun-600 border-sun-100",
            detail: (r.reference_name || "Reference") + (r.sentiment_score ? " (Score " + r.sentiment_score + "/5.0)" : " (no score yet)"),
            data: r,
          });
        });
      }

      setMedicalCount(healthData?.length ?? 0);
      setReferenceCount(refData?.length ?? 0);
      setTriageItems(items);
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const stat = (n: number | null) => (n === null ? "—" : String(n));

  useEffect(() => {
    fetchLiveData();
  }, []);

  const openRecord = (rec: any) => {
    setSelectedRecord(rec);
    setDrawerOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;

    const { error } =
      selectedRecord.type === "medical"
        ? await supabase
            .from("health_profiles")
            .update({ immunization_status: "approved", special_care_notes: "RN approved" })
            .eq("id", selectedRecord.data.id)
        : await supabase
            .from("staff_references")
            .update({ director_reviewed: true })
            .eq("id", selectedRecord.data.id);

    if (error) {
      alert("Could not save this approval. Nothing was written. Error: " + error.message);
      return;
    }

    alert(
      selectedRecord.type === "medical"
        ? "✓ Medical clearance saved."
        : "✓ Counselor reference approval saved."
    );
    setDrawerOpen(false);
    fetchLiveData();
  };

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              Live data from your Supabase project
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
            <div className="font-display font-black text-3xl text-stone-900">{stat(campersCount)}</div>
            <span className="text-xs text-forest-700 font-semibold">Rows in registrations</span>
          </div>

          <div className="double-bezel p-5 space-y-1">
            <span className="text-xs text-stone-500 font-bold">Volunteers in Pipeline</span>
            <div className="font-display font-black text-3xl text-stone-900">{stat(volsCount)}</div>
            <span className="text-xs text-forest-700 font-semibold">Rows in staff_applications</span>
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
            <div className="font-display font-black text-3xl text-stone-900">{stat(medicalCount)}</div>
            <span className="text-xs text-forest-700 font-semibold">
              {referenceCount === null ? "Health profiles flagged" : `${referenceCount} reference calls to review`}
            </span>
          </div>
        </div>

        <div className="double-bezel overflow-hidden">
          <div className="p-6 bg-white border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-lg text-stone-900">Priority Triage Queue</h2>
              <p className="text-xs text-stone-500">Live records from PostgreSQL requiring director or medical clearance.</p>
            </div>
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
              Supabase Connected
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
                  No health profiles or staff references are currently waiting on a director sign-off. New records appear here as families and volunteers submit them.
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
              className="w-full py-3 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-md transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Sign Off & Update Supabase Record</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
