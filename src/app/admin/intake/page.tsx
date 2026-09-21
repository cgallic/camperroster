import Link from "next/link";
import StaffHeader from "@/components/StaffHeader";
import { PageHeader, PageShell, StatCard, StatStrip } from "@/components/ui";
import { requireArea } from "@/lib/auth";
import { humanizeIntakeValue, type CustomIntakeRow, type RegistrationIntakeRow, type VolunteerIntakeRow } from "@/lib/intake";
import { createClient } from "@/lib/supabase/server";
import IntakeClient from "./IntakeClient";

export const dynamic = "force-dynamic";

type DbRow = Record<string, any>;

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function byId(rows: DbRow[] | null): Map<string, DbRow> {
  return new Map((rows ?? []).map((row) => [String(row.id), row]));
}

async function rowsByIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "campers" | "guardians" | "camp_sessions" | "form_definitions" | "registration_periods" | "form_fields",
  columns: string,
  campId: string,
  ids: string[],
) {
  if (ids.length === 0) return [] as DbRow[];
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("camp_id", campId)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as DbRow[];
}

export default async function AdminIntakePage() {
  const membership = await requireArea("admin", "/admin/intake");
  const supabase = await createClient();

  const [registrationResult, volunteerResult, customResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, camper_id, guardian_id, session_id, status, payment_plan, created_at", { count: "exact" })
      .eq("camp_id", membership.campId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("staff_applications")
      .select("id, first_name, last_name, email, phone, role_applied, status, background_status, created_at", { count: "exact" })
      .eq("camp_id", membership.campId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("form_submissions")
      .select("id, form_id, answers, submitted_at, created_at", { count: "exact" })
      .eq("camp_id", membership.campId)
      .is("registration_id", null)
      .is("staff_application_id", null)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(500),
  ]);

  for (const result of [registrationResult, volunteerResult, customResult]) {
    if (result.error) throw result.error;
  }

  const registrations = (registrationResult.data ?? []) as DbRow[];
  const volunteers = (volunteerResult.data ?? []) as DbRow[];
  const customSubmissions = (customResult.data ?? []) as DbRow[];

  const [campers, guardians, sessions, definitions] = await Promise.all([
    rowsByIds(supabase, "campers", "id, legal_first_name, legal_last_name, preferred_name", membership.campId, unique(registrations.map((row) => row.camper_id))),
    rowsByIds(supabase, "guardians", "id, first_name, last_name, email, phone", membership.campId, unique(registrations.map((row) => row.guardian_id))),
    rowsByIds(supabase, "camp_sessions", "id, name", membership.campId, unique(registrations.map((row) => row.session_id))),
    rowsByIds(supabase, "form_definitions", "id, title, period_id", membership.campId, unique(customSubmissions.map((row) => row.form_id))),
  ]);

  const definitionIds = definitions.map((row) => String(row.id));
  const periodIds = unique(definitions.map((row) => row.period_id));
  const [periods, fields] = await Promise.all([
    rowsByIds(supabase, "registration_periods", "id, audience, name", membership.campId, periodIds),
    definitionIds.length
      ? supabase
          .from("form_fields")
          .select("id, form_id, field_key, label, display_order")
          .eq("camp_id", membership.campId)
          .in("form_id", definitionIds)
          .order("display_order")
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as DbRow[];
          })
      : Promise.resolve([] as DbRow[]),
  ]);

  const camperMap = byId(campers);
  const guardianMap = byId(guardians);
  const sessionMap = byId(sessions);
  const definitionMap = byId(definitions);
  const periodMap = byId(periods);

  const registrationRows: RegistrationIntakeRow[] = registrations.map((row) => {
    const camper = camperMap.get(String(row.camper_id));
    const guardian = guardianMap.get(String(row.guardian_id));
    const session = sessionMap.get(String(row.session_id));
    return {
      id: String(row.id),
      camperName: camper
        ? `${camper.preferred_name || camper.legal_first_name} ${camper.legal_last_name}`.trim()
        : "Camper record unavailable",
      guardianName: guardian ? `${guardian.first_name} ${guardian.last_name}`.trim() : "Guardian record unavailable",
      guardianEmail: String(guardian?.email ?? ""),
      guardianPhone: String(guardian?.phone ?? ""),
      sessionName: String(session?.name ?? ""),
      status: String(row.status ?? "submitted"),
      paymentPlan: String(row.payment_plan ?? ""),
      submittedAt: String(row.created_at ?? ""),
    };
  });

  const volunteerRows: VolunteerIntakeRow[] = volunteers.map((row) => ({
    id: String(row.id),
    applicantName: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Applicant name unavailable",
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    role: String(row.role_applied ?? "Not specified"),
    status: String(row.status ?? "submitted"),
    backgroundStatus: String(row.background_status ?? ""),
    submittedAt: String(row.created_at ?? ""),
  }));

  const labelsByForm = new Map<string, Map<string, string>>();
  for (const field of fields) {
    const formId = String(field.form_id);
    const labels = labelsByForm.get(formId) ?? new Map<string, string>();
    labels.set(String(field.field_key), String(field.label));
    labelsByForm.set(formId, labels);
  }

  const customRows: CustomIntakeRow[] = customSubmissions.map((row) => {
    const formId = String(row.form_id);
    const definition = definitionMap.get(formId);
    const period = definition ? periodMap.get(String(definition.period_id)) : undefined;
    const labels = labelsByForm.get(formId) ?? new Map<string, string>();
    const answers = row.answers && typeof row.answers === "object" && !Array.isArray(row.answers)
      ? Object.entries(row.answers as Record<string, unknown>).map(([key, value]) => ({
          label: labels.get(key) ?? key.replace(/_/g, " "),
          value: humanizeIntakeValue(value),
        }))
      : [];
    return {
      id: String(row.id),
      formTitle: String(definition?.title ?? period?.name ?? "Custom registration form"),
      audience: String(period?.audience ?? "custom response"),
      submittedAt: String(row.submitted_at ?? row.created_at ?? ""),
      answers,
    };
  });

  const totals = {
    registrations: registrationResult.count ?? registrationRows.length,
    volunteers: volunteerResult.count ?? volunteerRows.length,
    custom: customResult.count ?? customRows.length,
  };

  return (
    <>
      <StaffHeader />
      <PageShell>
        <PageHeader
          eyebrow="Director & registrar"
          title="Current Intake"
          description="Every current camper registration, volunteer application, and standalone custom-form response for this camp."
          actions={
            <Link href="/admin/forms" className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50">
              Manage public forms
            </Link>
          }
        />
        <StatStrip>
          <StatCard label="Camper registrations" value={totals.registrations} tone={totals.registrations ? "pending" : "neutral"} hint="Current intake only." />
          <StatCard label="Volunteer applications" value={totals.volunteers} tone={totals.volunteers ? "pending" : "neutral"} hint="Submitted through this camp's link." />
          <StatCard label="Standalone form responses" value={totals.custom} tone={totals.custom ? "pending" : "neutral"} hint="Responses not yet linked to a roster row." />
        </StatStrip>
        <IntakeClient registrations={registrationRows} volunteers={volunteerRows} custom={customRows} totals={totals} />
      </PageShell>
    </>
  );
}

