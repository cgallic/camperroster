import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import ExportsClient from "./ExportsClient";

export const dynamic = "force-dynamic";

/**
 * The reports screen. It loads only the small lists the filters need — cabins,
 * service areas, grades — and never builds a workbook: the download itself goes
 * through /api/exports, so opening this page costs a handful of cheap queries.
 */
export default async function ExportsPage() {
  const membership = await requireArea("admin", "/admin/exports");
  const supabase = await createClient();

  const [{ data: cabins }, { data: areas }, { data: campers }, { data: season }, { data: templates }] =
    await Promise.all([
      supabase.from("cabins").select("id, name, gender, sort_order").order("sort_order"),
      supabase.from("service_areas").select("id, name, display_order").order("display_order"),
      supabase.from("campers").select("grade_entering, gender"),
      supabase.from("seasons").select("year, forms_due_on").eq("is_active", true).limit(1).maybeSingle(),
      supabase.from("email_templates").select("id, code, name, subject, body").order("name"),
    ]);

  const grades = [
    ...new Set(((campers ?? []) as { grade_entering: number | null }[]).map((c) => c.grade_entering)),
  ]
    .filter((g): g is number => typeof g === "number")
    .sort((a, b) => a - b);

  const genders = [...new Set(((campers ?? []) as { gender: string | null }[]).map((c) => c.gender))]
    .filter((g): g is string => Boolean(g))
    .sort();

  return (
    <>
      <StaffHeader />
      <ExportsClient
        role={membership.role}
        cabins={(cabins ?? []).map((c) => ({ id: c.id, name: c.name ?? "Unnamed cabin" }))}
        serviceAreas={(areas ?? []).map((a) => ({ id: a.id, name: a.name }))}
        grades={grades}
        genders={genders}
        seasonYear={season?.year ?? null}
        formsDueOn={season?.forms_due_on ?? null}
        templates={(templates ?? []).map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          subject: t.subject,
          body: t.body,
        }))}
      />
    </>
  );
}
