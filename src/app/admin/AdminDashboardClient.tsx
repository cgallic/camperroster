"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import Link from "next/link";
import { Check, RefreshCw, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Badge,
  Button,
  buttonClass,
  DataTable,
  Drawer,
  PageHeader,
  Panel,
  PageShell,
  StatCard,
  StatStrip,
  StatusDot,
  type Column,
} from "@/components/ui";
import {
  buildTriageItems,
  campersDisplayCount,
  volsDisplayCount,
  HEALTH_SELECT,
  REFERENCE_SELECT,
  type TriageItem,
} from "./triage";

const CAMPER_TARGET = 100;
const VOLUNTEER_TARGET = 40;

export default function AdminDashboardClient({
  initialCampersCount,
  initialVolsCount,
  initialTriageItems,
}: {
  initialCampersCount: number;
  initialVolsCount: number;
  initialTriageItems: TriageItem[];
}) {
  const [loading, setLoading] = useState(false);
  const [campersCount, setCampersCount] = useState(initialCampersCount);
  const [volsCount, setVolsCount] = useState(initialVolsCount);
  const [triageItems, setTriageItems] = useState<TriageItem[]>(initialTriageItems);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TriageItem | null>(null);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { count: regCount } = await supabase.from("registrations").select("*", { count: "exact", head: true });
      if (regCount !== null) setCampersCount(campersDisplayCount(regCount));

      const { count: volCount } = await supabase.from("staff_applications").select("*", { count: "exact", head: true });
      if (volCount !== null) setVolsCount(volsDisplayCount(volCount));

      const { data: healthData } = await supabase.from("health_profiles").select(HEALTH_SELECT).eq("has_allergies", true);

      const { data: refData } = await supabase.from("staff_references").select(REFERENCE_SELECT).limit(5);

      setTriageItems(buildTriageItems(healthData as any[] | null, refData as any[] | null));
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const openRecord = (rec: TriageItem) => {
    setSelectedRecord(rec);
    setDrawerOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    const supabase = createClient();
    if (selectedRecord.type === "medical") {
      await supabase
        .from("health_profiles")
        .update({ immunization_status: "approved", special_care_notes: "RN approved" })
        .eq("id", selectedRecord.data.id);
      alert("✓ Medical clearance approved and timestamped in Supabase.");
    } else {
      await supabase
        .from("staff_references")
        .update({ director_reviewed: true })
        .eq("id", selectedRecord.data.id);
      alert("✓ Counselor reference approved in Supabase.");
    }
    setDrawerOpen(false);
    fetchLiveData();
  };

  // Split the queue by what it is actually waiting on, so the strip answers
  // "what is late" and "what is merely waiting" rather than one lump total.
  const medicalHolds = triageItems.filter((i) => i.type === "medical").length;
  const referenceHolds = triageItems.length - medicalHolds;

  const columns: Column<TriageItem>[] = [
    {
      key: "who",
      header: "Record",
      primary: true,
      cell: (item) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-stone-900">{item.title}</div>
          <div className="mt-0.5 text-[11px] text-stone-500">{item.sub}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Waiting on",
      cell: (item) => (
        <StatusDot
          tone={item.type === "medical" ? "overdue" : "pending"}
          label={item.type === "medical" ? "Medical review" : "Reference review"}
        />
      ),
    },
    {
      key: "detail",
      header: "Detail",
      cell: (item) => <span className="text-xs text-stone-600">{item.detail}</span>,
    },
    {
      key: "action",
      header: "Review",
      action: true,
      cell: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openRecord(item);
          }}
        >
          Review record
        </Button>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Live Supabase production view"
        title="Director Command Center"
        description="Where the season stands this morning, and the records nobody else can clear."
        actions={
          <>
            <Link href="/admin/history" className={buttonClass("secondary")}>Camp records</Link>
            <Button variant="secondary" onClick={fetchLiveData}>
              <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} />
              Sync DB
            </Button>
            <Button
              variant="destructive"
              disabled
              title="Emergency messaging is not configured for this camp."
            >
              <ShieldAlert className="h-4 w-4" />
              Emergency messaging unavailable
            </Button>
          </>
        }
      />

      <StatStrip>
        <StatCard
          label="Campers registered"
          value={campersCount}
          of={CAMPER_TARGET}
          tone="complete"
          progress={(campersCount / CAMPER_TARGET) * 100}
          progressLabel={`of the cap — ${Math.max(0, CAMPER_TARGET - campersCount)} spots left`}
        />
        <StatCard
          label="Volunteers in pipeline"
          value={volsCount}
          of={VOLUNTEER_TARGET}
          tone="pending"
          progress={(volsCount / VOLUNTEER_TARGET) * 100}
          progressLabel="of the volunteers this season needs"
        />
        <StatCard
          label="Medical holds"
          value={medicalHolds}
          tone="overdue"
          hint="Allergy and EpiPen records a nurse has not signed off."
        />
        <StatCard
          label="References to hear"
          value={referenceHolds}
          tone="pending"
          hint="Completed reference calls waiting on a director."
        />
      </StatStrip>

      <div className="space-y-3">
        <Panel
          title="Priority triage queue"
          description="Live records requiring director or medical clearance."
          actions={<Badge tone="complete">Supabase connected</Badge>}
          bodyClassName="p-0"
        >
          <DataTable
            columns={columns}
            rows={triageItems}
            rowKey={(_, i) => String(i)}
            loading={loading && triageItems.length === 0}
            onRowClick={openRecord}
            empty="Nothing is waiting on you. The queue is clear."
            className="rounded-none border-0"
          />
        </Panel>
      </div>

      <Drawer
        open={drawerOpen && Boolean(selectedRecord)}
        onClose={() => setDrawerOpen(false)}
        title={selectedRecord?.type === "medical" ? "Medical clearance review" : "KaiCalls voice interview"}
        subtitle={selectedRecord?.title}
        footer={
          <Button variant="primary" className="w-full py-3" onClick={handleApprove}>
            <Check className="h-4 w-4" />
            Sign off &amp; update record
          </Button>
        }
      >
        {selectedRecord && selectedRecord.type === "medical" ? (
          <div className="space-y-4 text-xs">
            <div className="space-y-1 rounded-xl border border-alert-red-border bg-alert-red-bg p-4">
              <b className="text-sm text-alert-red">{selectedRecord.data.allergy_details || "Allergy details not provided"}</b>
              <p className="text-stone-700">
                {selectedRecord.data.has_epipen
                  ? `EpiPen recorded${selectedRecord.data.epipen_location ? ` — ${selectedRecord.data.epipen_location}` : "."}`
                  : "No EpiPen is recorded on this profile."}
              </p>
            </div>
            <dl className="space-y-2">
              <DetailRow label="Camper" value={selectedRecord.title} />
              <DetailRow label="Record ID" value={selectedRecord.data.id} mono />
            </dl>
          </div>
        ) : selectedRecord ? (
          <div className="space-y-4 text-xs">
            <div className="space-y-2 rounded-xl border border-sun-100 bg-sun-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sun-600">{selectedRecord.data.reference_name || "Unnamed reference"} — call transcript</b>
                <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-forest-800">
                  {selectedRecord.data.sentiment_score == null
                    ? "Not scored"
                    : `Score: ${selectedRecord.data.sentiment_score} / 5.0`}
                </span>
              </div>
              <p className="italic leading-relaxed text-stone-700">
                &ldquo;
                {selectedRecord.data.call_transcript || "No transcript is available for this reference."}
                &rdquo;
              </p>
            </div>
            <dl className="space-y-2">
              <DetailRow label="Applicant" value={selectedRecord.title} />
              <DetailRow label="Phone" value={selectedRecord.data.phone || "Not provided"} />
              <DetailRow label="Record ID" value={selectedRecord.data.id} mono />
            </dl>
          </div>
        ) : null}
      </Drawer>
    </PageShell>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2 last:border-b-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className={"text-right text-xs text-stone-800" + (mono ? " font-mono text-[11px] text-stone-500" : "")}>
        {value}
      </dd>
    </div>
  );
}
