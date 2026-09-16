import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import ReviewQueueClient from "./ReviewQueueClient";
import { loadDocumentsDashboard, type ExpiringRow, type OutstandingRow } from "./data";
import {
  Badge,
  DataTable,
  PageHeader,
  Panel,
  PageShell,
  SectionHeader,
  StatCard,
  StatStrip,
  StatusDot,
  type Column,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  camper: "Camper",
  teen_volunteer: "Teen",
  adult_volunteer: "Adult",
};

export default async function DocumentsPage() {
  const membership = await requireArea("admin", "/admin/documents");
  const dashboard = await loadDocumentsDashboard(membership.campId);

  // Everything in the strip is folded out of what the page already loaded —
  // no extra queries to answer "where does paperwork stand this morning".
  const people = dashboard.summaries.reduce((n, s) => n + s.people, 0);
  const required = dashboard.summaries.reduce((n, s) => n + s.requiredTotal, 0);
  const approved = dashboard.summaries.reduce((n, s) => n + s.approved, 0);
  const outstanding = dashboard.summaries.reduce((n, s) => n + s.outstanding, 0);
  const lapsed = dashboard.expiring.filter((r) => r.alreadyLapsed).length;

  const expiringColumns: Column<ExpiringRow>[] = [
    {
      key: "person",
      header: "Volunteer",
      primary: true,
      cell: (row) => <span className="font-semibold text-stone-900">{row.personName}</span>,
    },
    { key: "type", header: "Credential", cell: (row) => row.typeName },
    {
      key: "validity",
      header: "Valid for",
      align: "right",
      cell: (row) => <span className="text-stone-500">{row.validityMonths ? `${row.validityMonths} mo` : "—"}</span>,
    },
    {
      key: "expires",
      header: "Expires",
      cell: (row) => (
        <StatusDot
          tone={row.alreadyLapsed ? "overdue" : "pending"}
          label={row.alreadyLapsed ? `Lapsed ${row.expiresOn}` : row.expiresOn}
        />
      ),
    },
  ];

  const outstandingColumns: Column<OutstandingRow>[] = [
    {
      key: "person",
      header: "Person",
      primary: true,
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-stone-900">{row.personName}</span>
          <Badge>{KIND_LABEL[row.kind] ?? row.kind}</Badge>
        </div>
      ),
    },
    {
      key: "state",
      header: "Worst state",
      cell: (row) => (
        <StatusDot
          tone={row.expired.length > 0 ? "overdue" : row.rejected.length > 0 ? "pending" : "neutral"}
          label={row.expired.length > 0 ? "Expired" : row.rejected.length > 0 ? "Sent back" : "Not started"}
        />
      ),
    },
    {
      key: "what",
      header: "What is missing",
      cell: (row) => (
        <div className="flex flex-wrap justify-end gap-1.5 sm:justify-start">
          {row.expired.map((name) => (
            <span
              key={`e-${name}`}
              className="rounded-full border border-alert-red-border bg-alert-red-bg px-2.5 py-0.5 text-[11px] font-semibold text-alert-red"
            >
              {name} — expired
            </span>
          ))}
          {row.rejected.map((name) => (
            <span
              key={`r-${name}`}
              className="rounded-full border border-sun-100 bg-sun-50 px-2.5 py-0.5 text-[11px] font-semibold text-sun-600"
            >
              {name} — sent back
            </span>
          ))}
          {row.missing.map((name) => (
            <span
              key={`m-${name}`}
              className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] text-stone-600"
            >
              {name}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <StaffHeader />
      <PageShell>
        <PageHeader
          eyebrow="Paperwork"
          title="Documents"
          description={`Every required form, card and credential${
            dashboard.seasonName ? ` for ${dashboard.seasonName}` : ""
          }. Credentials lapsing on or before ${dashboard.cutoff} need renewing before camp.`}
        />

        <StatStrip>
          <StatCard
            label="Outstanding"
            value={outstanding}
            of={required}
            tone="overdue"
            progress={required > 0 ? (outstanding / required) * 100 : 0}
            progressLabel={`of required paperwork still missing across ${people} people`}
          />
          <StatCard
            label="Awaiting review"
            value={dashboard.reviewQueue.length}
            tone="pending"
            hint="Submitted and sitting on a reviewer's desk."
          />
          <StatCard
            label="Approved"
            value={approved}
            of={required}
            tone="complete"
            progress={required > 0 ? (approved / required) * 100 : 0}
            progressLabel="of required paperwork approved"
          />
          <StatCard
            label="Expiring before camp"
            value={dashboard.expiring.length}
            tone={lapsed > 0 ? "overdue" : "pending"}
            hint={lapsed > 0 ? `${lapsed} already lapsed.` : `Nothing has lapsed yet.`}
          />
        </StatStrip>

        <div className="space-y-3">
          <SectionHeader
            title="Review queue"
            description="Approve, send back with a reason, or open the scan. Scans open on a fresh signed link every time."
            actions={<Badge tone="pending">{dashboard.reviewQueue.length} waiting</Badge>}
          />
          <ReviewQueueClient initialRows={dashboard.reviewQueue} />
        </div>

        <div className="space-y-3">
          <SectionHeader
            title="Expiring soon"
            description="Multi-year credentials — PGC, VIRTUS, background checks — that lapse before camp. Chase these in the off-season, not at check-in."
          />
          <DataTable
            columns={expiringColumns}
            rows={dashboard.expiring}
            rowKey={(row) => row.recordId}
            empty={`Nothing lapses before ${dashboard.cutoff}.`}
          />
        </div>

        <div className="space-y-3">
          <SectionHeader title="Who is missing what" description="One row per person, worst state first." />
          {dashboard.outstanding.length === 0 ? (
            <Panel className="border-forest-100 bg-forest-50">
              <p className="text-sm text-forest-800">
                Everyone tracked is fully papered. That has never happened before — check the seed data.
              </p>
            </Panel>
          ) : (
            <DataTable
              columns={outstandingColumns}
              rows={dashboard.outstanding}
              rowKey={(row) => row.personId}
              empty="Nobody is missing anything."
            />
          )}
        </div>
      </PageShell>
    </>
  );
}
