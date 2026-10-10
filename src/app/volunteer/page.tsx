import { redirect } from "next/navigation";
import { campUsesPeriodForms, lookupCampBySlug } from "@/lib/campLookup";
import { normalizeSlug } from "@/lib/formContracts";
import VolunteerForm from "./VolunteerForm";

export const dynamic = "force-dynamic";

/** Same legacy-link redirect as /register; see the note in src/app/register/page.tsx. */
export default async function VolunteerPage({ searchParams }: { searchParams: Promise<{ camp?: string }> }) {
  const { camp } = await searchParams;
  const slug = normalizeSlug(camp ?? "");
  if (slug) {
    const lookup = await lookupCampBySlug(slug);
    if (lookup.status === "found" && (await campUsesPeriodForms(lookup.camp.id))) {
      redirect(`/c/${encodeURIComponent(lookup.camp.slug)}`);
    }
  }
  return <VolunteerForm />;
}
