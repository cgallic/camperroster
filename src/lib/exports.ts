/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The four workbooks the leadership team runs the camp from.
 *
 * The camp has always worked from spreadsheets handed round a table, and the
 * ask was not to replace that habit but to stop hand-typing them. So each
 * report is a real Excel workbook: one sheet per logical section, a frozen
 * header row, and autofilter turned on across the used range so the people who
 * already sort these by hand can keep doing it.
 *
 * Everything reads through the caller's request-scoped Supabase client, so RLS
 * decides what lands in the file. The financial workbook has an extra role gate
 * on the route as well, because a row the database would happily return to a
 * registrar should still not be reachable from a counselor's browser.
 */

import ExcelJS from "exceljs";
import {
  evaluateRegistration,
  formatCents,
  paperworkLabel,
  paymentLabel,
  timingFromDays,
  whoCategory,
  PROVISIONAL_HOLD_MESSAGE,
  STATUS_LABELS,
  TIMING_LABELS,
  WHO_LABELS,
  type DocumentTally,
  type OutstandingDocument,
  type Population,
  type RegistrationStatus,
  type Timing,
  type WhoCategory,
} from "./registration-status";

type Db = { from: (t: string) => any };

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export const REPORTS = ["master", "sortable", "cabins", "financial"] as const;
export type ReportKey = (typeof REPORTS)[number];

export const REPORT_META: Record<ReportKey, { title: string; filename: string; description: string }> = {
  master: {
    title: "Master Registration",
    filename: "master-registration",
    description: "Everything on file for every camper, teen volunteer and adult volunteer, documentation included.",
  },
  sortable: {
    title: "Sortable Basic Registration",
    filename: "sortable-basic-registration",
    description: "Basic information for all three populations, with every column the team sorts by.",
  },
  cabins: {
    title: "Camper Cabin Assignment",
    filename: "camper-cabin-assignment",
    description: "Campers by cabin, with the waitlist on its own sheet.",
  },
  financial: {
    title: "Financial",
    filename: "financial",
    description: "Payment status per family, financial aid applications, and the have-not-paid-in-full list.",
  },
};

export function isReportKey(value: string): value is ReportKey {
  return (REPORTS as readonly string[]).includes(value);
}

export type ExportFilters = {
  population: Population[];
  status: RegistrationStatus[];
  grade: number[];
  gender: string[];
  cabin: string[];
  serviceArea: string[];
  who: WhoCategory[];
  timing: Timing[];
};

export const EMPTY_FILTERS: ExportFilters = {
  population: [],
  status: [],
  grade: [],
  gender: [],
  cabin: [],
  serviceArea: [],
  who: [],
  timing: [],
};

/** Reads the filter set out of a query string; anything unrecognised is dropped. */
export function parseFilters(params: URLSearchParams): ExportFilters {
  const list = (key: string) =>
    params
      .getAll(key)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean);

  return {
    population: list("population").filter((v): v is Population =>
      ["camper", "teen_volunteer", "adult_volunteer"].includes(v)
    ),
    status: list("status").filter((v): v is RegistrationStatus => v in STATUS_LABELS),
    grade: list("grade").map(Number).filter((n) => Number.isFinite(n)),
    gender: list("gender").map((g) => g.toLowerCase()),
    cabin: list("cabin"),
    serviceArea: list("serviceArea"),
    who: list("who").filter((v): v is WhoCategory => v in WHO_LABELS),
    timing: list("timing").filter((v): v is Timing => v in TIMING_LABELS),
  };
}

export function filtersToQuery(filters: Partial<ExportFilters>): string {
  const params = new URLSearchParams();
  for (const [key, values] of Object.entries(filters)) {
    for (const value of (values as unknown[]) ?? []) params.append(key, String(value));
  }
  return params.toString();
}

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

export type PersonRow = {
  id: string;
  population: Population;
  who: WhoCategory;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  fullName: string;
  birthDate: string | null;
  age: number | null;
  gender: string | null;
  grade: number | null;
  email: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  householdName: string | null;
  familyId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  cabinId: string | null;
  cabinName: string | null;
  isWaitlisted: boolean;
  waitlistPosition: number | null;
  waitlistStatus: string | null;
  isReturning: boolean;
  status: RegistrationStatus;
  statusLabel: string;
  outstanding: string[];
  documents: DocumentTally | null;
  outstandingDocuments: OutstandingDocument[];
  paperwork: string;
  payment: string;
  totalDueCents: number;
  amountPaidCents: number;
  balanceCents: number;
  serviceAreaIds: string[];
  serviceAreas: string[];
  timing: Timing;
  roleApplied: string | null;
  backgroundStatus: string | null;
  isFirstTimeCounselor: boolean;
  willingToBecomeLifeguard: boolean;
  flaggedForDiscussion: boolean;
  discussionNote: string | null;
  buddyRequests: string[];
  signedAt: string | null;
  createdAt: string | null;
  provisionalHold: string | null;
};

export type FamilyFinanceRow = {
  invoiceId: string;
  familyId: string;
  householdName: string;
  camperCount: number;
  paymentPlan: string;
  totalDueCents: number;
  financialAidCents: number;
  amountPaidCents: number;
  balanceCents: number;
  nextDueOn: string | null;
  contactEmails: string[];
  payments: { amountCents: number; paidAt: string | null; status: string }[];
  schedule: { dueOn: string; amountCents: number; status: string }[];
};

export type AidRow = {
  familyId: string;
  householdName: string;
  requestedCents: number | null;
  awardedCents: number | null;
  status: string;
  decidedAt: string | null;
  narrative: string | null;
};

export type ExportData = {
  seasonId: string | null;
  seasonYear: number | null;
  formsDueOn: string | null;
  people: PersonRow[];
  cabins: {
    cabinId: string;
    name: string;
    gender: string | null;
    minGrade: number | null;
    maxGrade: number | null;
    capacity: number;
    assigned: number;
    remaining: number;
    isOpen: boolean;
  }[];
  serviceAreas: { id: string; name: string }[];
  families: FamilyFinanceRow[];
  aid: AidRow[];
  generatedAt: Date;
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function fullName(first?: string | null, last?: string | null, fallback = "Unnamed"): string {
  return [first, last].filter(Boolean).join(" ") || fallback;
}

function ageOn(birthDate: string | null | undefined, on: Date): number | null {
  if (!birthDate) return null;
  const dob = new Date(`${birthDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  let age = on.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    on.getMonth() < dob.getMonth() || (on.getMonth() === dob.getMonth() && on.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

async function rows(db: Db, table: string, select = "*"): Promise<any[]> {
  const { data } = await db.from(table).select(select);
  return (data ?? []) as any[];
}

/**
 * One pass over everything the four workbooks need. Reports overlap heavily, so
 * loading once and shaping afterwards costs far less than four bespoke queries
 * and keeps a camper's status identical across every file the team opens.
 */
export async function loadExportData(db: Db, today = new Date()): Promise<ExportData> {
  const { data: season } = await db
    .from("seasons")
    .select("id, year, forms_due_on, early_rate_ends_on, is_active")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const seasonId: string | null = season?.id ?? null;
  const formsDueOn: string | null = season?.forms_due_on ?? null;

  const [
    registrations,
    docStatus,
    documentTypes,
    documentRecords,
    assignments,
    waitlist,
    history,
    occupancy,
    staffApps,
    volunteerAssignments,
    availability,
    serviceAreas,
    invoices,
    payments,
    scheduleItems,
    aidApplications,
    guardians,
  ] = await Promise.all([
    rows(
      db,
      "registrations",
      "id, status, camper_id, guardian_id, payment_plan, total_tuition_cents, amount_paid_cents, " +
        "buddy_requests, signed_at, created_at, cabin_name, " +
        "campers(id, legal_first_name, legal_last_name, preferred_name, birth_date, gender, grade_entering, family_id, " +
        "families(id, household_name, address_line1, address_line2, city, state, zip)), " +
        "guardians(id, first_name, last_name, email, phone, address_line1, city, state, zip, family_id)"
    ),
    rows(db, "registration_document_status"),
    rows(db, "document_types", "id, code, name, applies_to, is_required, display_order"),
    rows(db, "document_records", "id, document_type_id, camper_id, staff_application_id, status, expires_on"),
    rows(db, "cabin_assignments", "id, cabin_id, registration_id, staff_application_id, occupant_role, cabins(id, name)"),
    rows(db, "waitlist_entries", "id, registration_id, staff_application_id, position, status, gender, grade"),
    rows(db, "participant_history", "id, season_id, participant_type, camper_id, staff_application_id, attended"),
    rows(db, "cabin_occupancy"),
    rows(
      db,
      "staff_applications",
      "id, first_name, last_name, email, phone, birth_date, role_applied, status, background_status, " +
        "certifications, experience_notes, is_first_time_counselor, willing_to_become_lifeguard, " +
        "flagged_for_discussion, discussion_note, created_at"
    ),
    rows(db, "volunteer_assignments", "id, staff_application_id, service_area_id, is_primary, season_id"),
    rows(db, "volunteer_availability", "id, staff_application_id, serves_on, season_id"),
    rows(db, "service_areas", "id, code, name, target_per_day, display_order"),
    rows(
      db,
      "family_invoices",
      "id, family_id, season_id, camper_count, tier_cents, custom_total_cents, financial_aid_cents, " +
        "processing_fee_cents, amount_paid_cents, total_due_cents, payment_plan, families(id, household_name)"
    ),
    rows(db, "payments", "id, invoice_id, amount_cents, refunded_cents, status, paid_at"),
    rows(db, "payment_schedule_items", "id, invoice_id, due_on, amount_cents, status"),
    rows(
      db,
      "financial_aid_applications",
      "id, family_id, amount_requested_cents, amount_awarded_cents, status, narrative, decided_at, families(household_name)"
    ),
    rows(db, "guardians", "id, family_id, first_name, last_name, email, phone"),
  ]);

  // --- indexes ------------------------------------------------------------
  const docStatusByReg = new Map<string, DocumentTally>();
  for (const d of docStatus) {
    docStatusByReg.set(d.registration_id, {
      requiredTotal: Number(d.required_total ?? 0),
      requiredApproved: Number(d.required_approved ?? 0),
      requiredOutstanding: Number(d.required_outstanding ?? 0),
    });
  }

  const typeById = new Map<string, any>(documentTypes.map((t) => [t.id, t]));
  const recordsByCamper = new Map<string, any[]>();
  const recordsByStaff = new Map<string, any[]>();
  for (const r of documentRecords) {
    const bucket = r.camper_id ? recordsByCamper : recordsByStaff;
    const key = r.camper_id ?? r.staff_application_id;
    if (!key) continue;
    bucket.set(key, [...(bucket.get(key) ?? []), r]);
  }

  /** Required types for an audience that are not approved for this subject. */
  function outstandingFor(appliesTo: string, records: any[]): OutstandingDocument[] {
    const approved = new Set(
      records.filter((r) => r.status === "approved").map((r) => r.document_type_id as string)
    );
    const byType = new Map(records.map((r) => [r.document_type_id, r]));
    return documentTypes
      .filter((t) => t.applies_to === appliesTo && t.is_required)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .filter((t) => !approved.has(t.id))
      .map((t) => ({ code: t.code, name: t.name, status: byType.get(t.id)?.status ?? "missing" }));
  }

  function tallyFor(appliesTo: string, records: any[]): DocumentTally {
    const required = documentTypes.filter((t) => t.applies_to === appliesTo && t.is_required);
    const approved = new Set(
      records.filter((r) => r.status === "approved").map((r) => r.document_type_id as string)
    );
    const approvedCount = required.filter((t) => approved.has(t.id)).length;
    return {
      requiredTotal: required.length,
      requiredApproved: approvedCount,
      requiredOutstanding: required.length - approvedCount,
    };
  }

  const assignmentByReg = new Map<string, any>();
  const assignmentByStaff = new Map<string, any>();
  for (const a of assignments) {
    if (a.registration_id) assignmentByReg.set(a.registration_id, a);
    if (a.staff_application_id) assignmentByStaff.set(a.staff_application_id, a);
  }

  const waitlistByReg = new Map<string, any>();
  const waitlistByStaff = new Map<string, any>();
  for (const w of waitlist) {
    if (!["waiting", "offered"].includes(w.status)) continue;
    if (w.registration_id) waitlistByReg.set(w.registration_id, w);
    if (w.staff_application_id) waitlistByStaff.set(w.staff_application_id, w);
  }

  // Returning means having taken part in a *prior* season, never this one.
  const returningCampers = new Set<string>();
  const returningStaff = new Set<string>();
  for (const h of history) {
    if (seasonId && h.season_id === seasonId) continue;
    if (h.camper_id) returningCampers.add(h.camper_id);
    if (h.staff_application_id) returningStaff.add(h.staff_application_id);
  }

  const areaById = new Map<string, any>(serviceAreas.map((s) => [s.id, s]));
  const areasByStaff = new Map<string, string[]>();
  for (const a of volunteerAssignments) {
    areasByStaff.set(a.staff_application_id, [...(areasByStaff.get(a.staff_application_id) ?? []), a.service_area_id]);
  }

  const daysByStaff = new Map<string, string[]>();
  const allCampDays = new Set<string>();
  for (const av of availability) {
    const day = String(av.serves_on).slice(0, 10);
    allCampDays.add(day);
    daysByStaff.set(av.staff_application_id, [...(daysByStaff.get(av.staff_application_id) ?? []), day]);
  }
  const campDays = [...allCampDays].sort();

  const invoiceByFamily = new Map<string, any>(invoices.map((i) => [i.family_id, i]));
  const guardiansByFamily = new Map<string, any[]>();
  for (const g of guardians) {
    if (!g.family_id) continue;
    guardiansByFamily.set(g.family_id, [...(guardiansByFamily.get(g.family_id) ?? []), g]);
  }

  // --- campers ------------------------------------------------------------
  const people: PersonRow[] = [];

  for (const reg of registrations) {
    const camper = reg.campers ?? {};
    const guardian = reg.guardians ?? {};
    const family = camper.families ?? null;
    const familyId: string | null = camper.family_id ?? guardian.family_id ?? null;
    const invoice = familyId ? invoiceByFamily.get(familyId) : null;

    const records = camper.id ? recordsByCamper.get(camper.id) ?? [] : [];
    const tally = docStatusByReg.get(reg.id) ?? (documentTypes.length ? tallyFor("camper", records) : null);
    const outstandingDocs = documentTypes.length ? outstandingFor("camper", records) : [];

    // Household invoice wins when one exists; otherwise fall back to the
    // per-registration totals the intake form wrote.
    const totalDue = Number(invoice?.total_due_cents ?? reg.total_tuition_cents ?? 0);
    const paid = Number(invoice?.amount_paid_cents ?? reg.amount_paid_cents ?? 0);

    const evaluated = evaluateRegistration({
      documents: tally,
      outstandingDocuments: outstandingDocs.length ? outstandingDocs : null,
      totalDueCents: totalDue,
      amountPaidCents: paid,
      formsDueOn,
      rawStatus: reg.status,
      today,
    });

    const wl = waitlistByReg.get(reg.id) ?? null;
    const assignment = assignmentByReg.get(reg.id) ?? null;

    people.push({
      id: reg.id,
      population: "camper",
      who: whoCategory({
        population: "camper",
        isReturning: camper.id ? returningCampers.has(camper.id) : false,
        isWaitlisted: Boolean(wl),
      }),
      firstName: camper.legal_first_name ?? "",
      lastName: camper.legal_last_name ?? "",
      preferredName: camper.preferred_name ?? null,
      fullName: fullName(camper.legal_first_name, camper.legal_last_name, "Unnamed camper"),
      birthDate: camper.birth_date ?? null,
      age: ageOn(camper.birth_date, today),
      gender: camper.gender ?? null,
      grade: camper.grade_entering ?? null,
      email: guardian.email ?? null,
      phone: guardian.phone ?? null,
      guardianName: fullName(guardian.first_name, guardian.last_name, ""),
      guardianEmail: guardian.email ?? null,
      guardianPhone: guardian.phone ?? null,
      householdName: family?.household_name ?? null,
      familyId,
      address: [family?.address_line1 ?? guardian.address_line1, family?.address_line2].filter(Boolean).join(", ") || null,
      city: family?.city ?? guardian.city ?? null,
      state: family?.state ?? guardian.state ?? null,
      zip: family?.zip ?? guardian.zip ?? null,
      cabinId: assignment?.cabin_id ?? null,
      cabinName: assignment?.cabins?.name ?? reg.cabin_name ?? null,
      isWaitlisted: Boolean(wl),
      waitlistPosition: wl ? Number(wl.position) : null,
      waitlistStatus: wl?.status ?? null,
      isReturning: camper.id ? returningCampers.has(camper.id) : false,
      status: evaluated.status,
      statusLabel: evaluated.label,
      outstanding: evaluated.outstanding,
      documents: tally,
      outstandingDocuments: outstandingDocs,
      paperwork: paperworkLabel(tally),
      payment: paymentLabel(totalDue, paid),
      totalDueCents: totalDue,
      amountPaidCents: paid,
      balanceCents: evaluated.balanceCents,
      serviceAreaIds: [],
      serviceAreas: [],
      // Campers attend the whole week; the half-week choice is a volunteer one.
      timing: "full_week",
      roleApplied: null,
      backgroundStatus: null,
      isFirstTimeCounselor: false,
      willingToBecomeLifeguard: false,
      flaggedForDiscussion: false,
      discussionNote: null,
      buddyRequests: Array.isArray(reg.buddy_requests) ? reg.buddy_requests : [],
      signedAt: reg.signed_at ?? null,
      createdAt: reg.created_at ?? null,
      provisionalHold: evaluated.provisionalHoldMessage,
    });
  }

  // --- volunteers ---------------------------------------------------------
  for (const app of staffApps) {
    const age = ageOn(app.birth_date, today);
    // The camp's line between a teen counselor and an adult volunteer is
    // majority; nothing on the application records it directly.
    const population: Population = age !== null && age < 18 ? "teen_volunteer" : "adult_volunteer";
    const records = recordsByStaff.get(app.id) ?? [];
    const audience = population === "teen_volunteer" ? "teen_volunteer" : "adult_volunteer";
    const tally = documentTypes.length ? tallyFor(audience, records) : null;
    const outstandingDocs = documentTypes.length ? outstandingFor(audience, records) : [];

    const evaluated = evaluateRegistration({
      documents: tally,
      outstandingDocuments: outstandingDocs.length ? outstandingDocs : null,
      // Volunteers are not invoiced, so money never holds their status back.
      totalDueCents: 0,
      amountPaidCents: 0,
      formsDueOn,
      rawStatus: app.status,
      today,
    });

    const wl = waitlistByStaff.get(app.id) ?? null;
    const assignment = assignmentByStaff.get(app.id) ?? null;
    const areaIds = areasByStaff.get(app.id) ?? [];

    people.push({
      id: app.id,
      population,
      who: whoCategory({ population, isReturning: returningStaff.has(app.id), isWaitlisted: Boolean(wl) }),
      firstName: app.first_name ?? "",
      lastName: app.last_name ?? "",
      preferredName: null,
      fullName: fullName(app.first_name, app.last_name, "Unnamed volunteer"),
      birthDate: app.birth_date ?? null,
      age,
      gender: null,
      grade: null,
      email: app.email ?? null,
      phone: app.phone ?? null,
      guardianName: null,
      guardianEmail: null,
      guardianPhone: null,
      householdName: null,
      familyId: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      cabinId: assignment?.cabin_id ?? null,
      cabinName: assignment?.cabins?.name ?? null,
      isWaitlisted: Boolean(wl),
      waitlistPosition: wl ? Number(wl.position) : null,
      waitlistStatus: wl?.status ?? null,
      isReturning: returningStaff.has(app.id),
      status: evaluated.status,
      statusLabel: evaluated.label,
      outstanding: evaluated.outstanding,
      documents: tally,
      outstandingDocuments: outstandingDocs,
      paperwork: paperworkLabel(tally),
      payment: "Not invoiced",
      totalDueCents: 0,
      amountPaidCents: 0,
      balanceCents: 0,
      serviceAreaIds: areaIds,
      serviceAreas: areaIds.map((id) => areaById.get(id)?.name ?? "Unassigned"),
      timing: timingFromDays(daysByStaff.get(app.id) ?? [], campDays),
      roleApplied: app.role_applied ?? null,
      backgroundStatus: app.background_status ?? null,
      isFirstTimeCounselor: Boolean(app.is_first_time_counselor),
      willingToBecomeLifeguard: Boolean(app.willing_to_become_lifeguard),
      flaggedForDiscussion: Boolean(app.flagged_for_discussion),
      discussionNote: app.discussion_note ?? null,
      buddyRequests: [],
      signedAt: null,
      createdAt: app.created_at ?? null,
      provisionalHold: evaluated.provisionalHoldMessage,
    });
  }

  // --- finance ------------------------------------------------------------
  const paymentsByInvoice = new Map<string, any[]>();
  for (const p of payments) {
    paymentsByInvoice.set(p.invoice_id, [...(paymentsByInvoice.get(p.invoice_id) ?? []), p]);
  }
  const scheduleByInvoice = new Map<string, any[]>();
  for (const s of scheduleItems) {
    scheduleByInvoice.set(s.invoice_id, [...(scheduleByInvoice.get(s.invoice_id) ?? []), s]);
  }

  const families: FamilyFinanceRow[] = invoices.map((inv) => {
    const schedule = (scheduleByInvoice.get(inv.id) ?? []).sort((a, b) => String(a.due_on).localeCompare(String(b.due_on)));
    const total = Number(inv.total_due_cents ?? 0);
    const paid = Number(inv.amount_paid_cents ?? 0);
    return {
      invoiceId: inv.id,
      familyId: inv.family_id,
      householdName: inv.families?.household_name ?? "Unnamed household",
      camperCount: Number(inv.camper_count ?? 0),
      paymentPlan: inv.payment_plan ?? "pay_in_full",
      totalDueCents: total,
      financialAidCents: Number(inv.financial_aid_cents ?? 0),
      amountPaidCents: paid,
      balanceCents: Math.max(0, total - paid),
      nextDueOn: schedule.find((s) => s.status === "scheduled")?.due_on ?? null,
      contactEmails: (guardiansByFamily.get(inv.family_id) ?? []).map((g) => g.email).filter(Boolean),
      payments: (paymentsByInvoice.get(inv.id) ?? [])
        .map((p) => ({ amountCents: Number(p.amount_cents ?? 0), paidAt: p.paid_at ?? null, status: p.status }))
        .sort((a, b) => String(a.paidAt).localeCompare(String(b.paidAt))),
      schedule: schedule.map((s) => ({
        dueOn: String(s.due_on).slice(0, 10),
        amountCents: Number(s.amount_cents ?? 0),
        status: s.status,
      })),
    };
  });

  const aid: AidRow[] = aidApplications.map((a) => ({
    familyId: a.family_id,
    householdName: a.families?.household_name ?? "Unnamed household",
    requestedCents: a.amount_requested_cents ?? null,
    awardedCents: a.amount_awarded_cents ?? null,
    status: a.status,
    decidedAt: a.decided_at ?? null,
    narrative: a.narrative ?? null,
  }));

  return {
    seasonId,
    seasonYear: season?.year ?? null,
    formsDueOn,
    people,
    cabins: occupancy.map((c) => ({
      cabinId: c.cabin_id,
      name: c.name ?? "Unnamed cabin",
      gender: c.gender ?? null,
      minGrade: c.min_grade ?? null,
      maxGrade: c.max_grade ?? null,
      capacity: Number(c.capacity ?? 0),
      assigned: Number(c.campers_assigned ?? 0),
      remaining: Number(c.spots_remaining ?? 0),
      isOpen: c.is_open ?? true,
    })),
    serviceAreas: serviceAreas
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((s) => ({ id: s.id, name: s.name })),
    families,
    aid,
    generatedAt: today,
  };
}

/** Narrows the loaded people to what the admin asked for on the export screen. */
export function applyFilters(people: PersonRow[], f: ExportFilters): PersonRow[] {
  return people.filter((p) => {
    if (f.population.length && !f.population.includes(p.population)) return false;
    if (f.status.length && !f.status.includes(p.status)) return false;
    if (f.grade.length && (p.grade === null || !f.grade.includes(p.grade))) return false;
    if (f.gender.length && !f.gender.includes((p.gender ?? "").toLowerCase())) return false;
    if (f.cabin.length && (!p.cabinId || !f.cabin.includes(p.cabinId))) return false;
    if (f.serviceArea.length && !p.serviceAreaIds.some((id) => f.serviceArea.includes(id))) return false;
    if (f.who.length && !f.who.includes(p.who)) return false;
    if (f.timing.length && !f.timing.includes(p.timing)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Workbook plumbing
// ---------------------------------------------------------------------------

type Column = { header: string; key: string; width?: number };

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1B4D3E" }, // forest-800, so the files look like the app
};

/**
 * Adds a sheet with the treatment every sheet in these workbooks gets: a bold
 * header row frozen in place and autofilter across the whole used range, so the
 * team can sort by any column the moment the file opens.
 */
function addSheet(wb: ExcelJS.Workbook, name: string, columns: Column[], data: Record<string, unknown>[]) {
  // Excel rejects sheet names over 31 characters or containing []:*?/\
  const safeName = name.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);
  const sheet = wb.addWorksheet(safeName, { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 24;

  for (const row of data) sheet.addRow(row);

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, data.length + 1), column: columns.length },
  };

  return sheet;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function dateOnly(value: string | null | undefined): string {
  return value ? String(value).slice(0, 10) : "";
}

function money(cents: number): string {
  return formatCents(cents ?? 0);
}

// ---------------------------------------------------------------------------
// The four workbooks
// ---------------------------------------------------------------------------

function buildMaster(wb: ExcelJS.Workbook, data: ExportData, people: PersonRow[]) {
  const common: Column[] = [
    { header: "Name", key: "name", width: 26 },
    { header: "Preferred name", key: "preferred", width: 16 },
    { header: "Who", key: "who", width: 22 },
    { header: "Registration status", key: "status", width: 18 },
    { header: "Date of birth", key: "dob", width: 14 },
    { header: "Age", key: "age", width: 6 },
  ];

  const camperColumns: Column[] = [
    ...common,
    { header: "Gender", key: "gender", width: 10 },
    { header: "Grade entering", key: "grade", width: 14 },
    { header: "Cabin", key: "cabin", width: 16 },
    { header: "Waitlisted", key: "waitlisted", width: 11 },
    { header: "Waitlist position", key: "waitlistPosition", width: 15 },
    { header: "Household", key: "household", width: 24 },
    { header: "Guardian", key: "guardian", width: 22 },
    { header: "Guardian email", key: "email", width: 28 },
    { header: "Guardian phone", key: "phone", width: 16 },
    { header: "Address", key: "address", width: 28 },
    { header: "City", key: "city", width: 16 },
    { header: "State", key: "state", width: 8 },
    { header: "ZIP", key: "zip", width: 10 },
    { header: "Documents approved", key: "docsApproved", width: 18 },
    { header: "Documents required", key: "docsRequired", width: 18 },
    { header: "Documents outstanding", key: "docsOutstanding", width: 34 },
    { header: "Paperwork status", key: "paperwork", width: 18 },
    { header: "Payment status", key: "payment", width: 16 },
    { header: "Total due", key: "totalDue", width: 13 },
    { header: "Paid to date", key: "paid", width: 13 },
    { header: "Still due", key: "balance", width: 13 },
    { header: "Buddy requests", key: "buddies", width: 22 },
    { header: "Signed at", key: "signedAt", width: 20 },
    { header: "Registered", key: "createdAt", width: 20 },
    { header: "Provisional hold notice", key: "hold", width: 60 },
  ];

  addSheet(
    wb,
    "Campers",
    camperColumns,
    people
      .filter((p) => p.population === "camper")
      .map((p) => ({
        name: p.fullName,
        preferred: p.preferredName ?? "",
        who: WHO_LABELS[p.who],
        status: p.statusLabel,
        dob: dateOnly(p.birthDate),
        age: p.age ?? "",
        gender: p.gender ?? "",
        grade: p.grade ?? "",
        cabin: p.cabinName ?? (p.isWaitlisted ? "Waitlist" : "Unassigned"),
        waitlisted: yesNo(p.isWaitlisted),
        waitlistPosition: p.waitlistPosition ?? "",
        household: p.householdName ?? "",
        guardian: p.guardianName ?? "",
        email: p.guardianEmail ?? "",
        phone: p.guardianPhone ?? "",
        address: p.address ?? "",
        city: p.city ?? "",
        state: p.state ?? "",
        zip: p.zip ?? "",
        docsApproved: p.documents?.requiredApproved ?? 0,
        docsRequired: p.documents?.requiredTotal ?? 0,
        docsOutstanding: p.outstandingDocuments.map((d) => d.name).join("; "),
        paperwork: p.paperwork,
        payment: p.payment,
        totalDue: money(p.totalDueCents),
        paid: money(p.amountPaidCents),
        balance: money(p.balanceCents),
        buddies: p.buddyRequests.join("; "),
        signedAt: p.signedAt ?? "",
        createdAt: p.createdAt ?? "",
        hold: p.provisionalHold ?? "",
      }))
  );

  const volunteerColumns: Column[] = [
    ...common,
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Role applied for", key: "role", width: 22 },
    { header: "Application status", key: "appStatus", width: 18 },
    { header: "Background check", key: "background", width: 18 },
    { header: "Service areas", key: "areas", width: 24 },
    { header: "Timing", key: "timing", width: 14 },
    { header: "Cabin", key: "cabin", width: 16 },
    { header: "Waitlisted", key: "waitlisted", width: 11 },
    { header: "First-time counselor", key: "firstTime", width: 18 },
    { header: "Willing to become a lifeguard", key: "lifeguard", width: 26 },
    { header: "Flag for discussion", key: "flagged", width: 16 },
    { header: "Discussion note", key: "note", width: 40 },
    { header: "Documents approved", key: "docsApproved", width: 18 },
    { header: "Documents required", key: "docsRequired", width: 18 },
    { header: "Documents outstanding", key: "docsOutstanding", width: 34 },
    { header: "Paperwork status", key: "paperwork", width: 18 },
    { header: "Applied", key: "createdAt", width: 20 },
  ];

  const volunteerRow = (p: PersonRow) => ({
    name: p.fullName,
    preferred: "",
    who: WHO_LABELS[p.who],
    status: p.statusLabel,
    dob: dateOnly(p.birthDate),
    age: p.age ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    role: p.roleApplied ?? "",
    appStatus: p.statusLabel,
    background: p.backgroundStatus ?? "",
    areas: p.serviceAreas.join("; "),
    timing: TIMING_LABELS[p.timing],
    cabin: p.cabinName ?? "",
    waitlisted: yesNo(p.isWaitlisted),
    firstTime: yesNo(p.isFirstTimeCounselor),
    lifeguard: yesNo(p.willingToBecomeLifeguard),
    flagged: yesNo(p.flaggedForDiscussion),
    note: p.discussionNote ?? "",
    docsApproved: p.documents?.requiredApproved ?? 0,
    docsRequired: p.documents?.requiredTotal ?? 0,
    docsOutstanding: p.outstandingDocuments.map((d) => d.name).join("; "),
    paperwork: p.paperwork,
    createdAt: p.createdAt ?? "",
  });

  addSheet(wb, "Teen volunteers", volunteerColumns, people.filter((p) => p.population === "teen_volunteer").map(volunteerRow));
  addSheet(wb, "Adult volunteers", volunteerColumns, people.filter((p) => p.population === "adult_volunteer").map(volunteerRow));

  addSheet(
    wb,
    "Documentation status",
    [
      { header: "Name", key: "name", width: 26 },
      { header: "Population", key: "population", width: 18 },
      { header: "Document", key: "document", width: 32 },
      { header: "Status", key: "status", width: 14 },
    ],
    people.flatMap((p) =>
      p.outstandingDocuments.map((d) => ({
        name: p.fullName,
        population: p.population.replace("_", " "),
        document: d.name,
        status: d.status,
      }))
    )
  );

  addSheet(
    wb,
    "Report info",
    [
      { header: "Field", key: "field", width: 26 },
      { header: "Value", key: "value", width: 80 },
    ],
    [
      { field: "Report", value: REPORT_META.master.title },
      { field: "Season", value: data.seasonYear ?? "No active season" },
      { field: "Forms due on", value: data.formsDueOn ?? "Not set" },
      { field: "Generated", value: data.generatedAt.toISOString() },
      { field: "Rows included", value: people.length },
      { field: "Provisional hold wording", value: PROVISIONAL_HOLD_MESSAGE },
    ]
  );
}

function buildSortable(wb: ExcelJS.Workbook, data: ExportData, people: PersonRow[]) {
  // One wide sheet on purpose: the camp sorts and re-sorts a single table
  // rather than flipping between tabs.
  const columns: Column[] = [
    { header: "Name", key: "name", width: 26 },
    { header: "Who", key: "who", width: 24 },
    { header: "Population", key: "population", width: 18 },
    { header: "Registration status", key: "status", width: 18 },
    { header: "Grade", key: "grade", width: 8 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Cabin", key: "cabin", width: 16 },
    { header: "Payment status", key: "payment", width: 16 },
    { header: "Paperwork status", key: "paperwork", width: 20 },
    { header: "Area of service", key: "areas", width: 24 },
    { header: "Timing", key: "timing", width: 14 },
    { header: "First-time counselor", key: "firstTime", width: 18 },
    { header: "Willing to become a lifeguard", key: "lifeguard", width: 26 },
    { header: "Flag for discussion", key: "flagged", width: 16 },
    { header: "Returning", key: "returning", width: 11 },
    { header: "Waitlisted", key: "waitlisted", width: 11 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Still outstanding", key: "outstanding", width: 44 },
  ];

  const toRow = (p: PersonRow) => ({
    name: p.fullName,
    who: WHO_LABELS[p.who],
    population: p.population.replace("_", " "),
    status: p.statusLabel,
    grade: p.grade ?? "",
    gender: p.gender ?? "",
    cabin: p.cabinName ?? (p.isWaitlisted ? "Waitlist" : ""),
    payment: p.payment,
    paperwork: p.paperwork,
    areas: p.serviceAreas.join("; "),
    timing: TIMING_LABELS[p.timing],
    firstTime: yesNo(p.isFirstTimeCounselor),
    lifeguard: yesNo(p.willingToBecomeLifeguard),
    flagged: yesNo(p.flaggedForDiscussion),
    returning: yesNo(p.isReturning),
    waitlisted: yesNo(p.isWaitlisted),
    email: p.email ?? p.guardianEmail ?? "",
    phone: p.phone ?? p.guardianPhone ?? "",
    outstanding: p.outstanding.join("; "),
  });

  addSheet(wb, "All registrants", columns, people.map(toRow));
  addSheet(wb, "Campers", columns, people.filter((p) => p.population === "camper").map(toRow));
  addSheet(wb, "Teen volunteers", columns, people.filter((p) => p.population === "teen_volunteer").map(toRow));
  addSheet(wb, "Adult volunteers", columns, people.filter((p) => p.population === "adult_volunteer").map(toRow));
  addSheet(wb, "Flagged for discussion", columns, people.filter((p) => p.flaggedForDiscussion).map(toRow));
  addSheet(wb, "Waitlisted", columns, people.filter((p) => p.isWaitlisted).map(toRow));

  addSheet(
    wb,
    "Counts by category",
    [
      { header: "Category", key: "category", width: 30 },
      { header: "Value", key: "value", width: 24 },
      { header: "Count", key: "count", width: 10 },
    ],
    [
      ...Object.entries(WHO_LABELS).map(([key, label]) => ({
        category: "Who",
        value: label,
        count: people.filter((p) => p.who === key).length,
      })),
      ...Object.entries(STATUS_LABELS).map(([key, label]) => ({
        category: "Registration status",
        value: label,
        count: people.filter((p) => p.status === key).length,
      })),
      ...Object.entries(TIMING_LABELS).map(([key, label]) => ({
        category: "Timing",
        value: label,
        count: people.filter((p) => p.timing === key).length,
      })),
      ...data.serviceAreas.map((a) => ({
        category: "Area of service",
        value: a.name,
        count: people.filter((p) => p.serviceAreaIds.includes(a.id)).length,
      })),
    ]
  );
}

function buildCabins(wb: ExcelJS.Workbook, data: ExportData, people: PersonRow[]) {
  const campers = people.filter((p) => p.population === "camper");

  const columns: Column[] = [
    { header: "Cabin", key: "cabin", width: 18 },
    { header: "Camper", key: "name", width: 26 },
    { header: "Grade", key: "grade", width: 8 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Registration status", key: "status", width: 18 },
    { header: "Guardian", key: "guardian", width: 22 },
    { header: "Guardian phone", key: "phone", width: 16 },
    { header: "Buddy requests", key: "buddies", width: 24 },
  ];

  const assigned = campers
    .filter((p) => p.cabinId && !p.isWaitlisted)
    .sort((a, b) => (a.cabinName ?? "").localeCompare(b.cabinName ?? "") || a.lastName.localeCompare(b.lastName))
    .map((p) => ({
      cabin: p.cabinName ?? "",
      name: p.fullName,
      grade: p.grade ?? "",
      gender: p.gender ?? "",
      status: p.statusLabel,
      guardian: p.guardianName ?? "",
      phone: p.guardianPhone ?? "",
      buddies: p.buddyRequests.join("; "),
    }));

  addSheet(wb, "Cabin assignments", columns, assigned);

  addSheet(
    wb,
    "Unassigned campers",
    columns,
    campers
      .filter((p) => !p.cabinId && !p.isWaitlisted)
      .map((p) => ({
        cabin: "Unassigned",
        name: p.fullName,
        grade: p.grade ?? "",
        gender: p.gender ?? "",
        status: p.statusLabel,
        guardian: p.guardianName ?? "",
        phone: p.guardianPhone ?? "",
        buddies: p.buddyRequests.join("; "),
      }))
  );

  addSheet(
    wb,
    "Waitlist",
    [
      { header: "Position", key: "position", width: 10 },
      { header: "Camper", key: "name", width: 26 },
      { header: "Grade", key: "grade", width: 8 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Waitlist status", key: "waitlistStatus", width: 16 },
      { header: "Registration status", key: "status", width: 18 },
      { header: "Guardian", key: "guardian", width: 22 },
      { header: "Guardian email", key: "email", width: 28 },
      { header: "Guardian phone", key: "phone", width: 16 },
    ],
    campers
      .filter((p) => p.isWaitlisted)
      .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0))
      .map((p) => ({
        position: p.waitlistPosition ?? "",
        name: p.fullName,
        grade: p.grade ?? "",
        gender: p.gender ?? "",
        waitlistStatus: p.waitlistStatus ?? "",
        status: p.statusLabel,
        guardian: p.guardianName ?? "",
        email: p.guardianEmail ?? "",
        phone: p.guardianPhone ?? "",
      }))
  );

  addSheet(
    wb,
    "Cabin capacity",
    [
      { header: "Cabin", key: "name", width: 20 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Grades", key: "grades", width: 12 },
      { header: "Capacity", key: "capacity", width: 10 },
      { header: "Assigned", key: "assigned", width: 10 },
      { header: "Spots remaining", key: "remaining", width: 16 },
      { header: "Open", key: "open", width: 8 },
    ],
    data.cabins.map((c) => ({
      name: c.name,
      gender: c.gender ?? "",
      grades: [c.minGrade, c.maxGrade].filter((g) => g !== null).join("-"),
      capacity: c.capacity,
      assigned: c.assigned,
      remaining: c.remaining,
      open: yesNo(c.isOpen),
    }))
  );
}

function buildFinancial(wb: ExcelJS.Workbook, data: ExportData) {
  addSheet(
    wb,
    "Family payment status",
    [
      { header: "Household", key: "household", width: 28 },
      { header: "Campers", key: "campers", width: 9 },
      { header: "Payment plan", key: "plan", width: 16 },
      { header: "Total due", key: "total", width: 13 },
      { header: "Financial aid", key: "aid", width: 13 },
      { header: "Paid to date", key: "paid", width: 13 },
      { header: "Still due", key: "balance", width: 13 },
      { header: "Next payment due", key: "next", width: 16 },
      { header: "Contact emails", key: "emails", width: 34 },
    ],
    data.families.map((f) => ({
      household: f.householdName,
      campers: f.camperCount,
      plan: f.paymentPlan.replace(/_/g, " "),
      total: money(f.totalDueCents),
      aid: money(f.financialAidCents),
      paid: money(f.amountPaidCents),
      balance: money(f.balanceCents),
      next: dateOnly(f.nextDueOn),
      emails: f.contactEmails.join("; "),
    }))
  );

  addSheet(
    wb,
    "Payments made",
    [
      { header: "Household", key: "household", width: 28 },
      { header: "Amount", key: "amount", width: 13 },
      { header: "Date", key: "date", width: 20 },
      { header: "Status", key: "status", width: 16 },
    ],
    data.families.flatMap((f) =>
      f.payments.map((p) => ({
        household: f.householdName,
        amount: money(p.amountCents),
        date: p.paidAt ?? "",
        status: p.status,
      }))
    )
  );

  addSheet(
    wb,
    "Payment schedule",
    [
      { header: "Household", key: "household", width: 28 },
      { header: "Due on", key: "due", width: 14 },
      { header: "Amount", key: "amount", width: 13 },
      { header: "Status", key: "status", width: 14 },
    ],
    data.families.flatMap((f) =>
      f.schedule.map((s) => ({
        household: f.householdName,
        due: s.dueOn,
        amount: money(s.amountCents),
        status: s.status,
      }))
    )
  );

  addSheet(
    wb,
    "Financial aid applications",
    [
      { header: "Household", key: "household", width: 28 },
      { header: "Status", key: "status", width: 16 },
      { header: "Requested", key: "requested", width: 13 },
      { header: "Awarded", key: "awarded", width: 13 },
      { header: "Decided", key: "decided", width: 20 },
      { header: "Narrative", key: "narrative", width: 60 },
    ],
    data.aid.map((a) => ({
      household: a.householdName,
      status: a.status,
      requested: a.requestedCents === null ? "" : money(a.requestedCents),
      awarded: a.awardedCents === null ? "" : money(a.awardedCents),
      decided: a.decidedAt ?? "",
      narrative: a.narrative ?? "",
    }))
  );

  addSheet(
    wb,
    "Have not paid in full",
    [
      { header: "Household", key: "household", width: 28 },
      { header: "Total due", key: "total", width: 13 },
      { header: "Paid to date", key: "paid", width: 13 },
      { header: "Still due", key: "balance", width: 13 },
      { header: "Next payment due", key: "next", width: 16 },
      { header: "Contact emails", key: "emails", width: 34 },
    ],
    data.families
      .filter((f) => f.balanceCents > 0)
      .sort((a, b) => b.balanceCents - a.balanceCents)
      .map((f) => ({
        household: f.householdName,
        total: money(f.totalDueCents),
        paid: money(f.amountPaidCents),
        balance: money(f.balanceCents),
        next: dateOnly(f.nextDueOn),
        emails: f.contactEmails.join("; "),
      }))
  );
}

/** Builds the requested workbook and hands back the xlsx bytes. */
export async function buildWorkbook(report: ReportKey, data: ExportData, filters: ExportFilters): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CamperRoster";
  wb.created = data.generatedAt;

  const people = applyFilters(data.people, filters);

  switch (report) {
    case "master":
      buildMaster(wb, data, people);
      break;
    case "sortable":
      buildSortable(wb, data, people);
      break;
    case "cabins":
      buildCabins(wb, data, people);
      break;
    case "financial":
      buildFinancial(wb, data);
      break;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function workbookFilename(report: ReportKey, data: ExportData): string {
  const stamp = data.generatedAt.toISOString().slice(0, 10);
  const season = data.seasonYear ? `-${data.seasonYear}` : "";
  return `${REPORT_META[report].filename}${season}-${stamp}.xlsx`;
}

export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
