import { redirect } from "next/navigation";
import { campUsesPeriodForms, lookupCampBySlug } from "@/lib/campLookup";
import { normalizeSlug } from "@/lib/formContracts";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

/**
 * Old /register?camp=<slug> links are still out there. A camp that takes
 * registrations through period forms (/register/<audience>) is sent to its
 * camp page, which lists those forms; this generic form would skip the
 * camp's registration windows. Everything else renders the form unchanged.
 */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ camp?: string }> }) {
  const { camp } = await searchParams;
  const slug = normalizeSlug(camp ?? "");
  if (slug) {
    const lookup = await lookupCampBySlug(slug);
    if (lookup.status === "found" && (await campUsesPeriodForms(lookup.camp.id))) {
      redirect(`/c/${encodeURIComponent(lookup.camp.slug)}`);
    }
  }
  return <RegisterForm />;
}
