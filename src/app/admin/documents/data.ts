/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";
import { defaultExpiryCutoff, type AppliesTo, type DocumentStatus } from "@/lib/documents";

export type PersonKind = "camper" | "teen_volunteer" | "adult_volunteer";

export type OutstandingRow = {
  personId: string;
  personName: string;
  kind: PersonKind;
  missing: string[];
  rejected: string[];
  expired: string[];
};

export type ReviewRow = {
  recordId: string;
  personName: string;
  kind: PersonKind;
  typeName: string;
  submittedAt: string | null;
  hasFile: boolean;
};

export type ExpiringRow = {
  recordId: string;
  personName: string;
  typeName: string;
  expiresOn: string;
  validityMonths: number | null;
  alreadyLapsed: boolean;
};

export type GroupSummary = {
  kind: PersonKind;
  label: string;
  people: number;
  requiredTotal: number;
  approved: number;
  outstanding: number;
};

export type DocumentsDashboard = {
  cutoff: string;
  seasonName: string | null;
  summaries: GroupSummary[];
  outstanding: OutstandingRow[];
  reviewQueue: ReviewRow[];
  expiring: ExpiringRow[];
};

const KIND_LABEL: Record<PersonKind, string> = {
  camper: "Campers",
  teen_volunteer: "Teen volunteers",
  adult_volunteer: "Adult volunteers",
};

function personName(camper: any, staff: any): string {
  if (camper) return [camper.legal_first_name, camper.legal_last_name].filter(Boolean).join(" ") || "Unnamed camper";
  if (staff) return [staff.first_name, staff.last_name].filter(Boolean).join(" ") || "Unnamed volunteer";
  return "Unknown";
}

/**
 * A staff application is a teen or an adult volunteer. The camp's cut is age:
 * under 18 at the start of camp is a teen. `birth_date` is what the volunteer
 * form collects, so that is what we read; without one we assume adult, because
 * the adult list (PGC, VIRTUS, background check) is the stricter one to miss.
 */
function staffKind(staff: any): PersonKind {
  const birth = staff?.birth_date;
  if (!birth) return "adult_volunteer";
  const age = (Date.now() - new Date(birth).getTime()) / (365.25 * 24 * 3600 * 1000);
  return age < 18 ? "teen_volunteer" : "adult_volunteer";
}

/** Everything the documents dashboard renders, in one pass. */
export async function loadDocumentsDashboard(campId: string): Promise<DocumentsDashboard> {
  const supabase = await createClient();

  const [{ data: season }, { data: types }, { data: records }] = await Promise.all([
    supabase.from("seasons").select("name, forms_due_on, is_active").eq("camp_id", campId).eq("is_active", true).maybeSingle(),
    supabase.from("document_types").select("*").eq("camp_id", campId).order("display_order"),
    supabase
      .from("document_records")
      .select(
        "id, status, file_path, updated_at, expires_on, document_type_id, camper_id, staff_application_id, " +
          "campers(legal_first_name, legal_last_name), " +
          "staff_applications(first_name, last_name, birth_date)",
      )
      .eq("camp_id", campId),
  ]);

  // Credentials that lapse before this date need renewing before camp.
  const cutoff = (season as any)?.forms_due_on ?? defaultExpiryCutoff();
  const today = new Date().toISOString().slice(0, 10);

  const typeById = new Map<string, any>();
  for (const t of (types ?? []) as any[]) typeById.set(t.id, t);

  const rows = (records ?? []) as any[];

  // --- Per-person roll-up ------------------------------------------------
  const people = new Map<string, OutstandingRow & { approved: number; required: number }>();

  for (const r of rows) {
    const type = typeById.get(r.document_type_id);
    if (!type) continue;
    const id = r.camper_id ?? r.staff_application_id;
    if (!id) continue;
    const kind: PersonKind = r.camper_id ? "camper" : staffKind(r.staff_applications);

    let entry = people.get(id);
    if (!entry) {
      entry = {
        personId: id,
        personName: personName(r.campers, r.staff_applications),
        kind,
        missing: [],
        rejected: [],
        expired: [],
        approved: 0,
        required: 0,
      };
      people.set(id, entry);
    }

    const status = r.status as DocumentStatus;
    if (type.is_required) {
      entry.required += 1;
      if (status === "approved") entry.approved += 1;
      else if (status === "rejected") entry.rejected.push(type.name);
      else if (status === "expired") entry.expired.push(type.name);
      else if (status === "missing") entry.missing.push(type.name);
    }
  }

  // Document types a person has no row for at all are still owed.
  for (const entry of people.values()) {
    const owedTypes = ((types ?? []) as any[]).filter(
      (t) => t.applies_to === (entry.kind as AppliesTo) && t.is_required,
    );
    const seen = new Set(
      rows.filter((r) => (r.camper_id ?? r.staff_application_id) === entry.personId).map((r) => r.document_type_id),
    );
    for (const t of owedTypes) {
      if (!seen.has(t.id)) {
        entry.missing.push(t.name);
        entry.required += 1;
      }
    }
  }

  // --- Summaries ---------------------------------------------------------
  const summaries: GroupSummary[] = (["camper", "teen_volunteer", "adult_volunteer"] as PersonKind[]).map((kind) => {
    const group = [...people.values()].filter((p) => p.kind === kind);
    const requiredTotal = group.reduce((n, p) => n + p.required, 0);
    const approved = group.reduce((n, p) => n + p.approved, 0);
    return {
      kind,
      label: KIND_LABEL[kind],
      people: group.length,
      requiredTotal,
      approved,
      outstanding: requiredTotal - approved,
    };
  });

  const outstanding = [...people.values()]
    .filter((p) => p.missing.length || p.rejected.length || p.expired.length)
    .map(({ personId, personName: name, kind, missing, rejected, expired }) => ({
      personId,
      personName: name,
      kind,
      missing,
      rejected,
      expired,
    }))
    .sort(
      (a, b) =>
        b.expired.length + b.rejected.length - (a.expired.length + a.rejected.length) ||
        b.missing.length - a.missing.length ||
        a.personName.localeCompare(b.personName),
    );

  // --- Review queue ------------------------------------------------------
  const reviewQueue: ReviewRow[] = rows
    .filter((r) => r.status === "submitted")
    .map((r) => ({
      recordId: r.id,
      personName: personName(r.campers, r.staff_applications),
      kind: (r.camper_id ? "camper" : staffKind(r.staff_applications)) as PersonKind,
      typeName: typeById.get(r.document_type_id)?.name ?? "Document",
      submittedAt: r.updated_at ?? null,
      hasFile: !!r.file_path,
    }))
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));

  // --- Expiring soon -----------------------------------------------------
  // The whole reason validity_months exists: a returning volunteer's PGC or
  // background check lapsing before camp, surfaced now rather than at check-in.
  const expiring: ExpiringRow[] = rows
    .filter((r) => r.expires_on && r.expires_on <= cutoff && typeById.get(r.document_type_id)?.validity_months)
    .map((r) => ({
      recordId: r.id,
      personName: personName(r.campers, r.staff_applications),
      typeName: typeById.get(r.document_type_id)?.name ?? "Credential",
      expiresOn: r.expires_on as string,
      validityMonths: typeById.get(r.document_type_id)?.validity_months ?? null,
      alreadyLapsed: (r.expires_on as string) < today,
    }))
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));

  return {
    cutoff,
    seasonName: (season as any)?.name ?? null,
    summaries,
    outstanding,
    reviewQueue,
    expiring,
  };
}
