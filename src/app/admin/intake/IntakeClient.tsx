"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  SectionHeader,
  humanizeStatus,
  inputClass,
  toneFor,
  type Column,
} from "@/components/ui";
import {
  matchesIntakeSearch,
  searchableAnswerText,
  type CustomIntakeRow,
  type IntakeKind,
  type RegistrationIntakeRow,
  type VolunteerIntakeRow,
} from "@/lib/intake";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function submittedDate(value: string): string {
  return value ? DATE_FORMAT.format(new Date(value)) : "Unknown";
}

function contact(email: string, phone: string) {
  return (
    <span className="space-y-0.5">
      {email && <a className="block font-semibold text-forest-900 underline underline-offset-2" href={`mailto:${email}`}>{email}</a>}
      {phone && <a className="block text-xs text-stone-500" href={`tel:${phone}`}>{phone}</a>}
      {!email && !phone && <span className="text-stone-400">No contact details</span>}
    </span>
  );
}

const registrationColumns: Column<RegistrationIntakeRow>[] = [
  {
    key: "camper",
    header: "Camper",
    primary: true,
    cell: (row) => (
      <span>
        <b className="block text-stone-900">{row.camperName}</b>
        <span className="text-xs text-stone-500">Guardian: {row.guardianName}</span>
      </span>
    ),
  },
  { key: "contact", header: "Guardian contact", cell: (row) => contact(row.guardianEmail, row.guardianPhone) },
  { key: "session", header: "Session", cell: (row) => row.sessionName || "No session" },
  { key: "status", header: "Status", cell: (row) => <Badge tone={toneFor(row.status)}>{humanizeStatus(row.status || "unknown")}</Badge> },
  { key: "plan", header: "Payment plan", cell: (row) => humanizeStatus(row.paymentPlan || "not selected") },
  { key: "date", header: "Submitted", cell: (row) => submittedDate(row.submittedAt) },
];

const volunteerColumns: Column<VolunteerIntakeRow>[] = [
  { key: "applicant", header: "Applicant", primary: true, cell: (row) => <b className="text-stone-900">{row.applicantName}</b> },
  { key: "contact", header: "Contact", cell: (row) => contact(row.email, row.phone) },
  { key: "role", header: "Role", cell: (row) => row.role },
  { key: "status", header: "Application", cell: (row) => <Badge tone={toneFor(row.status)}>{humanizeStatus(row.status || "unknown")}</Badge> },
  { key: "background", header: "Background", cell: (row) => <Badge tone={toneFor(row.backgroundStatus)}>{humanizeStatus(row.backgroundStatus || "not started")}</Badge> },
  { key: "date", header: "Submitted", cell: (row) => submittedDate(row.submittedAt) },
];

const customColumns: Column<CustomIntakeRow>[] = [
  {
    key: "form",
    header: "Form",
    primary: true,
    cell: (row) => (
      <span>
        <b className="block text-stone-900">{row.formTitle}</b>
        <span className="text-xs text-stone-500">{humanizeStatus(row.audience || "custom response")}</span>
      </span>
    ),
  },
  {
    key: "answers",
    header: "Answers",
    cell: (row) => (
      <details className="max-w-xl text-left">
        <summary className="cursor-pointer font-semibold text-forest-900 underline underline-offset-2">
          View {row.answers.length} answer{row.answers.length === 1 ? "" : "s"}
        </summary>
        <dl className="mt-3 space-y-2 rounded-xl bg-stone-50 p-3">
          {row.answers.map((answer, index) => (
            <div key={`${answer.label}-${index}`}>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{answer.label}</dt>
              <dd className="whitespace-pre-wrap text-xs text-stone-800">{answer.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    ),
  },
  { key: "date", header: "Submitted", cell: (row) => submittedDate(row.submittedAt) },
];

export default function IntakeClient({
  registrations,
  volunteers,
  custom,
  totals,
}: {
  registrations: RegistrationIntakeRow[];
  volunteers: VolunteerIntakeRow[];
  custom: CustomIntakeRow[];
  totals: Record<IntakeKind, number>;
}) {
  const [kind, setKind] = useState<IntakeKind>("registrations");
  const [query, setQuery] = useState("");

  const filteredRegistrations = useMemo(
    () => registrations.filter((row) => matchesIntakeSearch([
      row.camperName, row.guardianName, row.guardianEmail, row.guardianPhone,
      row.sessionName, row.status, row.paymentPlan,
    ], query)),
    [registrations, query],
  );
  const filteredVolunteers = useMemo(
    () => volunteers.filter((row) => matchesIntakeSearch([
      row.applicantName, row.email, row.phone, row.role, row.status, row.backgroundStatus,
    ], query)),
    [volunteers, query],
  );
  const filteredCustom = useMemo(
    () => custom.filter((row) => matchesIntakeSearch([
      row.formTitle, row.audience, searchableAnswerText(row.answers),
    ], query)),
    [custom, query],
  );

  const tabs: Array<{ kind: IntakeKind; label: string }> = [
    { kind: "registrations", label: "Campers" },
    { kind: "volunteers", label: "Volunteers" },
    { kind: "custom", label: "Custom forms" },
  ];

  const shown = kind === "registrations"
    ? filteredRegistrations.length
    : kind === "volunteers"
      ? filteredVolunteers.length
      : filteredCustom.length;

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Incoming applications"
        description="Search the camp's current intake. Historical roster imports stay separate."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Intake type">
          {tabs.map((tab) => (
            <button
              key={tab.kind}
              type="button"
              role="tab"
              aria-selected={kind === tab.kind}
              onClick={() => setKind(tab.kind)}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                kind === tab.kind
                  ? "border-forest-800 bg-forest-800 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
              }`}
            >
              {tab.label} ({totals[tab.kind]})
            </button>
          ))}
        </div>
        <label className="min-w-0 sm:w-80">
          <span className="sr-only">Search intake</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, session, role…"
            className={inputClass}
          />
        </label>
      </div>
      {query && <p className="text-xs text-stone-500">Showing {shown} matching record{shown === 1 ? "" : "s"}.</p>}

      {kind === "registrations" && (
        <DataTable
          columns={registrationColumns}
          rows={filteredRegistrations}
          rowKey={(row) => row.id}
          empty={query ? "No camper registrations match that search." : "No current camper registrations have been submitted."}
        />
      )}
      {kind === "volunteers" && (
        <DataTable
          columns={volunteerColumns}
          rows={filteredVolunteers}
          rowKey={(row) => row.id}
          empty={query ? "No volunteer applications match that search." : "No volunteer applications have been submitted."}
        />
      )}
      {kind === "custom" && (
        <DataTable
          columns={customColumns}
          rows={filteredCustom}
          rowKey={(row) => row.id}
          empty={query ? "No custom form responses match that search." : "No unlinked custom form responses are waiting."}
        />
      )}

      {totals[kind] > 500 && (
        <p className="text-xs text-stone-500">Showing the 500 newest of {totals[kind]} records.</p>
      )}
    </section>
  );
}

