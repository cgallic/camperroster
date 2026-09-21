import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import ParentPortalClient from "./ParentPortalClient";

export const dynamic = "force-dynamic";

export default async function ParentPortalRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);
  if (!user.email) redirect("/login?reason=missing_email");

  const db = createAdminClient();
  const escapedEmail = user.email.replace(/[%_]/g, "\\$&");
  const { data: guardians } = await db
    .from("guardians")
    .select("id, camp_id, family_id, first_name, last_name, email")
    .or(`auth_user_id.eq.${user.id},email.ilike.${escapedEmail}`);

  // The first verified sign-in claims guardian rows with the same email. The
  // browser never supplies a guardian id, so one parent cannot claim another.
  await db.from("guardians").update({ auth_user_id: user.id }).ilike("email", escapedEmail).is("auth_user_id", null);

  const guardianRows = guardians ?? [];
  const guardianIds = guardianRows.map((row) => row.id);
  const familyIds = [...new Set(guardianRows.map((row) => row.family_id).filter((id): id is string => Boolean(id)))];
  const [familyCampers, directCampers, invoiceRows] = await Promise.all([
    familyIds.length
      ? db.from("campers").select("id, camp_id, family_id, guardian_id, legal_first_name, legal_last_name, birth_date, grade_entering").in("family_id", familyIds)
      : Promise.resolve({ data: [] }),
    guardianIds.length
      ? db.from("campers").select("id, camp_id, family_id, guardian_id, legal_first_name, legal_last_name, birth_date, grade_entering").in("guardian_id", guardianIds)
      : Promise.resolve({ data: [] }),
    familyIds.length
      ? db.from("family_invoices").select("id, camp_id, family_id, total_due_cents, amount_paid_cents, amount_refunded_cents, payment_plan").in("family_id", familyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const camperMap = new Map<string, NonNullable<typeof familyCampers.data>[number]>();
  for (const camper of [...(familyCampers.data ?? []), ...(directCampers.data ?? [])]) camperMap.set(camper.id, camper);
  const campers = [...camperMap.values()];
  const camperIds = campers.map((row) => row.id);
  const invoices = invoiceRows.data ?? [];

  const [{ data: registrations }, { data: documents }, { data: schedules }] = await Promise.all([
    camperIds.length
      ? db.from("registrations").select("id, camp_id, camper_id, session_id, status, checked_in, cabin_name, counselor_name, canteen_balance_cents, created_at").in("camper_id", camperIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    camperIds.length
      ? db.from("document_records").select("id, camper_id, status, document_types(name)").in("camper_id", camperIds)
      : Promise.resolve({ data: [] }),
    invoices.length
      ? db.from("payment_schedule_items").select("id, invoice_id, due_on, amount_cents, status").in("invoice_id", invoices.map((row) => row.id)).order("due_on")
      : Promise.resolve({ data: [] }),
  ]);

  const campIds = [...new Set(guardianRows.map((row) => row.camp_id).filter((id): id is string => Boolean(id)))];
  const sessionIds = [...new Set((registrations ?? []).map((row) => row.session_id).filter((id): id is string => Boolean(id)))];
  const [{ data: camps }, { data: sessions }] = await Promise.all([
    campIds.length ? db.from("camps").select("id, name, slug").in("id", campIds) : Promise.resolve({ data: [] }),
    sessionIds.length ? db.from("camp_sessions").select("id, name, start_date, end_date").in("id", sessionIds) : Promise.resolve({ data: [] }),
  ]);

  return <ParentPortalClient email={user.email} campers={campers} registrations={registrations ?? []} camps={camps ?? []} sessions={sessions ?? []} invoices={invoices.map((invoice) => ({ ...invoice, total_due_cents: invoice.total_due_cents ?? 0 }))} schedules={schedules ?? []} documents={(documents ?? []).map((row) => ({ id: row.id, camper_id: row.camper_id, status: row.status, name: Array.isArray(row.document_types) ? row.document_types[0]?.name ?? "Document" : row.document_types?.name ?? "Document" }))} />;
}
