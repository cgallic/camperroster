import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarX } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import {
  AUDIENCE_LABELS,
  FORM_AUDIENCES,
  canViewPeriod,
  normalizeOptions,
  type FormAudience,
  type FormField,
  type RegistrationPeriod,
} from "@/lib/forms";
import PublicFormClient from "./PublicFormClient";
import { lookupCampBySlug } from "@/lib/campLookup";
import { normalizeSlug } from "@/lib/formContracts";

export const dynamic = "force-dynamic";

export default async function PublicRegistrationFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ audience: string }>;
  searchParams: Promise<{ token?: string; camp?: string }>;
}) {
  const { audience } = await params;
  const { token, camp: rawCamp } = await searchParams;
  if (!FORM_AUDIENCES.includes(audience as FormAudience)) notFound();

  const campSlug = normalizeSlug(rawCamp ?? "");
  const campLookup = await lookupCampBySlug(campSlug);
  if (campLookup.status !== "found") {
    return <ClosedNotice name="Registration" noCamp />;
  }

  // Public intake has no session, so RLS has no user to evaluate; the service
  // client reads the published form and the window is enforced here.
  const supabase = createAdminClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("camp_id", campLookup.camp.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { data: periodRow } = season
    ? await supabase
        .from("registration_periods")
        .select("*")
        .eq("camp_id", campLookup.camp.id)
        .eq("season_id", season.id)
        .eq("audience", audience)
        .maybeSingle()
    : { data: null };

  const period = periodRow as RegistrationPeriod | null;
  const label = AUDIENCE_LABELS[audience as FormAudience];

  if (!period || !canViewPeriod(period, token ?? null)) {
    // A public period that hasn't opened yet tells the family when to come back.
    const opensAt =
      period && period.visibility === "public" && period.opens_at && new Date(period.opens_at) > new Date()
        ? period.opens_at
        : null;
    return (
      <ClosedNotice label={label} name={period?.name ?? label} opensAt={opensAt} campSlug={campLookup.camp.slug} />
    );
  }

  const { data: definition } = await supabase
    .from("form_definitions")
    .select("id, title, intro_text, success_text, version")
    .eq("camp_id", campLookup.camp.id)
    .eq("period_id", period.id)
    .not("published_at", "is", null)
    .maybeSingle();

  if (!definition) return <ClosedNotice label={label} name={period.name} noForm campSlug={campLookup.camp.slug} />;

  const { data: fieldRows } = await supabase
    .from("form_fields")
    .select("*")
    .eq("camp_id", campLookup.camp.id)
    .eq("form_id", definition.id)
    .order("display_order");

  const fields = ((fieldRows as FormField[] | null) ?? []).map((f) => ({
    ...f,
    options: normalizeOptions(f.options),
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">
          {campLookup.camp.name} &bull; {label}
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900 mt-3">{definition.title}</h1>
        {definition.intro_text && <p className="text-stone-600 mt-2 whitespace-pre-line">{definition.intro_text}</p>}
      </div>

      <PublicFormClient
        formId={definition.id}
        audience={audience as FormAudience}
        token={token ?? null}
        fields={fields}
        successText={definition.success_text}
      />
    </main>
  );
}

function ClosedNotice({
  label,
  name,
  noForm,
  noCamp,
  opensAt,
  campSlug,
}: {
  label?: string;
  name: string;
  noForm?: boolean;
  noCamp?: boolean;
  opensAt?: string | null;
  campSlug?: string;
}) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center space-y-5">
      <div className="w-16 h-16 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center mx-auto">
        <CalendarX className="w-8 h-8" />
      </div>
      <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900">
        {noCamp ? "Open your camp's registration link" : noForm ? `${name} registration is not ready yet` : `${label ?? name} registration is closed`}
      </h1>
      <p className="text-stone-600">
        {noCamp
          ? "This form was opened without a valid camp. Return to the link your camp sent you so your submission reaches the right office."
          : noForm
          ? "The camp office is still putting this year's questions together. Please check back soon."
          : opensAt
          ? `This form opens ${formatOpensAt(opensAt)}. Please come back then.`
          : "This form is not accepting responses right now. If the office sent you a private link, open that link directly — it carries the access token."}
      </p>
      <Link
        href={campSlug ? `/c/${encodeURIComponent(campSlug)}` : "/"}
        className="inline-block px-5 py-2.5 rounded-full bg-forest-800 text-white font-bold text-sm hover:bg-forest-900"
      >
        {campSlug ? "Back to camp page" : "Back to home"}
      </Link>
    </main>
  );
}

/** Same wording as the camp page; camps have no timezone setting yet. */
function formatOpensAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(iso));
}
